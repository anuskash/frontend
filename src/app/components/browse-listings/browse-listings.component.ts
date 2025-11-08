import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { MarketPlaceProduct } from '../../models/product.model';
import { MarketPlaceUser } from '../../models/marketplace-user.model';
import { ProductFilters } from '../shared/sidebar-filters/sidebar-filters.component';

@Component({
  selector: 'app-browse-listings',
  templateUrl: './browse-listings.component.html',
  standalone: false,
  styleUrls: ['./browse-listings.component.scss']
})
export class BrowseListingsComponent implements OnInit {
  allProducts: MarketPlaceProduct[] = [];
  filteredProducts: MarketPlaceProduct[] = [];
  isLoading = false;
  errorMessage = '';
  currentUserId: number | null = null;
  
  // Save/wishlist tracking
  savedProductIds: Set<number> = new Set();
  savingProducts: Set<number> = new Set();
  
  // Modal properties
  showContactModal = false;
  selectedSellerEmail = '';
  selectedSellerPhone = '';
  selectedSellerName = '';
  selectedProductName = '';
  isLoadingSellerInfo = false;

  // Product detail modal
  showProductDetailModal = false;
  selectedProductForDetail: MarketPlaceProduct | null = null;
  
  // Filter properties
  searchTerm = '';
  selectedCategory = '';
  selectedCondition = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = 'newest'; // newest, oldest, price-low, price-high

  // Available filter options
  categories: string[] = [];
  conditions: string[] = [];

  // Image carousel state
  currentImageIndex: { [productId: number]: number } = {};

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Get current user ID to filter out their own products
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.userId || null;
    
    this.loadAvailableProducts();
    if (this.currentUserId) {
      this.loadSavedProducts();
    }
  }

  loadAvailableProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.getAvailableProducts().subscribe({
      next: (products) => {
        // Filter out current user's own products - they should see those in "My Listings"
        this.allProducts = this.currentUserId 
          ? products.filter(p => p.sellerId !== this.currentUserId)
          : products;
          
        this.filteredProducts = [...this.allProducts];
        this.extractFilterOptions();
        this.applySorting();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private extractFilterOptions() {
    // Extract unique categories and conditions from products
    const categoriesSet = new Set<string>();
    const conditionsSet = new Set<string>();

    this.allProducts.forEach(product => {
      if (product.category) categoriesSet.add(product.category);
      if (product.condition) conditionsSet.add(product.condition);
    });

    this.categories = Array.from(categoriesSet).sort();
    this.conditions = Array.from(conditionsSet).sort();
  }

  applyFilters() {
    this.filteredProducts = this.allProducts.filter(product => {
      // Search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch = 
          product.productName.toLowerCase().includes(searchLower) ||
          product.productDescription?.toLowerCase().includes(searchLower) ||
          product.sellerName.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (this.selectedCategory && product.category !== this.selectedCategory) {
        return false;
      }

      // Condition filter
      if (this.selectedCondition && product.condition !== this.selectedCondition) {
        return false;
      }

      // Price range filter
      if (this.minPrice !== null && product.price < this.minPrice) {
        return false;
      }
      if (this.maxPrice !== null && product.price > this.maxPrice) {
        return false;
      }

      return true;
    });

    this.applySorting();
  }

  onFiltersChange(filters: ProductFilters) {
    this.searchTerm = filters.search || '';
    this.selectedCategory = filters.category || '';
    this.selectedCondition = filters.condition || '';
    this.minPrice = filters.minPrice ?? null;
    this.maxPrice = filters.maxPrice ?? null;
    this.sortBy = filters.sortBy || 'newest';
    this.applyFilters();
  }

  applySorting() {
    this.filteredProducts.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'oldest':
          return new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }

  onSortChange() {
    this.applySorting();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedCondition = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'newest';
    this.filteredProducts = [...this.allProducts];
    this.applySorting();
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  goBack() {
    this.router.navigate(['/user-dashboard']);
  }

  contactSeller(product: MarketPlaceProduct) {
    this.selectedProductName = product.productName;
    this.selectedSellerName = product.sellerName;
    this.showContactModal = true;
    this.isLoadingSellerInfo = true;
    
    // Clear previous data
    this.selectedSellerEmail = '';
    this.selectedSellerPhone = '';
    
    // Fetch real seller info from API
    this.userService.getSellerInfo(product.sellerId).subscribe({
      next: (sellerInfo: MarketPlaceUser) => {
        this.selectedSellerEmail = sellerInfo.email;
        this.selectedSellerPhone = sellerInfo.phoneNumber || '';
        this.isLoadingSellerInfo = false;
      },
      error: (error) => {
        console.error('Error fetching seller info:', error);
        // Fallback to generated email if API fails
        this.selectedSellerEmail = `${product.sellerName.toLowerCase().replace(/\s+/g, '.')}@student.uon.edu.au`;
        this.selectedSellerPhone = '';
        this.isLoadingSellerInfo = false;
      }
    });
  }

  closeContactModal() {
    this.showContactModal = false;
    this.selectedSellerEmail = '';
    this.selectedSellerPhone = '';
    this.selectedSellerName = '';
    this.selectedProductName = '';
    this.isLoadingSellerInfo = false;
  }

  copyEmailToClipboard() {
    navigator.clipboard.writeText(this.selectedSellerEmail).then(() => {
      // You could add a toast notification here
      console.log('Email copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy email: ', err);
    });
  }

  copyPhoneToClipboard() {
    navigator.clipboard.writeText(this.selectedSellerPhone).then(() => {
      console.log('Phone number copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy phone: ', err);
    });
  }

  openProductDetail(product: MarketPlaceProduct): void {
    this.selectedProductForDetail = product;
    this.showProductDetailModal = true;
  }

  closeProductDetail(): void {
    this.showProductDetailModal = false;
    this.selectedProductForDetail = null;
  }

  // Image carousel methods
  getProductImages(product: MarketPlaceProduct): string[] {
    if (product.productImages && product.productImages.length > 0) {
      return product.productImages;
    }
    if (product.productImageUrl) {
      return [product.productImageUrl];
    }
    return [];
  }

  getCurrentImage(product: MarketPlaceProduct): string {
    const images = this.getProductImages(product);
    if (images.length === 0) {
      return 'https://via.placeholder.com/300x200/f39c12/ffffff?text=No+Image';
    }
    const index = this.currentImageIndex[product.productId] || 0;
    return images[index];
  }

  hasMultipleImages(product: MarketPlaceProduct): boolean {
    return this.getProductImages(product).length > 1;
  }

  nextImage(product: MarketPlaceProduct, event: Event): void {
    event.stopPropagation();
    const images = this.getProductImages(product);
    if (images.length <= 1) return;
    
    const currentIndex = this.currentImageIndex[product.productId] || 0;
    this.currentImageIndex[product.productId] = (currentIndex + 1) % images.length;
  }

  // Load saved products into a Set for fast lookup
  loadSavedProducts(): void {
    this.userService.getSavedProducts().subscribe({
      next: (products) => {
        this.savedProductIds = new Set(products.map(p => p.productId));
      },
      error: (err) => {
        console.error('Failed to load saved products:', err);
        this.savedProductIds = new Set();
      }
    });
  }

  isProductSaved(productId: number): boolean {
    return this.savedProductIds.has(productId);
  }

  toggleSave(product: MarketPlaceProduct, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.savingProducts.has(product.productId)) return;

    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please log in to save products');
      return;
    }

    this.savingProducts.add(product.productId);
    const isCurrentlySaved = this.isProductSaved(product.productId);
    const productId = product.productId;

    const action$ = isCurrentlySaved
      ? this.userService.unsaveProduct(productId)
      : this.userService.saveProduct(productId);

    action$.subscribe({
      next: (resp: any) => {
        if (resp?.success === false) {
          this.toastService.error(resp.message || 'Operation failed');
        } else {
          if (isCurrentlySaved) {
            this.savedProductIds.delete(productId);
          } else {
            this.savedProductIds.add(productId);
          }
          const msg = resp?.message || (isCurrentlySaved ? 'Removed from saved products' : 'Product saved');
          this.toastService.success(msg);
        }
        this.savingProducts.delete(productId);
      },
      error: (err) => {
        console.error('Failed to toggle save:', err);
        this.toastService.error('Failed to update saved status');
        this.savingProducts.delete(productId);
      }
    });
  }

  previousImage(product: MarketPlaceProduct, event: Event): void {
    event.stopPropagation();
    const images = this.getProductImages(product);
    if (images.length <= 1) return;
    
    const currentIndex = this.currentImageIndex[product.productId] || 0;
    this.currentImageIndex[product.productId] = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
  }

  getImageIndicator(product: MarketPlaceProduct): string {
    const images = this.getProductImages(product);
    if (images.length <= 1) return '';
    const current = (this.currentImageIndex[product.productId] || 0) + 1;
    return `${current}/${images.length}`;
  }

  isSaving(productId: number): boolean {
    return this.savingProducts.has(productId);
  }
}
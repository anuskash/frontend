import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { MarketPlaceProduct, BuyerReviewRequest, BuyerReviewResponse, SellerReviewResponse } from '../../models/product.model';
import { MarketPlaceUser } from '../../models/marketplace-user.model';
import { ProductReviews } from '../../models/product-reviews.model';
import { ProductFilters } from '../shared/sidebar-filters/sidebar-filters.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-listings',
  standalone: false,
  templateUrl: './my-listings.component.html',
  styleUrls: ['./my-listings.component.scss']
})
export class MyListingsComponent implements OnInit {
  currentUser: User | null = null;
  myListings: MarketPlaceProduct[] = [];
  allUsers: MarketPlaceUser[] = [];
  
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  
  // Tab functionality
  activeTab: 'active' | 'sold' | 'archived' = 'active';
  
  // Modal state for marking as sold
  showSoldModal = false;
  selectedProductId: number | null = null;
  selectedBuyer: MarketPlaceUser | null = null;
  
  // Review modal state
  showReviewModal = false;
  buyerReview = {
    rating: 5,
    comment: ''
  };

  // Product reviews for sold items
  productReviews: { [productId: number]: ProductReviews } = {};
  loadingReviews: { [productId: number]: boolean } = {};
  
  // Add buyer review modal state
  showAddBuyerReviewModal = false;
  selectedProduct: MarketPlaceProduct | null = null;

  // Edit buyer review modal state
  showEditBuyerReviewModal = false;
  editingBuyerReview: BuyerReviewResponse | null = null;
  isEditingReview = false;
  editBuyerReview = {
    rating: 5,
    comment: ''
  };
  hoverRating = 0;

  // Product detail modal state
  showProductDetailModal = false;
  selectedProductForDetail: MarketPlaceProduct | null = null;

  // Sidebar filters
  categories: string[] = [];
  conditions: string[] = [];
  currentFilters: ProductFilters = { sortBy: 'newest' };

  // Image carousel state - track current image index for each product
  currentImageIndex: { [productId: number]: number } = {};

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private toast: ToastService
  ) {}

  // Safe display helpers for user names in buyer selection
  getUserDisplayName(u: MarketPlaceUser): string {
    const first = (u.firstName || '').trim();
    const last = (u.lastName || '').trim();
    if (first || last) return `${first} ${last}`.trim();
    // Fallback to email username
    return (u.email || '').split('@')[0] || 'User';
  }

  getUserInitials(u: MarketPlaceUser): string {
    const first = (u.firstName || '').trim();
    const last = (u.lastName || '').trim();
    if (first || last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    const handle = (u.email || '').split('@')[0] || 'UN';
    const parts = handle.split(/[\.\-_]/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    return handle.substring(0, 2).toUpperCase();
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadMyListings();
      this.loadAllUsers();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadAllUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users: MarketPlaceUser[]) => {
        this.allUsers = users;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadMyListings() {
    if (!this.currentUser) return;
    
    this.isLoading = true;
    this.clearMessages();

    this.userService.getProductsBySeller(this.currentUser.userId).subscribe({
      next: (products: MarketPlaceProduct[]) => {
        this.myListings = products;
        this.extractFilterOptions();
        // Load reviews for sold products
        this.loadReviewsForSoldProducts();
        this.isLoading = false;
        if (products.length === 0) {
          this.toast.info('You have no listings yet. Create your first listing!');
        }
      },
      error: (error: any) => {
        console.error('Error loading user listings:', error);
        this.errorMessage = 'Failed to load your listings';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  private extractFilterOptions() {
    const cats = new Set<string>();
    const conds = new Set<string>();
    this.myListings.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.condition) conds.add(p.condition);
    });
    this.categories = Array.from(cats).sort();
    this.conditions = Array.from(conds).sort();
  }

  loadReviewsForSoldProducts() {
    const soldProducts = this.myListings.filter(product => 
      product.status?.toLowerCase() === 'sold'
    );
    
    soldProducts.forEach(product => {
      this.loadProductReviews(product.productId);
    });
  }

  loadProductReviews(productId: number) {
    this.loadingReviews[productId] = true;
    
    this.userService.getProductReviews(productId).subscribe({
      next: (reviews: ProductReviews) => {
        console.log('Loaded reviews for product', productId, reviews);
        // Create new object reference to ensure change detection
        this.productReviews = { 
          ...this.productReviews, 
          [productId]: reviews 
        };
        this.loadingReviews[productId] = false;
      },
      error: (error: any) => {
        console.error('Error loading product reviews:', error);
        this.loadingReviews[productId] = false;
      }
    });
  }

  deleteProduct(productId: number) {
    if (!this.currentUser || !confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.userService.removeProduct(productId).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully!';
        this.toast.success('Listing deleted');
        this.loadMyListings(); // Reload the listings
      },
      error: (error: any) => {
        console.error('Error deleting product:', error);
        this.errorMessage = 'Failed to delete product';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  editProduct(productId: number) {
    this.router.navigate(['/edit-listing', productId]);
  }

  markAsSold(productId: number) {
    this.selectedProductId = productId;
    this.selectedBuyer = null;
    this.showSoldModal = true;
  }

  confirmMarkAsSold() {
    if (!this.currentUser || !this.selectedProductId || !this.selectedBuyer) {
      this.errorMessage = 'Please select a buyer';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.userService.markProductSold(this.selectedProductId, this.selectedBuyer.userId).subscribe({
      next: (updatedProduct: MarketPlaceProduct) => {
        this.successMessage = 'Product marked as sold successfully!';
        this.toast.success('Marked as sold');
        this.loadMyListings(); // Reload the listings to show updated status
        this.closeSoldModal();
        // Show review modal
        this.showReviewModal = true;
      },
      error: (error: any) => {
        console.error('Error marking product as sold:', error);
        this.errorMessage = 'Failed to mark product as sold';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  closeSoldModal() {
    this.showSoldModal = false;
    this.selectedProductId = null;
    this.selectedBuyer = null;
  }

  // Mark as archived functionality
  markAsArchived(productId: number) {
    this.isLoading = true;
    this.clearMessages();

    this.userService.updateProductStatus(productId, 'archived').subscribe({
      next: (updatedProduct: MarketPlaceProduct) => {
        this.successMessage = 'Product archived successfully!';
        this.toast.info('Listing archived');
        this.loadMyListings(); // Reload the listings to show updated status
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error archiving product:', error);
        this.errorMessage = 'Failed to archive product';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  // Mark as available functionality
  markAsAvailable(productId: number) {
    this.isLoading = true;
    this.clearMessages();

    this.userService.updateProductStatus(productId, 'available').subscribe({
      next: (updatedProduct: MarketPlaceProduct) => {
        this.successMessage = 'Product marked as available successfully!';
        this.toast.success('Listing set to available');
        this.loadMyListings(); // Reload the listings to show updated status
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error marking product as available:', error);
        this.errorMessage = 'Failed to mark product as available';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  submitBuyerReview() {
    if (!this.currentUser || !this.selectedBuyer || !this.selectedProductId) {
      this.closeReviewModal();
      return;
    }

    const reviewRequest: BuyerReviewRequest = {
      buyerId: this.selectedBuyer.userId,
      reviewerId: this.currentUser.userId,
      rating: this.buyerReview.rating,
      productId: this.selectedProductId,
      reviewText: this.buyerReview.comment
    };

    this.userService.addBuyerReview(reviewRequest).subscribe({
      next: () => {
        this.successMessage = 'Buyer review submitted successfully!';
        this.toast.success('Review submitted');
        this.closeReviewModal();
      },
      error: (error: any) => {
        console.error('Error submitting buyer review:', error);
        this.errorMessage = 'Failed to submit buyer review';
        this.toast.error(this.errorMessage);
        this.closeReviewModal();
      }
    });
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.buyerReview = { rating: 5, comment: '' };
  }

  isReviewValid(): boolean {
    return this.buyerReview.rating > 0 && this.buyerReview.comment.trim().length > 0;
  }

  createNewListing() {
    // Navigate to add listing page
    this.router.navigate(['/add-listing']);
  }

  getProductStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return 'status-active';
      case 'sold':
        return 'status-sold';
      case 'archived':
        return 'status-archived';
      case 'pending':
        return 'status-pending';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-unknown';
    }
  }

  getProductStatusIcon(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return 'fa-check-circle';
      case 'sold':
        return 'fa-handshake';
      case 'archived':
        return 'fa-archive';
      case 'pending':
        return 'fa-clock';
      case 'inactive':
        return 'fa-pause-circle';
      default:
        return 'fa-question-circle';
    }
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) {
      return 'Price not set';
    }
    return `$${price.toFixed(2)}`;
  }

  // Tab functionality methods
  switchTab(tab: 'active' | 'sold' | 'archived') {
    this.activeTab = tab;
    this.clearMessages();
  }



  get filteredListings(): MarketPlaceProduct[] {
    // Start with tab selection (status)
    let list = this.myListings.filter(product => {
      const status = product.status?.toLowerCase() || '';
      if (this.activeTab === 'sold') return status === 'sold';
      if (this.activeTab === 'archived') return status === 'archived';
      return status === 'available';
    });

    // Apply sidebar filters
    const f = this.currentFilters;
    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        p.productDescription?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (f.category) list = list.filter(p => p.category === f.category);
    if (f.condition) list = list.filter(p => p.condition === f.condition);
    if (f.minPrice != null) list = list.filter(p => (p.price ?? 0) >= (f.minPrice as number));
    if (f.maxPrice != null) list = list.filter(p => (p.price ?? 0) <= (f.maxPrice as number));
    if (f.status) list = list.filter(p => (p.status?.toLowerCase() || '') === f.status);

    // Sort
    switch (f.sortBy) {
      case 'price-low':
        list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price-high':
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'name':
        list.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.postedDate || 0).getTime() - new Date(b.postedDate || 0).getTime());
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime());
    }

    return list;
  }

  get activeListingsCount(): number {
    return this.myListings.filter(product => 
      product.status?.toLowerCase() === 'available'
    ).length;
  }

  get soldListingsCount(): number {
    return this.myListings.filter(product => 
      product.status?.toLowerCase() === 'sold'
    ).length;
  }

  get archivedListingsCount(): number {
    return this.myListings.filter(product => 
      product.status?.toLowerCase() === 'archived'
    ).length;
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  onFiltersChange(filters: ProductFilters) {
    this.currentFilters = filters;
  }

  // Helper methods for review functionality on sold products
  getBuyerReviewByCurrentUser(productId: number): BuyerReviewResponse | null {
    const reviews = this.productReviews[productId];
    if (!reviews) return null;
    
    // For a sold product, any buyer review was created by the seller (current user)
    return reviews.buyerReviews.length > 0 ? reviews.buyerReviews[0] : null;
  }

  getSellerReviewForCurrentUser(productId: number): SellerReviewResponse | null {
    const reviews = this.productReviews[productId];
    if (!reviews) return null;
    
    // For a sold product, any seller review was created by the buyer about the seller (current user)
    return reviews.sellerReviews.length > 0 ? reviews.sellerReviews[0] : null;
  }

  canAddBuyerReview(product: MarketPlaceProduct): boolean {
    return product.status?.toLowerCase() === 'sold' && 
           !!product.buyerId && 
           !this.getBuyerReviewByCurrentUser(product.productId);
  }

  openAddBuyerReviewModal(product: MarketPlaceProduct) {
    this.selectedProduct = product;
    this.showAddBuyerReviewModal = true;
    this.buyerReview = { rating: 5, comment: '' };
  }

  closeAddBuyerReviewModal() {
    this.showAddBuyerReviewModal = false;
    this.selectedProduct = null;
    this.buyerReview = { rating: 5, comment: '' };
  }

  submitNewBuyerReview() {
    if (!this.currentUser || !this.selectedProduct || !this.selectedProduct.buyerId) {
      this.closeAddBuyerReviewModal();
      return;
    }

    const reviewRequest: BuyerReviewRequest = {
      buyerId: this.selectedProduct.buyerId,
      reviewerId: this.currentUser.userId,
      rating: this.buyerReview.rating,
      productId: this.selectedProduct.productId,
      reviewText: this.buyerReview.comment
    };

    this.userService.addBuyerReview(reviewRequest).subscribe({
      next: () => {
        this.successMessage = 'Buyer review submitted successfully!';
        this.toast.success('Review submitted');
        
        // Store productId before closing modal
        const productId = this.selectedProduct!.productId;
        this.closeAddBuyerReviewModal();
        
        // Fetch updated reviews from API
        this.loadProductReviews(productId);
      },
      error: (error: any) => {
        console.error('Error submitting buyer review:', error);
        this.errorMessage = 'Failed to submit buyer review';
        this.toast.error(this.errorMessage);
        this.closeAddBuyerReviewModal();
      }
    });
  }

  // Edit buyer review functionality
  openEditBuyerReviewModal(review: BuyerReviewResponse, product: MarketPlaceProduct) {
    this.editingBuyerReview = review;
    this.selectedProduct = product;
    this.editBuyerReview = {
      rating: review.rating,
      comment: review.reviewText
    };
    this.showEditBuyerReviewModal = true;
  }

  closeEditBuyerReviewModal() {
    this.showEditBuyerReviewModal = false;
    this.editingBuyerReview = null;
    this.selectedProduct = null;
    this.isEditingReview = false;
    this.editBuyerReview = { rating: 5, comment: '' };
  }

  submitEditBuyerReview() {
    if (!this.currentUser || !this.editingBuyerReview || !this.selectedProduct) {
      this.closeEditBuyerReviewModal();
      return;
    }

    this.isEditingReview = true;
    this.clearMessages();

    const reviewRequest: BuyerReviewRequest = {
      buyerId: this.selectedProduct.buyerId!,
      reviewerId: this.currentUser.userId,
      rating: this.editBuyerReview.rating,
      productId: this.selectedProduct.productId,
      reviewText: this.editBuyerReview.comment
    };

    this.userService.updateBuyerReview(this.editingBuyerReview.reviewId, reviewRequest).subscribe({
      next: () => {
        this.successMessage = 'Buyer review updated successfully!';
        this.toast.success('Review updated');
        this.isEditingReview = false;
        
        // Store productId before closing modal
        const productId = this.selectedProduct!.productId;
        this.closeEditBuyerReviewModal();
        
        // Fetch updated reviews from API
        this.loadProductReviews(productId);
      },
      error: (error: any) => {
        console.error('Error updating buyer review:', error);
        this.errorMessage = 'Failed to update buyer review';
        this.toast.error(this.errorMessage);
        this.isEditingReview = false;
        this.closeEditBuyerReviewModal();
      }
    });
  }

  isEditReviewValid(): boolean {
    return !!this.editBuyerReview.comment && 
           this.editBuyerReview.comment.trim().length >= 10 && 
           this.editBuyerReview.rating >= 1 && 
           this.editBuyerReview.rating <= 5;
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
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
    // Use productImages array if available, otherwise fallback to single productImageUrl
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
    event.stopPropagation(); // Prevent opening product detail
    const images = this.getProductImages(product);
    if (images.length <= 1) return;
    
    const currentIndex = this.currentImageIndex[product.productId] || 0;
    this.currentImageIndex[product.productId] = (currentIndex + 1) % images.length;
  }

  previousImage(product: MarketPlaceProduct, event: Event): void {
    event.stopPropagation(); // Prevent opening product detail
    const images = this.getProductImages(product);
    if (images.length <= 1) return;
    
    const currentIndex = this.currentImageIndex[product.productId] || 0;
    this.currentImageIndex[product.productId] = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
  }

  getImageIndicator(product: MarketPlaceProduct): string {
    const images = this.getProductImages(product);
    if (images.length <= 1) return '';
    
    const currentIndex = this.currentImageIndex[product.productId] || 0;
    return `${currentIndex + 1}/${images.length}`;
  }

  goBack() {
    this.router.navigate(['/user-dashboard']);
  }

  logout() {
    this.authService.removeCurrentUser();
    this.router.navigate(['/login']);
  }
}
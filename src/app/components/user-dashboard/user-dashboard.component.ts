import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MessagingService } from '../../services/messaging.service';
import { User } from '../../models/user.model';
import { UserProfile } from '../../models/user-profile.model';
import { MarketPlaceUser } from '../../models/marketplace-user.model';
import { MarketPlaceProduct, SellerReviewResponse, AverageRating } from '../../models/product.model';
import { MyReviews } from '../../models/my-reviews.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  standalone: false,
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentProfile: UserProfile | null = null;
  marketplaceUser: MarketPlaceUser | null = null;
  myListings: MarketPlaceProduct[] = [];
  recentListings: MarketPlaceProduct[] = [];
  myPurchases: MarketPlaceProduct[] = [];
  myReviews: MyReviews | null = null;
  
  // Marketplace products
  allProducts: MarketPlaceProduct[] = [];
  filteredProducts: MarketPlaceProduct[] = [];
  
  // Filter properties
  selectedCategory: string = '';
  searchQuery: string = '';
  sortBy: string = 'recent';
  
  isLoading = false;
  isLoadingReviews = false;
  isLoadingPurchases = false;
  isLoadingProducts = false;
  showUserMenu = false;
  showMobileMenu = false;
  unreadMessagesCount = 0;
  savedProductsCount = 0;

  // Image carousel state
  currentImageIndex: { [productId: number]: number } = {};

  // Subscriptions
  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messagingService: MessagingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.userId) {
      // Load profile for name display
      this.userService.getUserProfile(this.currentUser.userId).subscribe({
        next: (profile) => (this.currentProfile = profile),
        error: (err) => console.warn('Could not load user profile', err)
      });
      // Fallback: also try marketplace user info for names if profile is empty
      this.userService.getSellerInfo(this.currentUser.userId).subscribe({
        next: (mpUser) => (this.marketplaceUser = mpUser),
        error: (err) => console.warn('Could not load marketplace user info', err)
      });

      // Subscribe to unread messages count and set up polling
      this.messagingService.refreshUnreadCount(this.currentUser.userId);
      this.subs.push(
        this.messagingService.unreadCount$.subscribe((c) => (this.unreadMessagesCount = c || 0))
      );
      this.subs.push(
        interval(30000).subscribe(() => this.messagingService.refreshUnreadCount(this.currentUser!.userId))
      );
    }
    this.loadMyListings();
    this.loadMyPurchases();
    this.loadMyReviews();
    this.loadMarketplaceProducts();
    this.loadSavedProductsCount();
  }

  private loadSavedProductsCount() {
    if (!this.currentUser?.userId) return;
    // Updated to use new API - no userId parameter
    this.userService.getSavedProducts().subscribe({
      next: (savedProducts) => {
        this.savedProductsCount = savedProducts.length;
      },
      error: () => {
        this.savedProductsCount = 0;
      }
    });
  }

  private loadMarketplaceProducts() {
    this.isLoadingProducts = true;
    this.userService.getAvailableProducts().subscribe({
      next: (products) => {
        // Filter out current user's own products - they should see those in "My Listings"
        this.allProducts = this.currentUser?.userId
          ? products.filter(p => p.sellerId !== this.currentUser!.userId)
          : products;
          
        this.applyFilters();
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading marketplace products:', error);
        this.isLoadingProducts = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.productDescription?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => {
          const dateA = new Date(a.postedDate || 0).getTime();
          const dateB = new Date(b.postedDate || 0).getTime();
          return dateB - dateA;
        });
        break;
    }

    // Limit to first 12 products for dashboard
    this.filteredProducts = filtered.slice(0, 12);
  }

  private loadMyListings() {
    if (!this.currentUser?.userId) return;
    
    this.isLoading = true;
    this.userService.getProductsBySeller(this.currentUser.userId).subscribe({
      next: (products) => {
        this.myListings = products;
        // Get recent active listings (last 5 active items)
        this.recentListings = products
          .filter(product => product.status?.toLowerCase() !== 'sold')
          .slice(0, 5);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading listings:', error);
        this.isLoading = false;
      }
    });
  }

  private loadMyPurchases() {
    if (!this.currentUser?.userId) return;
    
    this.isLoadingPurchases = true;
    this.userService.getProductsByBuyer(this.currentUser.userId).subscribe({
      next: (products) => {
        this.myPurchases = products;
        this.isLoadingPurchases = false;
      },
      error: (error) => {
        console.error('Error loading purchases:', error);
        this.isLoadingPurchases = false;
      }
    });
  }

  private loadMyReviews() {
    if (!this.currentUser?.userId) return;
    
    this.isLoadingReviews = true;
    this.userService.getMyReviews(this.currentUser.userId).subscribe({
      next: (reviews: MyReviews) => {
        this.myReviews = reviews;
        this.isLoadingReviews = false;
      },
      error: (error: any) => {
        console.error('Error loading reviews:', error);
        this.isLoadingReviews = false;
      }
    });
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  get totalListingsCount(): number {
    return this.myListings.length;
  }

  get activeListingsCount(): number {
    return this.myListings.filter(product => 
      product.status?.toLowerCase() !== 'sold'
    ).length;
  }

  get soldListingsCount(): number {
    return this.myListings.filter(product => 
      product.status?.toLowerCase() === 'sold'
    ).length;
  }

  get totalPurchasesCount(): number {
    return this.myPurchases.length;
  }

  get completedPurchasesCount(): number {
    return this.myPurchases.filter(product => 
      product.status?.toLowerCase() === 'sold'
    ).length;
  }

  get totalSpent(): number {
    return this.myPurchases.reduce((total, product) => {
      return total + (product.price || 0);
    }, 0);
  }

  formatPrice(price?: number): string {
    return price ? `$${price.toFixed(2)}` : 'N/A';
  }

  // Count of reviews we received as buyer (buyerId = our userId)
  getAsBuyerReviewsCount(): number {
    if (!this.myReviews?.buyerReviews || !this.currentUser) return 0;
    return this.myReviews.buyerReviews.filter(review => 
      review.buyerId === this.currentUser!.userId
    ).length;
  }

  // Count of reviews we received as seller (sellerId = our userId)
  getAsSellerReviewsCount(): number {
    if (!this.myReviews?.sellerReviews || !this.currentUser) return 0;
    return this.myReviews.sellerReviews.filter(review => 
      review.sellerId === this.currentUser!.userId
    ).length;
  }

  // Count of reviews we gave to buyers (reviewerId = our userId in buyer reviews)
  getToBuyerReviewsCount(): number {
    if (!this.myReviews?.buyerReviews || !this.currentUser) return 0;
    return this.myReviews.buyerReviews.filter(review => 
      review.reviewerId === this.currentUser!.userId
    ).length;
  }

  // Count of reviews we gave to sellers (reviewerId = our userId in seller reviews)
  getToSellerReviewsCount(): number {
    if (!this.myReviews?.sellerReviews || !this.currentUser) return 0;
    return this.myReviews.sellerReviews.filter(review => 
      review.reviewerId === this.currentUser!.userId
    ).length;
  }

  // Calculate total reviews received (as buyer + as seller)
  getTotalReviewsReceived(): number {
    return this.getAsBuyerReviewsCount() + this.getAsSellerReviewsCount();
  }

  // Navigation methods for hero stat cards
  navigateToMyListings(): void {
    this.router.navigate(['/my-listings']);
  }

  navigateToMyPurchases(): void {
    this.router.navigate(['/my-purchases']);
  }

  navigateToMyReviews(): void {
    this.router.navigate(['/my-reviews']);
  }

  // Calculate total reviews given (to buyer + to seller)
  getTotalReviewsGiven(): number {
    return this.getToBuyerReviewsCount() + this.getToSellerReviewsCount();
  }

  // Method to refresh reviews data (can be called from other components)
  refreshReviews(): void {
    this.loadMyReviews();
  }

  // Calculate average rating we gave to buyers
  getAverageRatingGivenToBuyers(): number {
    if (!this.myReviews?.buyerReviews?.length) return 0;
    const total = this.myReviews.buyerReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return total / this.myReviews.buyerReviews.length;
  }

  // Calculate average rating we gave to sellers (placeholder)
  getAverageRatingGivenToSellers(): number {
    // This would need backend support
    return 0;
  }

  onLogout() {
    this.authService.removeCurrentUser();
    this.router.navigate(['/login']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToMyListings() {
    this.router.navigate(['/my-listings']);
  }

  goToAddListing() {
    this.router.navigate(['/add-listing']);
  }

  goToMyReviews() {
    this.router.navigate(['/my-reviews']);
  }

  goToBrowseListings() {
    this.router.navigate(['/browse-listings']);
  }

  goToMyPurchases() {
    this.router.navigate(['/my-purchases']);
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  openMessages() {
    this.router.navigate(['/messages']);
  }

  getRelativeTime(date: Date | string): string {
    if (!date) return 'recently';
    
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/placeholder.svg';
    event.target.onerror = null; // Prevent infinite loop
  }

  getUserName(): string {
    if (this.currentProfile?.firstName) {
      const last = this.currentProfile.lastName ? ` ${this.currentProfile.lastName.charAt(0).toUpperCase()}.` : '';
      return `${this.currentProfile.firstName}${last}`;
    }
    if (this.marketplaceUser?.firstName) {
      const last = this.marketplaceUser.lastName ? ` ${this.marketplaceUser.lastName.charAt(0).toUpperCase()}.` : '';
      return `${this.marketplaceUser.firstName}${last}`;
    }
    if (this.currentUser?.email) return this.currentUser.email.split('@')[0];
    return 'User';
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
      return 'assets/placeholder.svg';
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
    
    const currentIndex = this.currentImageIndex[product.productId] || 0;
    return `${currentIndex + 1}/${images.length}`;
  }

  navigateToSavedProducts(): void {
    this.router.navigate(['/saved-products']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { MarketPlaceProduct, SellerReviewRequest, SellerReviewResponse, BuyerReviewResponse } from '../../models/product.model';
import { ProductReviews } from '../../models/product-reviews.model';
import { ProductFilters } from '../shared/sidebar-filters/sidebar-filters.component';

@Component({
  selector: 'app-my-purchases',
  templateUrl: './my-purchases.component.html',
  standalone: false,
  styleUrls: ['./my-purchases.component.scss']
})
export class MyPurchasesComponent implements OnInit {
  currentUser: User | null = null;
  myPurchases: MarketPlaceProduct[] = [];
  productReviews: Map<number, ProductReviews> = new Map(); // Map of productId -> ProductReviews
  isLoading = false;
  isLoadingReviews = false;
  errorMessage = '';

  // Sidebar filter state
  categories: string[] = [];
  conditions: string[] = [];
  currentFilters: ProductFilters = { sortBy: 'newest' };

  // Review modal properties
  showReviewModal = false;
  selectedProduct: MarketPlaceProduct | null = null;
  existingSellerReview: SellerReviewResponse | null = null;
  isEditMode = false;
  
  // Review form properties
  reviewRating = 0;
  reviewText = '';
  isSubmittingReview = false;

  // Error modal properties
  showErrorModal = false;
  errorModalTitle = '';
  errorModalMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadMyPurchases();
  }

  loadMyPurchases(): void {
    if (!this.currentUser?.userId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.getProductsByBuyer(this.currentUser.userId).subscribe({
      next: (products) => {
        this.myPurchases = products;
        this.extractFilterOptions();
        this.isLoading = false;
        // Load reviews after purchases are loaded
        this.loadMyReviews();
      },
      error: (error) => {
        console.error('Error loading purchases:', error);
        this.errorMessage = 'Failed to load your purchases. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private extractFilterOptions() {
    const cats = new Set<string>();
    const conds = new Set<string>();
    this.myPurchases.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.condition) conds.add(p.condition);
    });
    this.categories = Array.from(cats).sort();
    this.conditions = Array.from(conds).sort();
  }

  loadMyReviews(): void {
    if (!this.currentUser?.userId) {
      console.log('No current user, skipping review loading');
      return;
    }
    
    if (this.myPurchases.length === 0) {
      console.log('No purchases found, skipping review loading');
      return;
    }
    
    console.log(`Loading reviews for ${this.myPurchases.length} purchased products`);
    this.isLoadingReviews = true;
    
    // Load reviews for each purchased product (same pattern as My Listings)
    this.myPurchases.forEach(product => {
      console.log(`Loading reviews for product ID: ${product.productId}`);
      this.loadProductReviews(product.productId);
    });
  }

  loadProductReviews(productId: number) {
    this.userService.getProductReviews(productId).subscribe({
      next: (reviews: ProductReviews) => {
        console.log('Loaded reviews for product', productId, reviews);
        // Store reviews in the map (similar to My Listings but using Map instead of object)
        this.productReviews.set(productId, reviews);
        this.isLoadingReviews = false;
      },
      error: (error: any) => {
        console.error('Error loading product reviews:', error);
        this.isLoadingReviews = false;
      }
    });
  }

  // Helper methods for review functionality (similar to My Listings but from buyer perspective)
  
  // Get seller review created by current user (buyer reviewing seller)
  getSellerReviewByCurrentUser(productId: number): SellerReviewResponse | null {
    const reviews = this.productReviews.get(productId);
    if (!reviews) return null;
    
    // For a purchased product, any seller review was created by the buyer (current user) about the seller
    return reviews.sellerReviews.length > 0 ? reviews.sellerReviews[0] : null;
  }

  // Get buyer review for current user (seller reviewing the buyer - read only)
  getBuyerReviewForCurrentUser(productId: number): BuyerReviewResponse | null {
    const reviews = this.productReviews.get(productId);
    if (!reviews) return null;
    
    // For a purchased product, any buyer review was created by the seller about the buyer (current user)
    return reviews.buyerReviews.length > 0 ? reviews.buyerReviews[0] : null;
  }

  // Check if current user can add seller review
  canAddSellerReview(productId: number): boolean {
    return !this.getSellerReviewByCurrentUser(productId);
  }

  // Get all buyer reviews for a product (for display)
  getBuyerReviews(productId: number): BuyerReviewResponse[] {
    const reviews = this.productReviews.get(productId);
    return reviews ? reviews.buyerReviews : [];
  }

  // Get all seller reviews for a product (for display)
  getSellerReviews(productId: number): SellerReviewResponse[] {
    const reviews = this.productReviews.get(productId);
    return reviews ? reviews.sellerReviews : [];
  }

  openReviewModal(product: MarketPlaceProduct, existingReview: SellerReviewResponse | null = null) {
    this.selectedProduct = product;
    this.existingSellerReview = existingReview;
    this.isEditMode = !!existingReview;
    
    if (existingReview) {
      this.reviewRating = existingReview.rating;
      this.reviewText = existingReview.reviewText;
    } else {
      this.reviewRating = 0;
      this.reviewText = '';
    }
    
    this.showReviewModal = true;
  }

  closeReviewModal() {
    console.log('closeReviewModal called, setting showReviewModal to false');
    this.showReviewModal = false;
    this.selectedProduct = null;
    this.existingSellerReview = null;
    this.isEditMode = false;
    this.reviewRating = 0;
    this.reviewText = '';
    this.isSubmittingReview = false;
    console.log('Modal should be closed now, showReviewModal =', this.showReviewModal);
  }

  setRating(rating: number) {
    this.reviewRating = rating;
  }

  showError(title: string, message: string) {
    this.errorModalTitle = title;
    this.errorModalMessage = message;
    this.showErrorModal = true;
  }

  closeErrorModal() {
    this.showErrorModal = false;
    this.errorModalTitle = '';
    this.errorModalMessage = '';
  }

  submitReview() {
    if (!this.selectedProduct || !this.currentUser?.userId || this.reviewRating === 0) return;

    const reviewRequest: SellerReviewRequest = {
      reviewerId: this.currentUser.userId,
      sellerId: this.selectedProduct.sellerId, // The seller being reviewed
      rating: this.reviewRating,
      productId: this.selectedProduct.productId,
      reviewText: this.reviewText.trim()
    };

    if (this.isEditMode && this.existingSellerReview) {
      // Update existing review
      console.log('Updating review with ID:', this.existingSellerReview.reviewId, 'Request:', reviewRequest);
      this.userService.updateSellerReview(this.existingSellerReview.reviewId, reviewRequest).subscribe({
        next: () => {
          console.log('Review updated successfully');
          
          // Store productId before closing modal (same pattern as my-listings)
          const productId = this.selectedProduct!.productId;
          this.closeReviewModal();
          
          // Refresh just this product's reviews (same as my-listings)
          this.loadProductReviews(productId);
        },
        error: (error) => {
          console.error('Error updating review:', error);
          this.closeReviewModal();
          this.showError('Update Failed', 'Failed to update your review. Please try again later.');
        }
      });
    } else {
      // Add new review
      console.log('Adding new review:', reviewRequest);
      this.userService.addSellerReview(reviewRequest).subscribe({
        next: () => {
          console.log('Review added successfully');
          
          // Store productId before closing modal
          const productId = this.selectedProduct!.productId;
          this.closeReviewModal();
          
          // Refresh just this product's reviews
          this.loadProductReviews(productId);
        },
        error: (error) => {
          console.error('Error adding review:', error);
          this.closeReviewModal();
          this.showError('Submit Failed', 'Failed to submit your review. Please try again later.');
        }
      });
    }
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getFilledStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0).map((_, i) => i);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0).map((_, i) => i);
  }

  goBack() {
    this.router.navigate(['/user-dashboard']);
  }

  goToBrowseListings() {
    this.router.navigate(['/browse-listings']);
  }

  onFiltersChange(filters: ProductFilters) {
    this.currentFilters = filters;
  }

  get filteredPurchases(): MarketPlaceProduct[] {
    let list = [...this.myPurchases];
    const f = this.currentFilters;
    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        p.productDescription?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sellerName?.toLowerCase().includes(q)
      );
    }
    if (f.category) list = list.filter(p => p.category === f.category);
    if (f.condition) list = list.filter(p => p.condition === f.condition);
    if (f.minPrice != null) list = list.filter(p => (p.price ?? 0) >= (f.minPrice as number));
    if (f.maxPrice != null) list = list.filter(p => (p.price ?? 0) <= (f.maxPrice as number));

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
}
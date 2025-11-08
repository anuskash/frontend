import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { MyReviews } from '../../models/my-reviews.model';
import { SellerReviewResponse, BuyerReviewResponse } from '../../models/product.model';

@Component({
  selector: 'app-my-reviews',
  standalone: false,
  templateUrl: './my-reviews.component.html',
  styleUrl: './my-reviews.component.scss'
})
export class MyReviewsComponent implements OnInit {
  myReviews: MyReviews | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  activeTab: 'as-seller' | 'as-buyer' | 'to-buyer' | 'to-seller' = 'as-seller';
  expandedProducts: Set<number> = new Set();
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMyReviews();
  }

  loadMyReviews() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.userService.getMyReviews(currentUser.userId).subscribe({
      next: (reviews) => {
        console.log('My Reviews loaded:', reviews);
        this.myReviews = reviews;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.errorMessage = 'Failed to load reviews. Please try again.';
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'as-seller' | 'as-buyer' | 'to-buyer' | 'to-seller') {
    this.activeTab = tab;
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Reviews we received as seller (sellerId = our userId)
  getAsSellerReviews(): SellerReviewResponse[] {
    if (!this.myReviews) return [];
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    
    return this.myReviews.sellerReviews.filter(review => 
      review.sellerId === currentUser.userId
    );
  }

  // Reviews we received as buyer (buyerId = our userId) 
  getAsBuyerReviews(): BuyerReviewResponse[] {
    if (!this.myReviews) return [];
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    
    return this.myReviews.buyerReviews.filter(review => 
      review.buyerId === currentUser.userId
    );
  }

  // Reviews we gave to buyers (reviewerId = our userId in buyer reviews)
  getToBuyerReviews(): BuyerReviewResponse[] {
    if (!this.myReviews) return [];
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    
    return this.myReviews.buyerReviews.filter(review => 
      review.reviewerId === currentUser.userId
    );
  }

  // Reviews we gave to sellers (reviewerId = our userId in seller reviews)
  getToSellerReviews(): SellerReviewResponse[] {
    if (!this.myReviews) return [];
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    
    return this.myReviews.sellerReviews.filter(review => 
      review.reviewerId === currentUser.userId
    );
  }

  getToBuyerReviewsCount(): number {
    return this.getToBuyerReviews().length;
  }

  getToSellerReviewsCount(): number {
    return this.getToSellerReviews().length;
  }

  toggleProductDetails(reviewId: number) {
    if (this.expandedProducts.has(reviewId)) {
      this.expandedProducts.delete(reviewId);
    } else {
      this.expandedProducts.add(reviewId);
    }
  }

  isProductExpanded(reviewId: number): boolean {
    return this.expandedProducts.has(reviewId);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  goToMyListings() {
    this.router.navigate(['/my-listings']);
  }

  goToMyPurchases() {
    this.router.navigate(['/my-purchases']);
  }
}

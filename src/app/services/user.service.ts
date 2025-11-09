import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Import all required models
import { UserProfile } from '../models/user-profile.model';
import { MarketPlaceUser } from '../models/marketplace-user.model';
import { 
  MarketPlaceProduct, 
  MarketPlaceProductRequest,
  SellerReviewRequest,
  SellerReviewResponse,
  BuyerReviewRequest,
  BuyerReviewResponse,
  ContentModerationResult 
} from '../models/product.model';
import { ProductReviews } from '../models/product-reviews.model';
import { MyReviews } from '../models/my-reviews.model';

// Saved Products Interfaces
export interface SavedProduct {
  savedId: number;
  userId: number;
  productId: number;
  savedDate: string; // ISO datetime
}

export interface SaveProductResponse {
  success: boolean;
  message: string;
  savedId?: number;
}

export interface RemoveSavedProductResponse {
  success: boolean;
  message: string;
}

export interface CheckSavedProductResponse {
  productId: number;
  isSaved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = environment.baseUrl;
  private endpoints = environment.endpoints;

  constructor(private http: HttpClient) {}

  // =================================================================
  // USER MANAGEMENT ENDPOINTS
  // =================================================================

  /**
   * GET /users/all/users
   * Get all marketplace users
   */
  getAllUsers(): Observable<MarketPlaceUser[]> {
    const url = `${this.baseUrl}${this.endpoints.users.getAllUsers}`;
    return this.http.get<MarketPlaceUser[]>(url);
  }

  /**
   * GET /users/seller-info/{sellerId}
   * Get seller information by seller ID
   */
  getSellerInfo(sellerId: number): Observable<MarketPlaceUser> {
    const url = `${this.baseUrl}${this.endpoints.users.getSellerInfo.replace('{sellerId}', sellerId.toString())}`;
    return this.http.get<MarketPlaceUser>(url);
  }

  // =================================================================
  // USER PROFILE ENDPOINTS
  // =================================================================

  /**
   * GET /users/profile/{userId}
   * Get user profile by user ID
   */
  getUserProfile(userId: number): Observable<UserProfile> {
    const url = `${this.baseUrl}${this.endpoints.users.profile}/${userId}`;
    return this.http.get<UserProfile>(url);
  }

  /**
   * PUT /users/profile/{userId}/picture
   * Update user profile picture
   */
  updateProfilePicture(userId: number, newProfileImageUrl: string): Observable<UserProfile> {
    const url = `${this.baseUrl}${this.endpoints.users.updateProfilePicture.replace('{userId}', userId.toString())}`;
    const params = new HttpParams().set('newProfileImageUrl', newProfileImageUrl);
    return this.http.put<UserProfile>(url, null, { params });
  }

  /**
   * PUT /users/profile/{userId}/phone
   * Update user phone number
   */
  updatePhoneNumber(userId: number, newPhoneNumber: string): Observable<UserProfile> {
    const url = `${this.baseUrl}${this.endpoints.users.updatePhone.replace('{userId}', userId.toString())}`;
    const params = new HttpParams().set('newPhoneNumber', newPhoneNumber);
    return this.http.put<UserProfile>(url, null, { params });
  }

  /**
   * PUT /users/reset-password
   * Reset user password
   */
  resetPassword(userId: number, newPassword: string): Observable<string> {
    const url = `${this.baseUrl}/users/reset-password`;
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('newPassword', newPassword);
    return this.http.put<string>(url, null, { params });
  }

  // =================================================================
  // PRODUCT MANAGEMENT ENDPOINTS
  // =================================================================

  /**
   * POST /users/product
   * Add a new marketplace product
   */
  addProduct(product: MarketPlaceProductRequest): Observable<MarketPlaceProduct> {
    const url = `${this.baseUrl}${this.endpoints.users.addProduct}`;
    return this.http.post<MarketPlaceProduct>(url, product);
  }

  /**
   * PUT /users/product/{productId}
   * Update full product details (requires userId header)
   */
  updateProduct(productId: number, userId: number, product: MarketPlaceProductRequest): Observable<MarketPlaceProduct> {
    const url = `${this.baseUrl}/users/product/${productId}`;
    const headers = { 'userId': userId.toString() };
    return this.http.put<MarketPlaceProduct>(url, product, { headers });
  }

  /**
   * PUT /users/product/{productId}/status
   * Update product status
   */
  updateProductStatus(productId: number, newStatus: string): Observable<MarketPlaceProduct> {
    const url = `${this.baseUrl}${this.endpoints.users.updateProductStatus.replace('{productId}', productId.toString())}`;
    const params = new HttpParams().set('newStatus', newStatus);
    return this.http.put<MarketPlaceProduct>(url, null, { params });
  }

  /**
   * PUT /users/product/{productId}/sold
   * Mark product as sold
   */
  markProductSold(productId: number, buyerUserId: number): Observable<MarketPlaceProduct> {
    const url = `${this.baseUrl}${this.endpoints.users.markProductSold.replace('{productId}', productId.toString())}`;
    const params = new HttpParams().set('buyerUserId', buyerUserId.toString());
    return this.http.put<MarketPlaceProduct>(url, null, { params });
  }

  /**
   * DELETE /users/product/{productId}
   * Remove/delete product
   */
  removeProduct(productId: number): Observable<void> {
    const url = `${this.baseUrl}${this.endpoints.users.removeProduct.replace('{productId}', productId.toString())}`;
    return this.http.delete<void>(url);
  }

  /**
   * PUT /users/product/{productId}/unavailable
   * Mark product as archived (backend endpoint is still /unavailable)
   */
  markProductArchived(productId: number): Observable<MarketPlaceProduct> {
    const url = `${this.baseUrl}${this.endpoints.users.markProductArchived.replace('{productId}', productId.toString())}`;
    return this.http.put<MarketPlaceProduct>(url, null);
  }

  /**
   * PUT /users/product/{productId}/price
   * Update product price
   */
  updateProductPrice(productId: number, newPrice: number): Observable<MarketPlaceProduct> {
    const url = `${this.baseUrl}${this.endpoints.users.updateProductPrice.replace('{productId}', productId.toString())}`;
    const params = new HttpParams().set('newPrice', newPrice.toString());
    return this.http.put<MarketPlaceProduct>(url, null, { params });
  }

  /**
   * PUT /users/product/{productId}/images
   * Update product images
   */
  updateProductImages(productId: number, imageUrls: string[]): Observable<{ productId: number; updated: boolean; count: number }> {
    const url = `${this.baseUrl}/users/product/${productId}/images`;
    return this.http.put<{ productId: number; updated: boolean; count: number }>(url, { imageUrls });
  }

  /**
   * POST /users/test-moderation
   * Test content moderation for a product before submission
   */
  testModeration(product: MarketPlaceProductRequest): Observable<ContentModerationResult> {
    const url = `${this.baseUrl}/users/test-moderation`;
    return this.http.post<ContentModerationResult>(url, product);
  }

  // =================================================================
  // PRODUCT RETRIEVAL ENDPOINTS
  // =================================================================

  /**
   * GET /users/products/seller/{sellerId}
   * Get all products by seller
   */
  getProductsBySeller(sellerId: number): Observable<MarketPlaceProduct[]> {
    const url = `${this.baseUrl}${this.endpoints.users.getProductsBySeller.replace('{sellerId}', sellerId.toString())}`;
    return this.http.get<MarketPlaceProduct[]>(url);
  }

  /**
   * GET /users/products/buyer/{buyerId}
   * Get all products purchased by buyer
   */
  getProductsByBuyer(buyerId: number): Observable<MarketPlaceProduct[]> {
    const url = `${this.baseUrl}${this.endpoints.users.getProductsByBuyer.replace('{buyerId}', buyerId.toString())}`;
    return this.http.get<MarketPlaceProduct[]>(url);
  }

  /**
   * GET /users/products/available
   * Get all available products
   */
  getAvailableProducts(): Observable<MarketPlaceProduct[]> {
    const url = `${this.baseUrl}${this.endpoints.users.getAvailableProducts}`;
    return this.http.get<MarketPlaceProduct[]>(url);
  }

  /**
   * GET /users/product/{productId}/images
   * Fetch all image URLs for a specific product
   */
  fetchProductImageUrls(productId: number): Observable<{ productId: number; imageUrls: string[]; count: number }> {
    const url = `${this.baseUrl}${this.endpoints.users.getProductImages.replace('{productId}', productId.toString())}`;
    return this.http.get<{ productId: number; imageUrls: string[]; count: number }>(url);
  }

  /**
   * GET /users/product-reviews/{productId}
   * Get all reviews for a specific product
   */
  getProductReviews(productId: number): Observable<ProductReviews> {
    const url = `${this.baseUrl}${this.endpoints.users.getProductReviews.replace('{productId}', productId.toString())}`;
    return this.http.get<ProductReviews>(url);
  }

  /**
   * GET /users/my-reviews/{userId}
   * Get comprehensive review data for a user
   */
  getMyReviews(userId: number): Observable<MyReviews> {
    const url = `${this.baseUrl}${this.endpoints.users.getMyReviews.replace('{userId}', userId.toString())}`;
    return this.http.get<MyReviews>(url);
  }

  // =================================================================
  // SELLER REVIEW ENDPOINTS
  // =================================================================

  /**
   * GET /users/reviews/seller/{sellerId}
   * Get all reviews for a seller
   */
  getSellerReviews(sellerId: number): Observable<SellerReviewResponse[]> {
    const url = `${this.baseUrl}${this.endpoints.sellerReviews.getReviewsForSeller.replace('{sellerId}', sellerId.toString())}`;
    return this.http.get<SellerReviewResponse[]>(url);
  }

  /**
   * GET /users/reviews/reviewer/{reviewerId}
   * Get all seller reviews by a reviewer
   */
  getSellerReviewsByReviewer(reviewerId: number): Observable<SellerReviewResponse[]> {
    const url = `${this.baseUrl}${this.endpoints.sellerReviews.getReviewsByReviewer.replace('{reviewerId}', reviewerId.toString())}`;
    return this.http.get<SellerReviewResponse[]>(url);
  }

  /**
   * POST /users/reviews
   * Add a seller review
   */
  addSellerReview(review: SellerReviewRequest): Observable<SellerReviewResponse> {
    const url = `${this.baseUrl}${this.endpoints.sellerReviews.addReview}`;
    return this.http.post<SellerReviewResponse>(url, review);
  }

  /**
   * PUT /users/reviews/{reviewId}
   * Update a seller review
   */
  updateSellerReview(reviewId: number, review: SellerReviewRequest): Observable<SellerReviewResponse> {
    const url = `${this.baseUrl}${this.endpoints.sellerReviews.updateReview.replace('{reviewId}', reviewId.toString())}`;
    return this.http.put<SellerReviewResponse>(url, review);
  }

  // =================================================================
  // BUYER REVIEW ENDPOINTS
  // =================================================================

  /**
   * GET /users/buyer-reviews/buyer/{buyerId}
   * Get all reviews for a buyer
   */
  getBuyerReviews(buyerId: number): Observable<BuyerReviewResponse[]> {
    const url = `${this.baseUrl}${this.endpoints.buyerReviews.getReviewsForBuyer.replace('{buyerId}', buyerId.toString())}`;
    return this.http.get<BuyerReviewResponse[]>(url);
  }

  /**
   * GET /users/buyer-reviews/reviewer/{reviewerId}
   * Get all buyer reviews by a reviewer
   */
  getBuyerReviewsByReviewer(reviewerId: number): Observable<BuyerReviewResponse[]> {
    const url = `${this.baseUrl}${this.endpoints.buyerReviews.getReviewsByReviewer.replace('{reviewerId}', reviewerId.toString())}`;
    return this.http.get<BuyerReviewResponse[]>(url);
  }

  /**
   * POST /users/buyer-reviews
   * Add a buyer review
   */
  addBuyerReview(review: BuyerReviewRequest): Observable<BuyerReviewResponse> {
    const url = `${this.baseUrl}${this.endpoints.buyerReviews.addReview}`;
    return this.http.post<BuyerReviewResponse>(url, review);
  }

  /**
   * PUT /users/buyer-reviews/{reviewId}
   * Update a buyer review
   */
  updateBuyerReview(reviewId: number, review: BuyerReviewRequest): Observable<BuyerReviewResponse> {
    const url = `${this.baseUrl}${this.endpoints.buyerReviews.updateReview.replace('{reviewId}', reviewId.toString())}`;
    return this.http.put<BuyerReviewResponse>(url, review);
  }

  // =================================================================
  // SAVED PRODUCTS ENDPOINTS (align with backend: query param + JSON response)
  // =================================================================

  /**
   * POST /users/saved-products?productId=14
   * Header: userId
   * Response: { success: boolean, message: string, savedId?: number }
   */
  saveProduct(productId: number): Observable<SaveProductResponse> {
    const params = new HttpParams().set('productId', String(productId));
    return this.http.post<SaveProductResponse>(`${this.baseUrl}/users/saved-products`, null, { params });
  }

  /**
   * DELETE /users/saved-products/{productId}
   * Header: userId
   * Response: { success: boolean, message: string }
   */
  unsaveProduct(productId: number): Observable<RemoveSavedProductResponse> {
    return this.http.delete<RemoveSavedProductResponse>(`${this.baseUrl}/users/saved-products/${productId}`);
  }

  /**
   * GET /users/saved-products
   * Response: MarketPlaceProduct[] (full product objects)
   */
  getSavedProducts(): Observable<MarketPlaceProduct[]> {
    return this.http.get<MarketPlaceProduct[]>(`${this.baseUrl}/users/saved-products`);
  }

  /**
   * GET /users/saved-products/check/{productId}
   * Response: { productId, isSaved }
   */
  isProductSaved(productId: number): Observable<CheckSavedProductResponse> {
    return this.http.get<CheckSavedProductResponse>(`${this.baseUrl}/users/saved-products/check/${productId}`);
  }

  /**
   * Helper to get current user ID from local storage
   */
  private getCurrentUserId(): number | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.userId || null;
  }

  // =================================================================
  // REPORT ENDPOINTS
  // =================================================================

  /**
   * POST /api/reports/product
   * Report a product for inappropriate content
   * Note: userId is automatically added to headers by AuthInterceptor
   */
  reportProduct(reportData: { productId: number; reportReason: string; reportDetails?: string }): Observable<void> {
    const url = `${this.baseUrl}/api/reports/product`;
    console.log('Submitting product report:', reportData);
    return this.http.post<void>(url, reportData);
  }

  // =================================================================
  // UTILITY HELPER METHODS
  // =================================================================

  /**
   * Helper method to replace multiple path parameters
   */
  private replacePath(template: string, params: { [key: string]: string | number }): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`{${key}}`, value.toString());
    }
    return result;
  }
}
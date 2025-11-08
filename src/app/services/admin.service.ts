import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserRequest, AppUserResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface AdminCreateUserResponse {
  appUser: AppUserResponse;
  userProfile: {
    profileId: number;
    userId: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profileImageUrl: string;
  };
}

export interface BuyerReview {
  reviewId: number;
  reviewerId: number;
  buyerId: number;
  buyerName: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  category: string;
  condition: string;
  flagged?: boolean;
  hidden?: boolean;
  flagReason?: string;
}

export interface SellerReview {
  reviewId: number;
  reviewerId: number;
  sellerId: number;
  reviewerName: string;
  reviewText: string;
  rating: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  sellerName: string;
  category: string;
  condition: string;
  flagged?: boolean;
  hidden?: boolean;
  flagReason?: string;
}

export interface MarketPlaceUser {
  userId: number;
  email: string;
  role?: string;
  status?: string;
  createdAt?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface MarketPlaceProduct {
  productId: number;
  sellerId: number;
  sellerName: string;
  buyerId?: number;
  buyerName?: string;
  productName: string;
  category: string;
  condition: string;
  productDescription: string;
  productImageUrl: string;
  productImages?: string[]; // optional multiple images
  price: number;
  postedDate: string;
  lastUpdate: string;
  status: string;
  flagged?: boolean; // moderation flag
}

export interface AdminUserProfile {
  userDetails: MarketPlaceUser;
  sellerReviewsGiven: SellerReview[];
  sellerReviewsReceived: SellerReview[];
  buyerReviewsGiven: BuyerReview[];
  buyerReviewsReceived: BuyerReview[];
  productsListed: MarketPlaceProduct[];
  productsPurchased: MarketPlaceProduct[];
  totalProductsListed: number;
  totalProductsPurchased: number;
  totalSellerReviewsGiven: number;
  totalSellerReviewsReceived: number;
  totalBuyerReviewsGiven: number;
  totalBuyerReviewsReceived: number;
  averageSellerRating: number;
  averageBuyerRating: number;
}

export interface ProductReport {
  reportId: number;
  productId: number;
  productName?: string;
  reporterUserId: number;
  reporterEmail?: string;
  reportReason: string;
  reportDetails?: string;
  status: 'pending' | 'approved' | 'rejected';
  reportedAt: string;
  reviewedAt?: string;
  reviewedByAdminId?: number;
  adminNotes?: string;
  actionTaken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.baseUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Creates a new user with "active" status
   * POST /admin/create-user
   */
  createUser(createUserRequest: CreateUserRequest): Observable<AdminCreateUserResponse> {
    return this.http.post<AdminCreateUserResponse>(`${this.apiUrl}/create-user`, createUserRequest);
  }

  /**
   * Creates a new admin user with "admin" role and "active" status
   * POST /admin/create-admin
   */
  createAdmin(createUserRequest: CreateUserRequest): Observable<AdminCreateUserResponse> {
    return this.http.post<AdminCreateUserResponse>(`${this.apiUrl}/create-admin`, createUserRequest);
  }

  /**
   * Resets a user's password using their email address
   * POST /admin/reset-password
   */
  resetPassword(email: string, newPassword: string): Observable<string> {
    const params = new HttpParams()
      .set('email', email)
      .set('newPassword', newPassword);
    
    return this.http.post(`${this.apiUrl}/reset-password`, null, { 
      params,
      responseType: 'text'
    });
  }

  /**
   * Retrieves a list of all users in the system with their profiles
   * GET /admin/users
   */
  getAllUsers(): Observable<AdminCreateUserResponse[]> {
    return this.http.get<AdminCreateUserResponse[]>(`${this.apiUrl}/users`);
  }

  /**
   * Retrieves all buyer reviews for a specific user
   * GET /admin/buyer-reviews/{userId}
   */
  getBuyerReviews(userId: number): Observable<BuyerReview[]> {
    return this.http.get<BuyerReview[]>(`${this.apiUrl}/buyer-reviews/${userId}`);
  }

  /**
   * Retrieves all seller reviews for a specific user
   * GET /admin/seller-reviews/{userId}
   */
  getSellerReviews(userId: number): Observable<SellerReview[]> {
    return this.http.get<SellerReview[]>(`${this.apiUrl}/seller-reviews/${userId}`);
  }

  /**
   * Bans a user by setting their status to "banned"
   * POST /admin/ban-user/{userId}
   */
  banUser(userId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/ban-user/${userId}`, null, {
      responseType: 'text'
    });
  }

  /**
   * Unbans a user by setting their status back to "active"
   * POST /admin/unban-user/{userId}
   */
  unbanUser(userId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/unban-user/${userId}`, null, {
      responseType: 'text'
    });
  }

  /**
   * Verifies a user by setting their status from "Pending Verification" to "active"
   * PUT /admin/verify-user/{userId}
   */
  verifyUser(userId: number): Observable<AppUserResponse> {
    return this.http.put<AppUserResponse>(`${this.apiUrl}/verify-user/${userId}`, null);
  }

  /**
   * Permanently deletes a user from the system
   * DELETE /admin/delete-user/{userId}
   */
  deleteUser(userId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete-user/${userId}`, {
      responseType: 'text'
    });
  }

  /**
   * Gets comprehensive user profile information for admin view
   * GET /admin/user-profile/{userId}
   */
  getUserProfile(userId: number): Observable<AdminUserProfile> {
    return this.http.get<AdminUserProfile>(`${this.apiUrl}/user-profile/${userId}`);
  }

  /**
   * Gets user profile by email
   * GET /admin/user-profile/by-email?email={email}
   */
  getUserProfileByEmail(email: string): Observable<AdminUserProfile> {
    const params = new HttpParams().set('email', email);
    return this.http.get<AdminUserProfile>(`${this.apiUrl}/user-profile/by-email`, { params });
  }

  /**
   * Helper method to get all reviews for a user (both buyer and seller)
   */
  getAllUserReviews(userId: number): Observable<{
    buyerReviews: BuyerReview[];
    sellerReviews: SellerReview[];
  }> {
    return new Observable(observer => {
      // Use forkJoin to make both requests simultaneously
      const buyerReviews$ = this.getBuyerReviews(userId);
      const sellerReviews$ = this.getSellerReviews(userId);

      // Simple implementation without forkJoin to avoid additional imports
      let buyerReviews: BuyerReview[] = [];
      let sellerReviews: SellerReview[] = [];
      let completedRequests = 0;

      buyerReviews$.subscribe({
        next: (reviews) => {
          buyerReviews = reviews;
          completedRequests++;
          if (completedRequests === 2) {
            observer.next({ buyerReviews, sellerReviews });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });

      sellerReviews$.subscribe({
        next: (reviews) => {
          sellerReviews = reviews;
          completedRequests++;
          if (completedRequests === 2) {
            observer.next({ buyerReviews, sellerReviews });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ===== Moderation: Listings =====
  /**
   * Gets products flagged for moderation
   * GET /admin/products/flagged
   */
  getFlaggedProducts(): Observable<MarketPlaceProduct[]> {
    return this.http.get<MarketPlaceProduct[]>(`${this.apiUrl}/products/flagged`);
  }

  /**
   * Remove flag from a product
   * POST /admin/products/{productId}/unflag
   */
  unflagProduct(productId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/products/${productId}/unflag`, null, { 
      responseType: 'text'
    });
  }

  /**
   * Hide product from public view
   * POST /admin/products/{productId}/hide
   * Headers: userId (adminId - automatically added)
   * Optional query param: reason
   */
  hideProduct(productId: number, reason?: string): Observable<{ success: boolean; message: string; productId: number }> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.post<{ success: boolean; message: string; productId: number }>(
      `${this.apiUrl}/products/${productId}/hide`, 
      null, 
      { params }
    );
  }

  /**
   * Restore hidden product to public view
   * POST /admin/products/{productId}/unhide
   * Headers: userId (adminId - automatically added)
   */
  unhideProduct(productId: number): Observable<{ success: boolean; message: string; productId: number }> {
    return this.http.post<{ success: boolean; message: string; productId: number }>(
      `${this.apiUrl}/products/${productId}/unhide`, 
      null
    );
  }

  /**
   * Delete a listing (legacy method)
   * DELETE /admin/listings/:id
   */
  deleteListing(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/listings/${productId}`, { responseType: 'text' as 'json' });
  }

  // ===== Moderation: Product Reports =====
  /**
   * Get all pending product reports for moderation
   * GET /admin/reports/pending
   */
  getPendingReports(): Observable<ProductReport[]> {
    return this.http.get<ProductReport[]>(`${this.apiUrl}/reports/pending`);
  }

  /**
   * Admin reviews and acts on a product report
   * POST /admin/reports/{reportId}/review
   * 
   * @param reportId - ID of the report to review
   * @param action - "approved" | "rejected" | "remove_product"
   * @param adminNotes - Optional admin notes
   */
  reviewReport(reportId: number, action: 'approved' | 'rejected' | 'remove_product', adminNotes?: string): Observable<string> {
    const params = new HttpParams()
      .set('action', action)
      .set('adminNotes', adminNotes || '');
    
    return this.http.post(`${this.apiUrl}/reports/${reportId}/review`, null, {
      params,
      responseType: 'text'
    });
  }

  // ===== Moderation: Reviews =====
  /**
   * Get all seller reviews for moderation
   * GET /admin/reviews/seller/all
   * Response includes flagged, hidden, flagReason fields
   */
  getAllSellerReviews(): Observable<SellerReview[]> {
    return this.http.get<SellerReview[]>(`${this.apiUrl}/reviews/seller/all`);
  }

  /**
   * Get all buyer reviews for moderation
   * GET /admin/reviews/buyer/all
   * Response includes flagged, hidden, flagReason fields
   */
  getAllBuyerReviews(): Observable<BuyerReview[]> {
    return this.http.get<BuyerReview[]>(`${this.apiUrl}/reviews/buyer/all`);
  }

  /**
   * Flag a seller review
   * POST /admin/reviews/seller/{reviewId}/flag
   * Headers: userId (adminId - automatically added)
   * Optional query param: reason
   */
  flagSellerReview(reviewId: number, reason?: string): Observable<string> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.post(`${this.apiUrl}/reviews/seller/${reviewId}/flag`, null, { 
      params,
      responseType: 'text'
    });
  }

  /**
   * Flag a buyer review
   * POST /admin/reviews/buyer/{reviewId}/flag
   * Headers: userId (adminId - automatically added)
   * Optional query param: reason
   */
  flagBuyerReview(reviewId: number, reason?: string): Observable<string> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.post(`${this.apiUrl}/reviews/buyer/${reviewId}/flag`, null, { 
      params,
      responseType: 'text'
    });
  }

  /**
   * Hide seller review from public view
   * POST /admin/reviews/seller/{reviewId}/hide
   * Headers: userId (adminId - automatically added)
   */
  hideSellerReview(reviewId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/reviews/seller/${reviewId}/hide`, null, { 
      responseType: 'text'
    });
  }

  /**
   * Hide buyer review from public view
   * POST /admin/reviews/buyer/{reviewId}/hide
   * Headers: userId (adminId - automatically added)
   */
  hideBuyerReview(reviewId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/reviews/buyer/${reviewId}/hide`, null, { 
      responseType: 'text'
    });
  }

  /**
   * Permanently delete seller review
   * DELETE /admin/reviews/seller/{reviewId}
   * Headers: userId (adminId - automatically added)
   */
  deleteSellerReview(reviewId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/reviews/seller/${reviewId}`, { 
      responseType: 'text'
    });
  }

  /**
   * Permanently delete buyer review
   * DELETE /admin/reviews/buyer/{reviewId}
   * Headers: userId (adminId - automatically added)
   */
  deleteBuyerReview(reviewId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/reviews/buyer/${reviewId}`, { 
      responseType: 'text'
    });
  }

  /**
   * @deprecated Use getAllSellerReviews() and getAllBuyerReviews() instead
   * Fetch all reviews (seller + buyer) for moderation with optional filters
   * GET /admin/reviews
   */
  getAllReviews(filter?: { flaggedOnly?: boolean; type?: 'buyer'|'seller'; q?: string }): Observable<(BuyerReview|SellerReview)[]> {
    let params = new HttpParams();
    if (filter?.flaggedOnly) params = params.set('flagged', 'true');
    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.q) params = params.set('q', filter.q);
    return this.http.get<(BuyerReview|SellerReview)[]>(`${this.apiUrl}/reviews`, { params });
  }

  /**
   * @deprecated Use getAllSellerReviews() and getAllBuyerReviews() with filter instead
   * Get flagged reviews
   * GET /admin/reviews/flagged
   */
  getFlaggedReviews(): Observable<(BuyerReview|SellerReview)[]> {
    return this.http.get<(BuyerReview|SellerReview)[]>(`${this.apiUrl}/reviews/flagged`);
  }

  /**
   * @deprecated Use flagSellerReview() or flagBuyerReview() instead
   * Flag a review as abusive
   * POST /admin/reviews/:id/flag
   */
  flagReview(reviewId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews/${reviewId}/flag`, null, { responseType: 'text' as 'json' });
  }

  /**
   * @deprecated Use deleteSellerReview() or deleteBuyerReview() instead
   * Delete a review
   * DELETE /admin/reviews/:id
   */
  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${reviewId}`, { responseType: 'text' as 'json' });
  }

  // ===== Settings: Prohibited Keywords =====
  /**
   * Get all prohibited keywords
   * GET /admin/prohibited-keywords
   */
  getProhibitedKeywords(): Observable<ProhibitedKeyword[]> {
    return this.http.get<ProhibitedKeyword[]>(`${this.apiUrl}/prohibited-keywords`);
  }

  /**
   * Get keywords by category
   * GET /admin/prohibited-keywords/category/{category}
   */
  getProhibitedKeywordsByCategory(category: string): Observable<ProhibitedKeyword[]> {
    return this.http.get<ProhibitedKeyword[]>(`${this.apiUrl}/prohibited-keywords/category/${category}`);
  }

  /**
   * Add new prohibited keyword
   * POST /admin/prohibited-keywords
   */
  addProhibitedKeyword(payload: CreateProhibitedKeyword): Observable<ProhibitedKeyword> {
    // Ensure we send the payload with all required fields properly formatted
    const normalizedPayload: any = {
      keyword: payload.keyword?.trim(),
      severity: payload.severity || 'medium',
      autoAction: payload.autoAction || 'flag'
    };
    
    // Add optional fields if provided
    if (payload.category && payload.category.trim() !== '') {
      normalizedPayload.category = payload.category.trim();
    }
    
    if (payload.description && payload.description.trim() !== '') {
      normalizedPayload.description = payload.description.trim();
    }
    
    console.log('Sending prohibited keyword payload:', normalizedPayload);
    
    return this.http.post<ProhibitedKeyword>(`${this.apiUrl}/prohibited-keywords`, normalizedPayload);
  }

  /**
   * Delete prohibited keyword
   * DELETE /admin/prohibited-keywords/{keywordId}
   */
  deleteProhibitedKeyword(keywordId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/prohibited-keywords/${keywordId}`, { 
      responseType: 'text'
    });
  }

  // ===== Audit Log =====
  /**
   * GET /admin/audit-logs
   * Get all audit log entries
   * Response: List<AuditLog>
   * Note: Currently returns all logs, frontend can implement filtering
   */
  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`);
  }

  /**
   * @deprecated Use getAuditLogs() instead - old endpoint with filters
   * GET /admin/audit
   */
  getAuditLogsLegacy(filter?: { email?: string; action?: string; from?: string; to?: string }): Observable<AuditLogEntry[]> {
    let params = new HttpParams();
    if (filter?.email) params = params.set('email', filter.email);
    if (filter?.action) params = params.set('action', filter.action);
    if (filter?.from) params = params.set('from', filter.from);
    if (filter?.to) params = params.set('to', filter.to);
    return this.http.get<AuditLogEntry[]>(`${this.apiUrl}/audit`, { params });
  }
}

// ===== Interfaces for new Admin APIs =====
export interface ProhibitedKeyword {
  id: number;
  keyword: string;
  category?: string;
  description?: string;
  severity: 'low'|'medium'|'high';
  autoAction: 'flag'|'reject'|'remove';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProhibitedKeyword {
  keyword: string;
  category?: string;
  description?: string;
  severity?: 'low'|'medium'|'high';
  autoAction?: 'flag'|'reject'|'remove';
}

export interface AuditLog {
  id: number;
  timestamp: string; // ISO datetime "2025-11-08T01:00:00"
  userId: number;
  action: string; // e.g., "BAN_USER", "DELETE_PRODUCT", "FLAG_REVIEW"
  targetType: string; // e.g., "USER", "PRODUCT", "REVIEW"
  targetId: string;
  details?: string; // VARCHAR 2000
}

export interface AuditLogEntry {
  auditId: number;
  adminUserId?: number;
  adminEmail: string;
  action: string;
  targetUserId?: number;
  targetEmail?: string;
  timestamp: string; // ISO
  details?: string;
}
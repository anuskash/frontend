export interface MarketPlaceProductRequest {
  sellerId: number;
  productDescription: string;
  productImageUrl?: string; // Deprecated: use imageUrls instead
  imageUrls?: string[]; // New: array of image URLs
  productName: string;
  price: number;
  condition: string;
  category: string;
  status?: string; // New: AVAILABLE, SOLD, ARCHIVED
}

export interface CreateProductRequest extends MarketPlaceProductRequest {
  // Alias for creating new products
}

export interface UpdateProductRequest {
  sellerId?: number;
  productDescription?: string;
  productImageUrl?: string;
  productName?: string;
  price?: number;
  quantity?: number;
  condition?: string;
  category?: string;
}

export interface SellerReviewRequest {
  reviewerId: number;
  sellerId: number;
  rating: number;
  productId: number;
  reviewText: string;
}

export interface CreateSellerReviewRequest extends SellerReviewRequest {
  // Alias for creating new seller reviews
}

export interface UpdateSellerReviewRequest {
  reviewerId?: number;
  sellerId?: number;
  rating?: number;
  productId?: number;
  reviewText?: string;
}

export interface BuyerReviewRequest {
  reviewerId: number;
  buyerId: number;
  rating: number;
  productId: number;
  reviewText: string;
}

export interface CreateBuyerReviewRequest extends BuyerReviewRequest {
  // Alias for creating new buyer reviews
}

export interface UpdateBuyerReviewRequest {
  reviewerId?: number;
  buyerId?: number;
  rating?: number;
  productId?: number;
  reviewText?: string;
}

export interface AverageRating {
  averageRating: number;
  totalReviews: number;
}

export interface BuyerReviewResponse {
  reviewId: number;
  buyerName: string;
  reviewerId: number;
  buyerId: number;
  reviewerName: string;
  rating: number;
  reviewText: string;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  category: string;
  condition: string;
}

export interface SellerReviewResponse {
  reviewId: number;
  reviewerName: string;
  sellerId: number;
  reviewerId: number;
  reviewText: string;
  rating: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  sellerName: string;
  category: string;
  condition: string;
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
  productDescription?: string;
  productImageUrl?: string;
  productImages?: string[]; // Multiple image URLs
  price: number;
  postedDate: string;
  lastUpdate?: string;
  status: string;
  flagged?: boolean; // Admin moderation flag
}
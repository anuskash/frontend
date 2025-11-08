import { BuyerReviewResponse, SellerReviewResponse } from './product.model';

export interface MyReviews {
  userId: number;
  sellerReviews: SellerReviewResponse[];
  buyerReviews: BuyerReviewResponse[];
  totalReviews: number;
  averageBuyerRatingReceived: number;
  averageSellerRatingReceived: number;
  totalReviewsGiven: number;
  totalReviewsReceived: number;
}
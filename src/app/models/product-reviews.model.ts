import { BuyerReviewResponse, SellerReviewResponse } from './product.model';

export interface ProductReviews {
  productId: number;
  buyerReviews: BuyerReviewResponse[];
  sellerReviews: SellerReviewResponse[];
}
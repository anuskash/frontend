
# UserController Endpoints — Parameters, Request Bodies & Return Types


## User Profile & Product Endpoints

- `GET /users/profile/{userId}`
  - **Path Variable:** `userId` (Long)
  - **Returns:** `UserProfile` (JSON)

- `PUT /users/profile/{userId}/picture`
  - **Path Variable:** `userId` (Long)
  - **Request Param:** `newProfileImageUrl` (String)
  - **Returns:** `UserProfile` (JSON)

- `PUT /users/profile/{userId}/phone`
  - **Path Variable:** `userId` (Long)
  - **Request Param:** `newPhoneNumber` (String)
  - **Returns:** `UserProfile` (JSON)

- `POST /users/product`
  - **Request Body:** `MarketPlaceProductRequest` (JSON)
  - **Returns:** `MarketPlaceProduct` (JSON)
  - Notes:
    - Prefer `imageUrls: string[]` for one or many images. `productImageUrl` is deprecated and retained for backward compatibility.

- `PUT /users/product/{productId}/status`
  - **Path Variable:** `productId` (Long)
  - **Request Param:** `newStatus` (String)
  - **Returns:** `MarketPlaceProduct` (JSON)

- `PUT /users/product/{productId}/sold`
  - **Path Variable:** `productId` (Long)
  - **Request Param:** `buyerUserId` (Long)
  - **Returns:** `MarketPlaceProduct` (JSON)

- `DELETE /users/product/{productId}`
  - **Path Variable:** `productId` (Long)
  - **Returns:** HTTP 204 No Content

- `PUT /users/product/{productId}/unavailable` (Frontend displays as "Archive")
  - **Path Variable:** `productId` (Long)
  - **Returns:** `MarketPlaceProduct` (JSON)

- `PUT /users/product/{productId}/price`
  - **Path Variable:** `productId` (Long)
  - **Request Param:** `newPrice` (BigDecimal)
  - **Returns:** `MarketPlaceProduct` (JSON)

- `GET /users/products/seller/{sellerId}`
  - **Path Variable:** `sellerId` (Long)
  - **Returns:** `List<MarketPlaceProduct>` (JSON array)

- `GET /users/products/buyer/{buyerId}`
  - **Path Variable:** `buyerId` (Long)
  - **Returns:** `List<MarketPlaceProduct>` (JSON array)

- `GET /users/products/available`
  - No parameters
  - **Returns:** `List<MarketPlaceProduct>` (JSON array)

### Product Image Uploads

- `POST /users/product/upload-image`
  - **Multipart Form Data:** `file` (single image file)
  - **Returns:** `{ imageUrl: string, message: string }`

- `POST /users/product/upload-multiple-images`
  - **Multipart Form Data:** `files` (multiple image files; repeat the key for each file)
  - **Returns:** `{ imageUrls: string[], count: number, message: string }`
  - Usage: Upload images first, then pass the returned `imageUrls` array to `POST /users/product` in the `imageUrls` field.

- `GET /users/product/{productId}/images`
  - **Path Variable:** `productId` (Long)
  - **Returns:** `{ productId: number, imageUrls: string[], count: number }`


## Seller Review Endpoints

- `GET /users/reviews/seller/{sellerId}`
  - **Path Variable:** `sellerId` (Long)
  - **Returns:** `List<SellerReviewResponse>` (JSON array)

- `GET /users/reviews/reviewer/{reviewerId}`
  - **Path Variable:** `reviewerId` (Long)
  - **Returns:** `List<SellerReviewResponse>` (JSON array)

- `POST /users/reviews/seller`
  - **Request Body:** `SellerReviewRequest` (JSON)
  - **Returns:** `SellerReviewResponse` (JSON)

- `PUT /users/reviews/seller/{reviewId}`
  - **Path Variable:** `reviewId` (Long)
  - **Request Body:** `SellerReviewRequest` (JSON)
  - **Returns:** `SellerReviewResponse` (JSON)


## Buyer Review Endpoints

- `GET /users/buyer-reviews/buyer/{buyerId}`
  - **Path Variable:** `buyerId` (Long)
  - **Returns:** `List<BuyerReviewResponse>` (JSON array)

- `GET /users/buyer-reviews/reviewer/{reviewerId}`
  - **Path Variable:** `reviewerId` (Long)
  - **Returns:** `List<BuyerReviewResponse>` (JSON array)

- `POST /users/buyer-reviews`
  - **Request Body:** `BuyerReviewRequest` (JSON)
  - **Returns:** `BuyerReviewResponse` (JSON)

- `PUT /users/buyer-reviews/{reviewId}`
  - **Path Variable:** `reviewId` (Long)
  - **Request Body:** `BuyerReviewRequest` (JSON)
  - **Returns:** `BuyerReviewResponse` (JSON)


## Other

- `PUT /users/reset-password`
  - **Request Param:** `userId` (Long)
  - **Request Param:** `newPassword` (String)
  - **Returns:** `String` (success message)

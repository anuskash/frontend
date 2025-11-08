export const environment = {
  production: true,
  baseUrl: 'http://localhost:8080',
  
  // API Endpoints
  endpoints: {
    // Authentication
    auth: {
      login: '/auth/login',
      logout: '/auth/logout'
    },
    
    // User Profile & Product Endpoints
    users: {
      profile: '/users/profile',
      updateProfilePicture: '/users/profile/{userId}/picture',
      updatePhone: '/users/profile/{userId}/phone',
      addProduct: '/users/product',
      uploadSingleImage: '/users/product/upload-image',
      uploadMultipleImages: '/users/product/upload-multiple-images',
      updateProductStatus: '/users/product/{productId}/status',
      markProductSold: '/users/product/{productId}/sold',
      removeProduct: '/users/product/{productId}',
      markProductArchived: '/users/product/{productId}/unavailable',
      updateProductPrice: '/users/product/{productId}/price',
      getProductsBySeller: '/users/products/seller/{sellerId}',
      getProductsByBuyer: '/users/products/buyer/{buyerId}',
      getAvailableProducts: '/users/products/available',
      getProductImages: '/users/product/{productId}/images',
      getAllUsers: '/users/all/users',
      getSellerInfo: '/users/seller-info/{sellerId}',
      getProductReviews: '/users/product-reviews/{productId}',
      getMyReviews: '/users/my-reviews/{userId}'
    },
    
    // Seller Review Endpoints
    sellerReviews: {
      getReviewsForSeller: '/users/reviews/seller/{sellerId}',
      getReviewsByReviewer: '/users/reviews/reviewer/{reviewerId}',
      addReview: '/users/reviews/seller',
      updateReview: '/users/reviews/{reviewId}'
    },
    
    // Buyer Review Endpoints
    buyerReviews: {
      getReviewsForBuyer: '/users/buyer-reviews/buyer/{buyerId}',
      getReviewsByReviewer: '/users/buyer-reviews/reviewer/{reviewerId}',
      addReview: '/users/buyer-reviews',
      updateReview: '/users/buyer-reviews/{reviewId}'
    },
    // Messaging Endpoints
    messaging: {
      send: '/messages/send', // query: senderId
      conversations: '/messages/conversations', // query: userId
      conversation: '/messages/conversation', // query: userId, otherUserId, productId
      unreadCount: '/messages/unread-count', // query: userId
      markRead: '/messages/{messageId}/mark-read' // query: userId
    }
  }
};
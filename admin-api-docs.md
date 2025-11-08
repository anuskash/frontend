# Admin Controller API Documentation

The AdminController provides administrative functionalities for managing users, reviews, and user access control in the marketplace application.

**Base URL:** `/admin`

---

## 1. Create User

**Endpoint:** `POST /admin/create-user`

**Description:** Creates a new user with "active" status. This is an admin-only functionality for creating users directly.

**Request Body:**
```json
{
  "appUser": {
    "email": "user@example.com",
    "password": "securePassword123"
  },
  "userProfile": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "profileImageUrl": "https://example.com/profile.jpg"
  }
}
```

**Response Body:**
```json
{
  "appUser": {
    "userId": 1,
    "role": "user",
    "passwordHash": null,
    "status": "active",
    "email": "user@example.com",
    "createdAt": "2025-11-02T10:30:00"
  },
  "userProfile": {
    "profileId": 1,
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "profileImageUrl": "https://example.com/profile.jpg"
  }
}
```

---

## 2. Create Admin

**Endpoint:** `POST /admin/create-admin`

**Description:** Creates a new admin user with "admin" role and "active" status.

**Request Body:**
```json
{
  "appUser": {
    "email": "admin@example.com",
    "password": "adminPassword123"
  },
  "userProfile": {
    "firstName": "Admin",
    "lastName": "User",
    "phoneNumber": "+1234567890",
    "profileImageUrl": "https://example.com/admin-profile.jpg"
  }
}
```

**Response Body:**
```json
{
  "appUser": {
    "userId": 2,
    "role": "admin",
    "passwordHash": null,
    "status": "active",
    "email": "admin@example.com",
    "createdAt": "2025-11-02T10:30:00"
  },
  "userProfile": {
    "profileId": 2,
    "userId": 2,
    "firstName": "Admin",
    "lastName": "User",
    "phoneNumber": "+1234567890",
    "profileImageUrl": "https://example.com/admin-profile.jpg"
  }
}
```

---

## 3. Reset Password

**Endpoint:** `POST /admin/reset-password`

**Description:** Resets a user's password using their email address.

**Request Parameters:**
- `email` (String, required): User's email address
- `newPassword` (String, required): New password for the user

**Example Request:**
```
POST /admin/reset-password?email=user@example.com&newPassword=newSecurePassword123
```

**Response Body:**
```json
"Password reset successfully for user: user@example.com New Password: newSecurePassword123"
```

---

## 4. Get All Users

**Endpoint:** `GET /admin/users`

**Description:** Retrieves a list of all users in the system with their profiles.

**Request:** No body required

**Response Body:**
```json
[
  {
    "appUser": {
      "userId": 1,
      "role": "user",
      "passwordHash": null,
      "status": "active",
      "email": "user1@example.com",
      "createdAt": "2025-11-02T09:00:00"
    },
    "userProfile": {
      "profileId": 1,
      "userId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "profileImageUrl": "https://example.com/profile1.jpg"
    }
  },
  {
    "appUser": {
      "userId": 2,
      "role": "user",
      "passwordHash": null,
      "status": "Pending Verification",
      "email": "user2@example.com",
      "createdAt": "2025-11-02T10:00:00"
    },
    "userProfile": {
      "profileId": 2,
      "userId": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneNumber": "+0987654321",
      "profileImageUrl": "https://example.com/profile2.jpg"
    }
  }
]
```

---

## 5. Get Buyer Reviews by User ID

**Endpoint:** `GET /admin/buyer-reviews/{userId}`

**Description:** Retrieves all buyer reviews for a specific user.

**Path Parameters:**
- `userId` (Long, required): ID of the user whose buyer reviews to retrieve

**Example Request:**
```
GET /admin/buyer-reviews/1
```

**Response Body:**
```json
[
  {
    "reviewId": 1,
    "reviewerId": 2,
    "buyerId": 1,
    "buyerName": "John Doe",
    "reviewerName": "Jane Smith",
    "rating": 5,
    "reviewText": "Excellent buyer, quick payment and great communication!",
    "productName": "iPhone 13",
    "productPrice": 899.99,
    "productImageUrl": "https://example.com/iphone13.jpg",
    "category": "Electronics",
    "condition": "Like New"
  }
]
```

---

## 6. Get Seller Reviews by User ID

**Endpoint:** `GET /admin/seller-reviews/{userId}`

**Description:** Retrieves all seller reviews for a specific user.

**Path Parameters:**
- `userId` (Long, required): ID of the user whose seller reviews to retrieve

**Example Request:**
```
GET /admin/seller-reviews/1
```

**Response Body:**
```json
[
  {
    "reviewId": 1,
    "reviewerId": 3,
    "sellerId": 1,
    "reviewerName": "Mike Johnson",
    "reviewText": "Great seller, item exactly as described and shipped quickly!",
    "rating": 5,
    "productName": "MacBook Pro",
    "productPrice": 1299.99,
    "productImageUrl": "https://example.com/macbook.jpg",
    "sellerName": "John Doe",
    "category": "Electronics",
    "condition": "Excellent"
  }
]
```

---

## 7. Ban User

**Endpoint:** `POST /admin/ban-user/{userId}`

**Description:** Bans a user by setting their status to "banned".

**Path Parameters:**
- `userId` (Long, required): ID of the user to ban

**Example Request:**
```
POST /admin/ban-user/5
```

**Response Body:**
```json
"User with ID 5 has been banned."
```

---

## 8. Unban User

**Endpoint:** `POST /admin/unban-user/{userId}`

**Description:** Unbans a user by setting their status back to "active".

**Path Parameters:**
- `userId` (Long, required): ID of the user to unban

**Example Request:**
```
POST /admin/unban-user/5
```

**Response Body:**
```json
"User with ID 5 has been unbanned."
```

---

## Common Response Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters or body
- **404 Not Found**: User or resource not found
- **500 Internal Server Error**: Server error

## Authentication

All admin endpoints require proper authentication and authorization. Only users with "admin" role can access these endpoints.

## Notes

- Password hashes are hidden in responses (set to null) for security
- User creation through admin controller sets status as "active" by default
- Admin creation sets role as "admin" and status as "active"
- Ban/unban operations change user status but preserve all other user data
- All timestamps are in ISO 8601 format
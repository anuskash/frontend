# Backend Implementation Requirements

This document outlines the backend endpoints that need to be implemented to support the new frontend features.

## ⚠️ IMPORTANT: These are NEW Endpoints

**The saved products and reporting features require NEW backend endpoints that don't currently exist.**

Based on the existing backend documentation (`admin-api-docs.md` and `user-endpoints-details.md`), the following endpoints are **NOT yet implemented** and need to be created:

### New User Endpoints Needed:
- `POST /users/saved-products/{userId}/{productId}` - Save product
- `DELETE /users/saved-products/{userId}/{productId}` - Unsave product  
- `GET /users/saved-products/{userId}` - Get saved products
- `GET /users/saved-products/{userId}/{productId}/check` - Check if saved

### ✅ Already Implemented User Endpoints:
- `POST /api/reports/product` - Report a product (uses userId header, not body field)

### New Admin Endpoints Needed:
- `GET /admin/prohibited-keywords` - Get prohibited keywords
- `POST /admin/prohibited-keywords` - Add prohibited keyword
- `DELETE /admin/prohibited-keywords/{id}` - Delete prohibited keyword
- `GET /admin/products/flagged` - Get flagged products
- `POST /admin/products/{productId}/unflag` - Unflag product
- `PUT /admin/products/{productId}/hide` - Hide product
- `PUT /admin/products/{productId}/unhide` - Unhide product
- `GET /admin/reports/pending` - Get pending reports
- `GET /admin/reviews` - Get all reviews for moderation
- `PUT /admin/reviews/{reviewId}/flag` - Flag review
- `DELETE /admin/reviews/{reviewId}` - Delete review
- `GET /admin/audit` - Get audit logs

---

## 1. Saved Products Feature (NEW ENDPOINTS REQUIRED)

### Endpoints Required:

#### Save a Product
- **Endpoint**: `POST /users/saved-products/{userId}/{productId}`
- **Description**: Add a product to user's saved list
- **Response**: `void` (204 No Content)
- **Implementation Notes**:
  - Create a `SavedProduct` entity with userId and productId
  - Check if already saved to prevent duplicates
  - Return appropriate status codes

#### Unsave a Product
- **Endpoint**: `DELETE /users/saved-products/{userId}/{productId}`
- **Description**: Remove a product from user's saved list
- **Response**: `void` (204 No Content)
- **Implementation Notes**:
  - Delete the SavedProduct record matching userId and productId
  - Return 404 if record doesn't exist

#### Get Saved Products
- **Endpoint**: `GET /users/saved-products/{userId}`
- **Description**: Retrieve all saved products for a user
- **Response**: `List<MarketPlaceProduct>`
- **Implementation Notes**:
  - Join SavedProduct with MarketPlaceProduct table
  - Only return products that are still available (not deleted)
  - Include product images and seller information

#### Check if Product is Saved
- **Endpoint**: `GET /users/saved-products/{userId}/{productId}/check`
- **Description**: Check if a specific product is saved by the user
- **Response**: `boolean`
- **Implementation Notes**:
  - Simple exists query
  - Return true if SavedProduct record exists, false otherwise

### Database Schema:

```sql
CREATE TABLE saved_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE KEY unique_user_product (user_id, product_id)
);
```

## 2. Product Reporting Feature ✅ ALREADY IMPLEMENTED (Needs Verification)

### 🔍 Backend Endpoint (Check Both Paths):

The backend has a Product Reporting endpoint, but the exact path needs verification:

**Option 1**: `POST /api/reports/product`  
**Option 2**: `POST /reports/product`

#### Report a Product
- **Endpoint**: `POST /reports/product` (or `/api/reports/product`)
- **Authentication**: Uses `userId` from request headers (added automatically by `AuthInterceptor`)
- **Request Body**:
```json
{
  "productId": 456,
  "reportReason": "prohibited_item",
  "reportDetails": "Optional additional details"
}
```
- **Response**: `void` (204 No Content or 200 OK)
- **Implementation Status**: ✅ **Backend has ProductReport entity and repository**
- **Frontend Status**: ✅ **Frontend updated with logging to debug endpoint path**

### Frontend Update Status:

The frontend now:
- ✅ Sends correct field names: `reportReason` and `reportDetails`
- ✅ Does NOT send `userId` in body (uses header)
- ✅ Tries endpoint path: `/reports/product`
- ✅ Has detailed error logging to identify issues
- ✅ Shows specific error messages (404, 401, 403)

### Debug Steps:

1. **Open Browser DevTools Console** before submitting report
2. **Click "Report ad"** and fill the form
3. **Check console logs**:
   - "Submitting report with payload: {...}"
   - "Submitting product report: {...}"
4. **Check Network tab** for the actual request:
   - URL: Should be `http://localhost:8080/reports/product`
   - Headers: Should include `userId` header
   - Payload: Should have `productId`, `reportReason`, `reportDetails`
   - Response: Check status code and error message

### Common Issues:

**404 Not Found**: 
- Backend endpoint path is different (try `/api/reports/product` in code)
- Backend endpoint doesn't exist at all

**401/403 Unauthorized**:
- Not logged in
- `userId` header missing or invalid
- Token expired

**400 Bad Request**:
- Backend expects different field names
- Required fields missing

**500 Server Error**:
- Backend exception (check backend logs)

### Report Reasons (Enum):
- `prohibited_item` - Item violates marketplace policies
- `scam` - Suspected fraudulent listing
- `inappropriate_content` - Contains offensive/inappropriate content
- `misleading` - False or misleading information
- `duplicate` - Duplicate listing
- `spam` - Spam or repetitive posting
- `other` - Other reason (requires details)

**Backend Field Name**: Use `reportReason` (not `reason`)

### Database Schema:

**Note**: This table likely already exists in your backend as `ProductReport` entity.

```sql
CREATE TABLE product_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    report_reason VARCHAR(50) NOT NULL,
    report_details TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by_admin_id BIGINT NULL,
    action_taken VARCHAR(100),
    FOREIGN KEY (reporter_user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(user_id)
);
```

## 3. Admin Endpoints (Already Frontend-Ready)

The following endpoints should be implemented or verified for the admin moderation system:

### Flagged Products
- `GET /admin/products/flagged` - Get all flagged products
- `PUT /admin/products/{productId}/unflag` - Remove flag from product
- `PUT /admin/products/{productId}/hide` - Hide product from listings
- `PUT /admin/products/{productId}/unhide` - Unhide product

### Prohibited Keywords
- `GET /admin/prohibited-keywords` - Get all prohibited keywords
- `POST /admin/prohibited-keywords` - Add new keyword
- `DELETE /admin/prohibited-keywords/{id}` - Remove keyword

### Product Reports (Moderation Queue)
- `GET /admin/reports/pending` - Get pending reports
- `PUT /admin/reports/{reportId}/resolve` - Mark report as resolved
- `DELETE /admin/reports/{reportId}` - Dismiss report

### Reviews Moderation
- `GET /admin/reviews` - Get all reviews (buyer + seller)
- `PUT /admin/reviews/{reviewId}/flag` - Flag inappropriate review
- `DELETE /admin/reviews/{reviewId}` - Delete review

### Audit Log
- `GET /admin/audit` - Get audit log entries
- Query params: `email`, `action`, `from`, `to` (dates)
- Response: List of admin action logs with timestamp, admin email, action type, details

## 4. Frontend-Backend Integration Points

### Product Detail Page
The product detail page now has three action buttons that require backend support:

1. **Save Button** - Toggles between saved/unsaved state
   - Calls `POST /users/saved-products/{userId}/{productId}` or `DELETE` endpoint
   - Checks initial state with `GET /users/saved-products/{userId}/{productId}/check`

2. **Share Button** - Opens modal with sharing options
   - No backend required (client-side only)
   - Uses Web Share API and clipboard

3. **Report Ad Button** - Opens modal to report product
   - Submits to `POST /users/reports/product`
   - Admin can review via `/admin/reports/pending`

### Saved Products Page
- Displays grid of saved products
- Loads data from `GET /users/saved-products/{userId}`
- Remove button calls `DELETE /users/saved-products/{userId}/{productId}`

### User Dashboard
- Shows count of saved products
- Loads from `GET /users/saved-products/{userId}` and counts length
- Card is clickable and navigates to `/saved-products`

## 5. Security Considerations

- Ensure users can only save/unsave/report products they have access to
- Validate that productId exists before allowing save/report
- Rate limit report submissions to prevent abuse
- Admin endpoints should require ADMIN role authentication
- Audit all admin actions for the audit log

## 6. Testing Checklist

### Saved Products:
- [ ] User can save a product
- [ ] User can unsave a product
- [ ] Saved state persists across sessions
- [ ] Cannot save same product twice
- [ ] Saved products list updates in real-time
- [ ] Deleting a product removes it from saved lists

### Product Reports:
- [ ] User can submit report with all reason types
- [ ] Reports appear in admin moderation queue
- [ ] Admin can review and resolve reports
- [ ] Cannot submit duplicate reports
- [ ] Report includes all required fields

### Admin Features:
- [ ] Admin can view all flagged products
- [ ] Admin can hide/unhide products
- [ ] Admin can manage prohibited keywords
- [ ] Audit log records all admin actions
- [ ] Only users with ADMIN role can access admin endpoints

## 7. Next Steps

1. **Create Entity Classes**:
   - `SavedProduct.java`
   - `ProductReport.java`

2. **Create Repositories**:
   - `SavedProductRepository.java`
   - `ProductReportRepository.java`

3. **Create Services**:
   - `SavedProductService.java`
   - `ProductReportService.java`
   - Update `AdminService.java` with moderation methods

4. **Create Controllers**:
   - Add endpoints to `UserController.java`
   - Add endpoints to `AdminController.java`

5. **Database Migrations**:
   - Create tables for saved_products and product_reports
   - Add indexes for performance

6. **Testing**:
   - Unit tests for service layer
   - Integration tests for endpoints
   - Test admin authorization

## 8. API Response Examples

### GET /users/saved-products/{userId}
```json
[
  {
    "productId": 1,
    "productName": "M1 MacBook Air",
    "price": 200.00,
    "category": "Electronics",
    "condition": "Fair",
    "status": "AVAILABLE",
    "productImageUrl": "https://...",
    "productImages": ["https://...", "https://..."],
    "sellerId": 5,
    "sellerName": "Yao Hu",
    "postedDate": "2025-11-07T10:30:00"
  }
]
```

### GET /users/saved-products/{userId}/{productId}/check
```json
true
```

### POST /users/reports/product (Request) - ❌ OLD FORMAT
```json
{
  "userId": 10,
  "productId": 42,
  "reason": "scam",
  "description": "Price seems too good to be true, seller is not responding to messages"
}
```

### POST /api/reports/product (Request) - ✅ CORRECT FORMAT
```json
{
  "productId": 42,
  "reportReason": "scam",
  "reportDetails": "Price seems too good to be true, seller is not responding to messages"
}
```
**Note**: `userId` is sent via request header, not body.

### GET /admin/reports/pending
```json
[
  {
    "id": 1,
    "reporterUserId": 10,
    "reporterEmail": "student@university.edu",
    "productId": 42,
    "productName": "iPhone 15 Pro",
    "reason": "scam",
    "description": "Price seems too good to be true...",
    "status": "PENDING",
    "reportedAt": "2025-11-08T14:22:00"
  }
]
```

---

## 9. Current Status & What's Working

### ✅ Existing Backend Endpoints (Already Implemented):
Based on `admin-api-docs.md` and `user-endpoints-details.md`:

**User Endpoints:**
- User profile management (GET, PUT)
- Product CRUD (POST, PUT, DELETE)
- Product listings (GET by seller, buyer, available)
- Product images (upload, get)
- Reviews (seller & buyer reviews GET, POST, PUT)
- Password reset

**Admin Endpoints:**
- User management (create, ban, unban)
- Get all users
- Get buyer/seller reviews by userId
- Create admin users
- Reset user passwords

### ❌ Missing Backend Endpoints (Need Implementation):

**These endpoints are called by the frontend but don't exist yet:**

1. **Saved Products** (All 4 endpoints)
   - Currently throws: "Failed to update saved status" (see screenshot)
   - Frontend is ready, just needs backend implementation

2. **Product Reporting** (1 endpoint)
   - Report modal is built but submission will fail
   - Admin report queue UI is ready

3. **Prohibited Keywords** (3 endpoints)
   - Admin settings UI exists but "Failed to add keyword" error
   - Frontend sends proper payload, backend doesn't have endpoints

4. **Product Moderation** (4 endpoints for flag/unflag/hide/unhide)
   - Admin listings page is ready
   - Backend needs to implement these actions

5. **Review Moderation** (3 endpoints)
   - Admin reviews page functional
   - Needs backend flag/delete review endpoints

6. **Audit Log** (1 endpoint)
   - Admin audit page ready with filters
   - Backend needs to track and return admin actions

---

## 10. Priority Implementation Order

To get features working quickly, implement in this order:

### 🔥 **Priority 1: Prohibited Keywords** (Admin is trying to use this now)
1. Create `prohibited_keywords` table
2. Implement GET, POST, DELETE endpoints
3. Test with admin settings page

### 🔥 **Priority 2: Saved Products** (User-facing feature, high visibility)
1. Create `saved_products` table
2. Implement all 4 endpoints
3. Test save/unsave functionality
4. Verify saved products page displays correctly

### 📊 **Priority 3: Product Reports & Moderation**
1. Create `product_reports` table
2. Implement report submission endpoint
3. Implement admin report queue endpoint
4. Add flagged products functionality

### 🛠️ **Priority 4: Audit Log**
1. Create `admin_audit_log` table
2. Add audit logging to all admin actions
3. Implement GET /admin/audit with filters

### 🎯 **Priority 5: Review Moderation**
1. Add flagged field to reviews table
2. Implement flag/delete review endpoints
3. Wire to admin reviews page

---

## 11. Quick Testing Guide

### When Backend is Ready:

**Test Saved Products:**
1. Login as regular user
2. Go to any product detail page
3. Click "Save" button
4. Should see "Saved" state
5. Go to `/saved-products`
6. Should see the saved product
7. Click trash icon to remove

**Test Prohibited Keywords:**
1. Login as admin
2. Go to `/admin/settings`
3. Enter keyword (e.g., "test")
4. Select category, severity, action
5. Click "Add"
6. Should appear in table below
7. Click delete icon to remove

**Test Product Reporting:**
1. Login as regular user
2. Go to any product
3. Click "Report ad"
4. Select reason, add description
5. Click "Submit Report"
6. Should see success message
7. Login as admin → `/admin/listings`
8. Should see report in pending queue

---

## 12. Current Error Explanation

**"Failed to update saved status. Please try again." (Screenshot)**

This error occurs because:
1. Frontend calls: `POST /users/saved-products/{userId}/{productId}`
2. Backend returns: **404 Not Found** (endpoint doesn't exist)
3. Frontend catches error and shows user-friendly message

**The frontend is working correctly** - it's just waiting for the backend endpoints to be implemented.

---

**"Failed to submit report" - Should now work! ✅**

The Product Reporting feature backend is **already implemented** at `POST /api/reports/product`. The frontend has been updated to:
- Send `reportReason` instead of `reason`
- Send `reportDetails` instead of `description`
- Remove `userId` from body (uses header automatically)

**Test this now** - it should work immediately!

---

All the UI, forms, modals, and data flow are ready. Once you implement the remaining backend endpoints (Saved Products, Prohibited Keywords, etc.), everything will work immediately! 🚀

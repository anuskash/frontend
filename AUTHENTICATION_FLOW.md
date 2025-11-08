# UoN Marketplace Authentication Flow

## Overview
This document describes the authentication and authorization flow implemented in the UoN Student Marketplace.

## User Authentication States

### 1. **Unauthenticated Users (Visitors)**
Can access:
- Landing page (view only)
- Browse listings (view only - no product details)
- Search functionality (view results only)

Cannot access:
- Product details (redirected to login)
- Post listings
- Contact sellers
- User dashboard
- Profile management

### 2. **Authenticated but Unverified Users**
Status: `Pending Verification`
- User has registered but email/student verification pending
- Redirected to `/verification-needed` page
- Cannot post listings or interact with products

### 3. **Verified Active Users**
Status: `Active`, `ACTIVE`, `active`, or `verified`
Can access:
- Full browse listings with product details
- Post new listings (verified users only)
- Contact sellers
- User dashboard
- Profile management
- My listings
- My purchases
- Reviews

### 4. **Suspended/Banned Users**
Status: `Banned`, `Suspended`, `SUSPENDED`, `banned`
- Redirected to `/account-banned` page
- Cannot access any protected features

### 5. **Admin Users**
Role: `admin`
- Access to admin dashboard
- User management capabilities
- Can manage all listings

## Landing Page Authentication Flow

### Sign In Button
```typescript
handleSignIn() -> /login
```

### Register Button
```typescript
handleRegister() -> /register
```

### Post an Ad Button
```typescript
handlePostAd():
  IF not authenticated:
    -> /login?returnUrl=/add-listing
  ELSE IF user.status !== 'verified':
    -> /verification-needed
  ELSE:
    -> /add-listing
```

### View Product Details
```typescript
viewProductDetails(product):
  IF not authenticated:
    -> /login?returnUrl=/browse-listings&productId={productId}
  ELSE:
    -> /browse-listings?productId={productId}
```

## Login Component Flow

### On Login Success
```typescript
1. Check user.status:
   - 'Pending Verification' -> /verification-needed
   - 'Banned'/'Suspended' -> /account-banned
   - 'Active'/'verified':
     IF returnUrl exists:
       -> navigate to returnUrl (with productId if provided)
     ELSE:
       IF role === 'admin':
         -> /admin-dashboard
       ELSE:
         -> /user-dashboard
```

### Return URL Support
- Login and Register pages support `returnUrl` query parameter
- Allows users to be redirected back to their intended destination after authentication
- Preserves `productId` for product detail views

## Protected Routes

### Require Authentication Only
- `/user-dashboard`
- `/profile`
- `/browse-listings` (with product details)

### Require Authentication + Verification
- `/add-listing`
- `/my-listings`
- `/my-purchases`
- `/my-reviews`

### Require Admin Role
- `/admin-dashboard`
- `/admin/user-profile/:userId`

## Implementation Notes

### AuthService Methods
```typescript
- isAuthenticated(): boolean
- getCurrentUser(): User | null
- setCurrentUser(user: User): void
- removeCurrentUser(): void
```

### User Status Values
- `Pending Verification` - Awaiting email/student verification
- `Active`, `ACTIVE`, `active`, `verified` - Full access
- `Banned`, `Suspended`, `SUSPENDED`, `banned` - Account restricted

### Session Management
- User data stored in localStorage as `currentUser`
- Persists across page refreshes
- Cleared on logout

## Future Enhancements
1. Route guards for automatic authentication checks
2. Token-based authentication with JWT
3. Automatic session timeout
4. Remember me functionality
5. Password reset flow

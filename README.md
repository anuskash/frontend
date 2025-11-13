# UoN Student Marketplace - Frontend

A modern, feature-rich Angular marketplace application for UoN students to buy and sell items within their campus community.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [API Integration](#api-integration)
- [User Features](#user-features)
- [Admin Features](#admin-features)
- [Development](#development)
- [Documentation](#documentation)

---

## 🎯 Overview

The UoN Student Marketplace is a secure, student-only platform that enables UoN students to:
- Browse and search listings across various categories
- Post items for sale with multiple images
- Save favorite products for later viewing
- Communicate with buyers and sellers through integrated messaging
- Leave reviews for transactions
- Report inappropriate content

This repository contains the Angular frontend. The backend (Spring Boot/Java) is maintained in a separate private repository.

---

## ✨ Features

### Public Features
- Modern landing page with smooth animations and gradient effects
- Browse listings (view only, no details without login)
- Search functionality across all products
- Responsive design for mobile, tablet, and desktop

### User Features
- **Account Management**
  - Email verification system
  - Profile management with image upload
  - Two-factor authentication (2FA) support
  - Password reset functionality
  
- **Product Management**
  - Post listings with multiple images
  - Edit and delete own listings
  - Mark products as sold or archived
  - Track purchase history
  - My Listings dashboard
  
- **Social Features**
  - Save/favorite products
  - Share listings via email or link
  - Review buyers and sellers
  - Real-time messaging system
  - Product reporting
  
- **Dashboard**
  - View statistics (listings, purchases, saved items, reviews)
  - Manage notifications
  - Quick access to all features

### Admin Features
- **User Management**
  - View all users and profiles
  - Create admin accounts
  - Ban/suspend users
  - Reset user passwords
  - Delete user accounts
  
- **Content Moderation**
  - Review flagged products
  - Manage prohibited keywords
  - Handle product reports
  - Review and moderate user reviews
  - Hide/unhide listings
---

## 🛠 Tech Stack

- **Framework:** Angular 19
- **Language:** TypeScript 5.7
- **Styling:** SCSS with custom design system
- **HTTP Client:** Angular HttpClient with interceptors
- **Routing:** Angular Router with guards
- **Build Tool:** Angular CLI
- **Testing:** Jasmine + Karma

### Key Dependencies
- `@angular/animations` - Smooth UI transitions
- `@angular/forms` - Reactive forms
- `rxjs` - Reactive programming
- Font Awesome - Icons (via CDN)

---

## 🚀 Getting Started

### Prerequisites

The following software must be installed before proceeding:
- Node.js (version 18 or higher)
- npm (version 9 or higher)
- Angular CLI (install globally using `npm install -g @angular/cli`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anuskash/frontend.git
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the environment:
   
   Edit `src/environments/environment.ts` to specify the backend API URL:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8080/api'
   };
   ```

4. Start the development server:
   ```bash
   ng serve
   ```
   
   The application will be accessible at `http://localhost:4200/`.

### Backend Requirements

The frontend requires a running backend server. Ensure the following:
- Backend server is running on `http://localhost:8080` (or update `environment.ts` accordingly)
- CORS is enabled for `http://localhost:4200`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Feature components
│   │   ├── landing/         # Landing page
│   │   ├── login/           # Authentication
│   │   ├── register/        # User registration
│   │   ├── browse-listings/ # Product browsing
│   │   ├── product-detail/  # Product details
│   │   ├── add-listing/     # Create listing
│   │   ├── my-listings/     # User's products
│   │   ├── saved-products/  # Favorites
│   │   ├── user-dashboard/  # User dashboard
│   │   ├── admin-dashboard/ # Admin panel
│   │   ├── messages/        # Messaging system
│   │   └── ...
│   ├── services/            # API services
│   │   ├── auth.service.ts       # Authentication
│   │   ├── user.service.ts       # User operations
│   │   ├── admin.service.ts      # Admin operations
│   │   ├── messaging.service.ts  # Messaging
│   │   └── ...
│   ├── guards/              # Route guards
│   │   ├── admin.guard.ts        # Admin access
│   │   └── super-admin.guard.ts
│   ├── models/              # TypeScript interfaces
│   │   ├── product.model.ts
│   │   ├── user.model.ts
│   │   └── ...
│   ├── pipes/               # Custom pipes
│   └── directives/          # Custom directives
├── assets/                  # Static assets
├── environments/            # Environment configs
└── styles.scss             # Global styles
```

---

## 🔐 Authentication & Authorization

### User States

1. **Unauthenticated (Visitors)**
   - Can view landing page
   - Can browse listings (no product details)
   - Redirected to login for protected actions

2. **Pending Verification**
   - Email verification required
   - Cannot post or interact with products
   - Shown `/verification-needed` page

3. **Active/Verified Users**
   - Full marketplace access
   - Can post, save, message, review
   - Access to user dashboard

4. **Banned/Suspended**
   - Redirected to `/account-banned`
   - No access to features

5. **Admin Users**
   - All user features plus admin panel
   - User and content moderation
   - Audit log access

### Authentication Flow

**Login Process:**
```typescript
1. User submits credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. User redirected based on status:
   - Pending Verification → /verification-needed
   - Banned → /account-banned
   - Active (admin) → /admin-dashboard
   - Active (user) → /user-dashboard or returnUrl
```

**Session Management:**
- User data is stored in `localStorage` as `currentUser`
- `AuthInterceptor` automatically adds `userId` header to requests
- Session persists across page refreshes
- Session is cleared on logout

### Route Protection

Routes are protected using Angular guards:
- `AdminGuard` - Restricts access to users with admin role
- `SuperAdminGuard` - Restricts access to users with super admin role
- Additional authentication checks are implemented in components for feature-level restrictions

---

## 🔌 API Integration

### Base Configuration

**Service Base URLs:**
- AuthService: `/api`
- UserService: `/api/users`
- AdminService: `/api/admin`

### API Endpoints d

The frontend integrates with **48 backend REST API endpoints** across:

#### Authentication (11 endpoints)
- User registration, login, email verification
- Password reset, change password
- Profile management
- Account deletion

#### Products (30 endpoints)
- CRUD operations for listings
- Search and filtering
- Mark as sold/available/archived
- Image upload (single and multiple)
- Saved products (favorites)

#### Reviews (10 endpoints)
- Buyer and seller reviews
- Submit, edit, delete reviews
- View received reviews

#### Reporting & Moderation (7 endpoints)
- Report products
- Admin review reports
- Flag/unflag content

### Response Handling

All services implement error handling:
```typescript
this.http.get<Product[]>(url).pipe(
  catchError(error => {
    console.error('Error fetching products:', error);
    return throwError(() => error);
  })
);
```

---

## 👥 User Features

### Product Management
- **Create Listing:** Multi-step form with image upload, category selection, pricing
- **Edit Listing:** Update details, images, price
- **Archive Listing:** Mark as unavailable (displayed as "archived" in UI)
- **Delete Listing:** Soft delete from marketplace

### Saved Products (Favorites)
- Heart icon on product cards and detail pages
- Toggle save/unsave with visual feedback
- Dedicated `/saved-products` page with grid layout
- Accessible from navbar and dashboard

### Share & Report
- **Share:** Copy link, email, or native device share
- **Report:** Structured form with predefined reasons (scam, inappropriate content, etc.)

### Messaging
- Real-time conversation system
- Message between buyers and sellers
- Thread-based conversations
- Notification support

### Reviews
- Rate buyers and sellers (1-5 stars)
- Leave text reviews
- Edit/delete own reviews
- View received reviews on profile

---

## 👨‍💼 Admin Features

### User Management
- View all registered users
- Create admin accounts
- Ban/suspend users
- Reset passwords
- Delete user accounts
- View user profiles by email

### Content Moderation
- **Prohibited Keywords**
  - Add/remove keywords
  - Set severity levels (LOW, MEDIUM, HIGH)
  - Auto-actions (WARN, FLAG, REJECT)
  
- **Flagged Products**
  - Review auto-flagged listings
  - Unflag or hide products
  - Restore hidden products
  
- **Product Reports**
  - Review pending reports
  - Take action (approve, reject, remove product)
  - Add admin notes

### Review Moderation
- View all reviews
- Filter by flagged status
- Delete inappropriate reviews

### Audit Logs
- Comprehensive activity tracking
- Filter by:
  - User ID
  - Action type
  - Target type (USER, PRODUCT, REVIEW)
  - Date range
  - Text search
- Export to CSV
- Shows: timestamp, user, action, target, details

---

## 💻 Development

### Running the Application

**Development server:**
```bash
ng serve
```
The application runs at `http://localhost:4200/` with automatic reload on file changes.

**Production build:**
```bash
ng build
```
Build artifacts are stored in the `dist/` directory.

### Code Generation

**Generate component:**
```bash
ng generate component components/component-name
```

**Generate service:**
```bash
ng generate service services/service-name
```

**Generate guard:**
```bash
ng generate guard guards/guard-name
```

**View all available schematics:**
```bash
ng generate --help
```

### Testing

**Run unit tests:**
```bash
ng test
```
Tests are executed using the Karma test runner.

**Run end-to-end tests:**
```bash
ng e2e
```
Configure the preferred end-to-end testing framework before use.

### Available npm Scripts

```json
{
  "start": "ng serve",
  "build": "ng build",
  "test": "ng test",
  "watch": "ng build --watch"
}
```

---

## 📚 Documentation

Comprehensive documentation is available in the repository:

- **`AUTHENTICATION_FLOW.md`** - Complete authentication system documentation
- **`BACKEND_FRONTEND_API_INTEGRATION.md`** - All 48 API endpoints with request/response formats
- **`USER_FEATURES_SUMMARY.md`** - Detailed user feature documentation
- **`FRONTEND_AUDIT_REPORT.md`** - Code quality and integration audit
- **`LANDING_PAGE_MODERNIZATION.md`** - UI/UX enhancements and animations
- **`admin-api-docs.md`** - Admin controller API documentation
- **`user-endpoints-details.md`** - User controller API documentation
- **`BACKEND_REQUIREMENTS.md`** - Backend implementation requirements
- **`BACKEND_API_ALIGNMENT_FIX.md`** - API alignment fixes and updates
- **`BACKEND_FIX_PROHIBITED_KEYWORDS.md`** - Prohibited keywords feature guide
- **`PRODUCT_REPORTING_UPDATE.md`** - Product reporting feature documentation

---

## 🎨 UI/UX Features

- **Modern Landing Page:** Gradient animations, shimmer effects, glassmorphism
- **Responsive Design:** Mobile-first approach with breakpoints at 480px, 768px, 1024px, 1200px
- **Toast Notifications:** User-friendly feedback for all actions
- **Loading States:** Skeleton screens and spinners
- **Error Handling:** Graceful degradation with helpful error messages
- **Accessibility:** Keyboard navigation, ARIA labels, semantic HTML

### Design System
- **Colors:** Yellow/Orange gradient theme
- **Typography:** System font stack with fallbacks
- **Shadows:** Multi-layer shadow system for depth
- **Animations:** Smooth transitions with cubic-bezier easing

---

## 🔧 Configuration

### Environment Variables

**Development (`environment.ts`):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

**Production (`environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api'
};
```

### Backend CORS Configuration

Ensure the backend allows requests from the frontend origin:
```java
@CrossOrigin(origins = "http://localhost:4200")
```

---

## 🤝 Contributing

This is a private university project. Contributions should follow these guidelines:
1. Create a feature branch from the main branch
2. Follow existing code patterns and conventions
3. Update relevant documentation
4. Submit a pull request with a detailed description of changes

---

## 📝 License

This project is part of a university coursework assignment for UoN.

---

## 📞 Support

For backend-related issues, coordinate with the backend repository maintainer.

For frontend issues, create an issue in this repository including:
- Steps to reproduce the issue
- Expected versus actual behavior
- Browser console logs
- Network tab details (for API-related errors)

---

## 🚀 Deployment

### Frontend Deployment
1. Build for production: `ng build --configuration production`
2. Deploy contents of `dist/` directory to static hosting platform (e.g., Netlify, Vercel, AWS S3)
3. Configure environment variables on the hosting platform
4. Ensure CORS is configured on the backend for the production domain

### Backend Requirements
- Ensure the backend is deployed and accessible
- Update `environment.prod.ts` with the production API URL
- Configure authentication tokens and session management
- Configure SSL/TLS for secure communication

---

UoN Student Marketplace

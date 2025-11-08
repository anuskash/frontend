import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { AdminListingsComponent } from './components/admin-listings/admin-listings.component';
import { AdminReviewsComponent } from './components/admin-reviews/admin-reviews.component';
import { AdminReportsComponent } from './components/admin-reports/admin-reports.component';
import { AdminAuditLogComponent } from './components/admin-audit-log/admin-audit-log.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { AdminUserProfileComponent } from './components/admin-user-profile/admin-user-profile.component';
import { AdminGuard } from './guards/admin.guard';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MyListingsComponent } from './components/my-listings/my-listings.component';
import { AddListingComponent } from './components/add-listing/add-listing.component';
import { MyReviewsComponent } from './components/my-reviews/my-reviews.component';
import { BrowseListingsComponent } from './components/browse-listings/browse-listings.component';
import { MyPurchasesComponent } from './components/my-purchases/my-purchases.component';
import { VerificationNeededComponent } from './components/verification-needed/verification-needed.component';
import { AccountBannedComponent } from './components/account-banned/account-banned.component';
import { LandingComponent } from './components/landing/landing.component'; 
import { MessagesComponent } from './components/messages/messages.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { SavedProductsComponent } from './components/saved-products/saved-products.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { Setup2FAComponent } from './components/setup-2fa/setup-2fa.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { SecuritySettingsComponent } from './components/security-settings/security-settings.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'setup-2fa', component: Setup2FAComponent },
  { path: 'security-settings', component: SecuritySettingsComponent },
  { path: 'verification-needed', component: VerificationNeededComponent },
  { path: 'account-banned', component: AccountBannedComponent },
  { path: 'notifications', component: NotificationsComponent },
  
  // Admin area with nested routes under AdminLayoutComponent
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    data: { standaloneLayout: true },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'listings', component: AdminListingsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'reports', component: AdminReportsComponent },
      { path: 'audit', component: AdminAuditLogComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'user-profile/:userId', component: AdminUserProfileComponent }
    ]
  },
  
  // Legacy redirect from old admin-dashboard route to new admin area
  { path: 'admin-dashboard', redirectTo: '/admin', pathMatch: 'full' },

  { path: 'user-dashboard', component: UserDashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'my-listings', component: MyListingsComponent },
  { path: 'add-listing', component: AddListingComponent },
  { path: 'edit-listing/:id', component: AddListingComponent },
  { path: 'my-reviews', component: MyReviewsComponent },
  { path: 'browse-listings', component: BrowseListingsComponent, data: { standaloneLayout: true } },
  { path: 'messages', component: MessagesComponent },
  { path: 'messages/:otherUserId/:productId', component: MessagesComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'saved-products', component: SavedProductsComponent },
  { path: 'my-purchases', component: MyPurchasesComponent },
  { path: 'dashboard', redirectTo: '/user-dashboard', pathMatch: 'full' },
  { path: '', component: LandingComponent, data: { standaloneLayout: true } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

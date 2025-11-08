import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MyListingsComponent } from './components/my-listings/my-listings.component';
import { AddListingComponent } from './components/add-listing/add-listing.component';
import { MyReviewsComponent } from './components/my-reviews/my-reviews.component';
import { BrowseListingsComponent } from './components/browse-listings/browse-listings.component';
import { MyPurchasesComponent } from './components/my-purchases/my-purchases.component';
import { VerificationNeededComponent } from './components/verification-needed/verification-needed.component';
import { AccountBannedComponent } from './components/account-banned/account-banned.component';
import { ConfirmationModalComponent } from './components/shared/confirmation-modal/confirmation-modal.component';
import { SuccessModalComponent } from './components/shared/success-modal/success-modal.component';
import { AddAdminModalComponent } from './components/shared/add-admin-modal/add-admin-modal.component';
import { ProductDetailModalComponent } from './components/shared/product-detail-modal/product-detail-modal.component';
import { AdminUserProfileComponent } from './components/admin-user-profile/admin-user-profile.component';
import { AuthInterceptor } from './services/auth.interceptor';
import { ImageUrlPipe } from './pipes/image-url.pipe';
import { HeroBannerComponent } from './components/shared/hero-banner/hero-banner.component';
import { SidebarFiltersComponent } from './components/shared/sidebar-filters/sidebar-filters.component';
import { TopNavbarComponent } from './components/shared/top-navbar/top-navbar.component';
import { MessagesComponent } from './components/messages/messages.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { SavedProductsComponent } from './components/saved-products/saved-products.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { HasRoleDirective } from './directives/has-role.directive';

@NgModule({
  declarations: [
    AppComponent,
  // LoginComponent, // Standalone, remove from declarations
    RegisterComponent,
    AdminDashboardComponent,
    AdminLayoutComponent,
    AdminUsersComponent,
    AdminListingsComponent,
    AdminReviewsComponent,
    AdminReportsComponent,
    AdminAuditLogComponent,
    AdminSettingsComponent,
    UserDashboardComponent,
    ProfileComponent,
    MyListingsComponent,
    AddListingComponent,
    MyReviewsComponent,
    BrowseListingsComponent,
    MyPurchasesComponent,
    VerificationNeededComponent,
    AccountBannedComponent,
    ConfirmationModalComponent,
    SuccessModalComponent,
    AddAdminModalComponent,
    ProductDetailModalComponent,
    AdminUserProfileComponent,
    ProductDetailComponent,
    SavedProductsComponent,
    HasRoleDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    HeroBannerComponent,
    SidebarFiltersComponent,
    TopNavbarComponent,
    FooterComponent,
    ToastComponent,
    ImageUrlPipe
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

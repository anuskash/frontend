import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, AdminUserProfile } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-user-profile',
  standalone: false,
  templateUrl: './admin-user-profile.component.html',
  styleUrls: ['./admin-user-profile.component.scss']
})
export class AdminUserProfileComponent implements OnInit {
  userProfile: AdminUserProfile | null = null;
  loading = true;
  error = '';
  userId: number = 0;
  activeReviewTab = 'seller-received';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Check if user is admin
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role.toLowerCase() !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    // Get userId from route parameters
    this.route.params.subscribe(params => {
      this.userId = +params['userId'];
      if (this.userId) {
        this.loadUserProfile();
      } else {
        this.error = 'Invalid user ID';
        this.loading = false;
      }
    });
  }

  loadUserProfile() {
    this.loading = true;
    this.error = '';
    
    this.adminService.getUserProfile(this.userId).subscribe({
      next: (profile) => {
        console.log('Received profile data:', profile);
        this.userProfile = profile;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.error = 'Failed to load user profile. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  getStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'status-unknown';
    }
    
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'banned': 
      case 'suspended': return 'status-banned';
      case 'pending verification':
      case 'pending_verification': return 'status-pending';
      default: return 'status-unknown';
    }
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('fas fa-star');
    }
    
    if (hasHalfStar) {
      stars.push('fas fa-star-half-alt');
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push('far fa-star');
    }
    
    return stars;
  }

  getSellerRating(): number {
    console.log('getSellerRating called, userProfile:', this.userProfile);
    if (!this.userProfile) {
      return 0;
    }

    const rating = this.userProfile.averageSellerRating ?? 0;
    console.log('Seller rating:', rating);
    return rating;
  }

  getBuyerRating(): number {
    console.log('getBuyerRating called, userProfile:', this.userProfile);
    if (!this.userProfile) {
      return 0;
    }

    const rating = this.userProfile.averageBuyerRating ?? 0;
    console.log('Buyer rating:', rating);
    return rating;
  }

  setActiveReviewTab(tab: string) {
    this.activeReviewTab = tab;
  }

  getReviewTabCount(tab: string): number {
    if (!this.userProfile) return 0;
    
    switch (tab) {
      case 'seller-received':
        return this.userProfile.sellerReviewsReceived?.length || 0;
      case 'seller-given':
        return this.userProfile.sellerReviewsGiven?.length || 0;
      case 'buyer-received':
        return this.userProfile.buyerReviewsReceived?.length || 0;
      case 'buyer-given':
        return this.userProfile.buyerReviewsGiven?.length || 0;
      default:
        return 0;
    }
  }
}
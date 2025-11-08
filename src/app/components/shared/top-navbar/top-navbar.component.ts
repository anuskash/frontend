import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MessagingService } from '../../../services/messaging.service';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { UserProfile } from '../../../models/user-profile.model';
import { MarketPlaceUser } from '../../../models/marketplace-user.model';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.scss']
})
export class TopNavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentProfile: UserProfile | null = null;
  marketplaceUser: MarketPlaceUser | null = null;
  unreadMessagesCount = 0;
  showUserMenu = false;
  unreadNotificationsCount = 0;
  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messagingService: MessagingService,
    private notificationService: NotificationService,
    public router: Router
  ) {}

  ngOnInit(): void {
    // Load initial user state
    this.loadUserState();

    // Listen for route changes to detect login/logout
    this.subs.push(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.loadUserState();
        })
    );

    // Poll for unread notifications every 30s
    this.fetchUnreadNotifications();
    this.subs.push(
      interval(30000).subscribe(() => this.fetchUnreadNotifications())
    );
  }

  fetchUnreadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.unreadNotificationsCount = notifications.filter(n => !n.read).length;
      },
      error: () => {
        this.unreadNotificationsCount = 0;
      }
    });
  }

  private loadUserState(): void {
    this.currentUser = this.authService.getCurrentUser();
    const userId = this.currentUser?.userId;
    
    if (userId) {
      // Load user profile data
      this.userService.getUserProfile(userId).subscribe({
        next: (p) => (this.currentProfile = p),
        error: () => {}
      });
      this.userService.getSellerInfo(userId).subscribe({
        next: (mp) => (this.marketplaceUser = mp),
        error: () => {}
      });

      // Subscribe to unread count stream and set up polling
      this.messagingService.refreshUnreadCount(userId);
      this.subs.push(
        this.messagingService.unreadCount$.subscribe((c) => (this.unreadMessagesCount = c || 0))
      );
      this.subs.push(
        interval(30000).subscribe(() => this.messagingService.refreshUnreadCount(userId))
      );
    } else {
      // User logged out, clear data
      this.currentProfile = null;
      this.marketplaceUser = null;
      this.unreadMessagesCount = 0;
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  get isRegisterPage(): boolean {
    return this.router.url.startsWith('/register');
  }

  get isAdmin(): boolean {
    const role = this.currentUser?.role;
    if (!role) return false;
    const norm = role.toLowerCase().replace(/[-\s]/g, '_');
    return norm === 'admin' || norm === 'super_admin' || norm === 'superadmin';
  }

  getUserName(): string {
    if (this.currentProfile?.firstName) {
      const last = this.currentProfile.lastName ? ` ${this.currentProfile.lastName.charAt(0).toUpperCase()}.` : '';
      return `${this.currentProfile.firstName}${last}`;
    }
    if (this.marketplaceUser?.firstName) {
      const last = this.marketplaceUser.lastName ? ` ${this.marketplaceUser.lastName.charAt(0).toUpperCase()}.` : '';
      return `${this.marketplaceUser.firstName}${last}`;
    }
    if (this.currentUser?.email) return this.currentUser.email.split('@')[0];
    return 'User';
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  goHome() {
    if (this.isLoggedIn) {
      if (this.isAdmin) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/user-dashboard']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  openMessages() {
    this.router.navigate(['/messages']);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  goToAddListing() {
    this.router.navigate(['/add-listing']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  onLogout() {
    this.authService.removeCurrentUser();
    this.router.navigate(['/login']);
  }
}

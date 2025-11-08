import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService, AdminCreateUserResponse } from '../../services/admin.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { MarketPlaceProduct } from '../../models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  standalone: false,
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  // Stats
  totalUsers = 0;
  activeUsers = 0;
  bannedUsers = 0;
  pendingVerification = 0;
  totalListings = 0;
  activeListings = 0;
  flaggedListings = 0;
  pendingReports = 0;
  
  // Recent data
  recentUsers: AdminCreateUserResponse[] = [];
  recentListings: MarketPlaceProduct[] = [];
  
  loading = false;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || !this.isAdminRole(this.currentUser.role)) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  private isAdminRole(role: string | undefined | null): boolean {
    if (!role) return false;
    const norm = role.toLowerCase().replace(/[-\s]/g, '_');
    return norm === 'admin' || norm === 'super_admin' || norm === 'superadmin';
  }

  loadDashboardData() {
    this.loading = true;
    
    // Load users
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.totalUsers = users.length;
        this.activeUsers = users.filter(u => this.isActive(u.appUser?.status || '')).length;
        this.bannedUsers = users.filter(u => this.isBanned(u.appUser?.status || '')).length;
        this.pendingVerification = users.filter(u => this.isPending(u.appUser?.status || '')).length;
        this.recentUsers = users.slice(0, 5);
      },
      error: (err) => console.error('Error loading users:', err)
    });
    
    // Load all products
    this.userService.getAvailableProducts().subscribe({
      next: (products) => {
        this.totalListings = products.length;
        this.activeListings = products.filter(p => p.status === 'Available' || p.status === 'AVAILABLE').length;
        this.flaggedListings = products.filter(p => (p as any).flagged).length;
        this.recentListings = products.slice(0, 5);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
    
    // Placeholder for reports (will implement when endpoint is ready)
    this.pendingReports = 0;
  }

  private isActive(status: string): boolean {
    return status.toLowerCase() === 'active';
  }

  private isBanned(status: string): boolean {
    return status.toLowerCase() === 'banned';
  }

  private isPending(status: string): boolean {
    return status.toLowerCase().includes('pending');
  }

  navigateToUsers() {
    this.router.navigate(['/admin/users']);
  }

  navigateToListings() {
    this.router.navigate(['/admin/listings']);
  }

  navigateToReports() {
    this.router.navigate(['/admin/reports']);
  }

  navigateToSettings() {
    this.router.navigate(['/admin/settings']);
  }
}

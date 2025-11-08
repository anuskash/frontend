import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  collapsed = false;
  currentUserEmail = '';
  flaggedProductsCount = 0;
  pendingReportsCount = 0;
  
  private pollingSub?: Subscription;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserEmail = currentUser?.email || 'Admin';
    
    // Load counts initially
    this.loadCounts();
    
    // Poll for updates every 60 seconds
    this.pollingSub = interval(60000).subscribe(() => {
      this.loadCounts();
    });
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
  }

  loadCounts() {
    // Note: These endpoints need to be implemented in AdminService
    // For now, we'll set placeholder values
    this.flaggedProductsCount = 0;
    this.pendingReportsCount = 0;
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

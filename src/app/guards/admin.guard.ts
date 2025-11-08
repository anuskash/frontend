import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  private isAdminRole(role?: string | null): boolean {
    if (!role) return false;
    const norm = role.toLowerCase().replace(/[-\s]/g, '_');
    return norm === 'admin' || norm === 'super_admin' || norm === 'superadmin';
  }

  canActivate(): boolean | UrlTree {
    const user = this.auth.getCurrentUser();
    if (!user) {
      return this.router.createUrlTree(['/login']);
    }
    if (!this.isAdminRole(user.role)) {
      return this.router.createUrlTree(['/user-dashboard']);
    }
    return true;
  }
}

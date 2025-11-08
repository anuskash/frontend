import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(private authService: AuthService) {}

  hasRole(role: string): boolean {
    const user: User | null = this.authService.getCurrentUser();
    if (!user || !user.role) return false;

    const userRole = this.normalizeRole(user.role);
    const targetRole = this.normalizeRole(role);

    return userRole === targetRole;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  isAdmin(): boolean {
    return this.hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  }

  private normalizeRole(role: string): string {
    return role.toUpperCase().replace(/[-\s]/g, '_');
  }
}

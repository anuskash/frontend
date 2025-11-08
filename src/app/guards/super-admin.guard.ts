import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const user: User | null = this.authService.getCurrentUser();

    if (!user || !user.role) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const role = user.role.toUpperCase().replace(/[-\s]/g, '_');
    if (role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
      return true;
    }

    // Redirect to admin dashboard if user is admin but not super admin
    this.router.navigate(['/admin']);
    return false;
  }
}

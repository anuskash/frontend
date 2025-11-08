import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-banned',
  standalone: false,
  templateUrl: './account-banned.component.html',
  styleUrls: ['./account-banned.component.scss']
})
export class AccountBannedComponent {
  userEmail: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Get user email from current user if available
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userEmail = currentUser.email;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  email: string = '';
  twoFactorCode: string = '';
  
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  // UI states
  showOptions: boolean = false;
  has2FA: boolean = false;
  checking2FA: boolean = false;
  
  // Selected recovery method
  selectedMethod: 'login-2fa' | 'reset-link' | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get email from query params if provided
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  checkEmail() {
    if (!this.email || !this.email.includes('@')) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.checking2FA = true;
    this.error = '';
    this.success = '';

    // Check if user has 2FA enabled
    // Note: This requires a backend endpoint to check 2FA status by email
    // For now, we'll show both options
    this.checking2FA = false;
    this.showOptions = true;
  }

  selectMethod(method: 'login-2fa' | 'reset-link') {
    this.selectedMethod = method;
    this.error = '';
    this.success = '';
  }

  loginWith2FA() {
    if (!this.twoFactorCode.trim()) {
      this.error = 'Please enter your 2FA code';
      return;
    }

    this.loading = true;
    this.error = '';

    // Use the login endpoint with 2FA code (no password needed for backup codes)
    this.authService.loginV2(this.email, '', this.twoFactorCode).subscribe({
      next: (response) => {
        if (response.success && response.token) {
          this.authService.setCurrentUser(response);
          this.success = 'Login successful! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/user-dashboard']);
          }, 1500);
        } else {
          this.error = 'Invalid 2FA code or backup code';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid 2FA code or backup code';
        this.loading = false;
      }
    });
  }

  sendResetLink() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Password reset link sent! Please check your email.';
        this.selectedMethod = null;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to send reset link. Please try again.';
      }
    });
  }

  goBack() {
    this.showOptions = false;
    this.selectedMethod = null;
    this.twoFactorCode = '';
    this.error = '';
    this.success = '';
  }

  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: this.email ? { email: this.email } : {}
    });
  }
}

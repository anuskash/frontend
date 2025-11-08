import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  // Token from email link
  resetToken: string = '';
  
  // Form fields
  newPassword: string = '';
  confirmPassword: string = '';
  
  // UI states
  loading: boolean = false;
  error: string = '';
  success: boolean = false;
  invalidToken: boolean = false;
  
  // Password validation
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordRequirements = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || '';
      
      if (!this.resetToken) {
        this.invalidToken = true;
        this.error = 'Invalid or missing reset token. Please request a new password reset link.';
      }
    });
  }

  validatePassword() {
    const password = this.newPassword;
    
    // Check requirements
    this.passwordRequirements.minLength = password.length >= 8;
    this.passwordRequirements.hasUpperCase = /[A-Z]/.test(password);
    this.passwordRequirements.hasLowerCase = /[a-z]/.test(password);
    this.passwordRequirements.hasNumber = /\d/.test(password);
    this.passwordRequirements.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Calculate strength
    const metRequirements = Object.values(this.passwordRequirements).filter(r => r).length;
    
    if (metRequirements <= 2) {
      this.passwordStrength = 'weak';
    } else if (metRequirements <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword && this.confirmPassword.length > 0;
  }

  get isFormValid(): boolean {
    return (
      this.passwordRequirements.minLength &&
      this.passwordRequirements.hasUpperCase &&
      this.passwordRequirements.hasLowerCase &&
      this.passwordRequirements.hasNumber &&
      this.passwordRequirements.hasSpecialChar &&
      this.passwordsMatch
    );
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  resetPassword() {
    if (!this.isFormValid) {
      this.error = 'Please ensure all password requirements are met and passwords match.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: (response) => {
        console.log('Password reset response:', response);
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400 || err.status === 404) {
          this.invalidToken = true;
          this.error = 'This reset link has expired or is invalid. Please request a new one.';
        } else {
          this.error = err.error?.message || 'Failed to reset password. Please try again.';
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  requestNewLink() {
    this.router.navigate(['/forgot-password']);
  }
}

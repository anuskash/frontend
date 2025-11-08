import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  email: string = '';
  verificationCode: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';
  resending: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get email from route params (passed from registration)
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  verifyEmail() {
    if (!this.verificationCode.trim()) {
      this.error = 'Please enter the verification code';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.verifyEmail(this.email, this.verificationCode).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Email verified successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { verified: 'true', email: this.email } 
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid verification code. Please try again.';
      }
    });
  }

  resendCode() {
    if (!this.email) {
      this.error = 'Email address is required';
      return;
    }

    this.resending = true;
    this.error = '';
    this.success = '';

    this.authService.resendVerificationCode(this.email).subscribe({
      next: (response) => {
        this.resending = false;
        this.success = 'Verification code sent! Please check your email.';
      },
      error: (err) => {
        this.resending = false;
        this.error = err.error?.message || 'Failed to resend code. Please try again.';
      }
    });
  }
}

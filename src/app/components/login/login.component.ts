import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  returnUrl: string = '';
  returnProductId: string | null = null;

  // 2FA and verification states
  requires2FA = false;
  twoFactorCode = '';
  
  // Failed login handling
  failedAttempts = 0;
  requiresVerification = false;
  verificationCode = '';
  verificationSent = false;
  
  // First login prompt for 2FA
  showEnable2FAPrompt = false;
  isFirstLogin = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  ngOnInit(): void {
    // Get return URL and product ID from query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
      this.returnProductId = params['productId'] || null;
      
      // Check if coming from successful email verification
      if (params['verified'] === 'true') {
        this.successMessage = 'Email verified successfully! Please login to continue.';
        if (params['email']) {
          this.loginForm.patchValue({ email: params['email'] });
        }
      }

      // Check if redirected from registration where account already exists/verified
      if (params['registered'] === 'true') {
        this.successMessage = 'Account already exists. Please login to continue.';
        if (params['email']) {
          this.loginForm.patchValue({ email: params['email'] });
        }
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { email, password } = this.loginForm.value;
      
      // Use enhanced login with 2FA support
      this.authService.loginV2(email, password, this.twoFactorCode || undefined).subscribe({
        next: (response) => {
          console.log('Login response:', response);
          const twoFactorRequired = response?.twoFactorRequired === true;
          const twoFactorEnabled = response?.twoFactorEnabled === true;
          
          // Check if 2FA is required
          if (twoFactorRequired && !this.twoFactorCode) {
            this.requires2FA = true;
            this.isLoading = false;
            this.successMessage = 'Please enter your 2FA code from your authenticator app.';
            this.toast.info('Two-factor code required');
            return;
          }
          
          // Login successful
          if (response.success && response.token) {
            this.authService.setCurrentUser(response);
            
            // Check if this is first login (no 2FA enabled) AND user didn't just verify 2FA code
            // If they just entered a 2FA code, they already have it enabled, so don't prompt
            if (!twoFactorEnabled && !this.twoFactorCode) {
              this.isFirstLogin = true;
              this.showEnable2FAPrompt = true;
              this.isLoading = false;
              this.toast.info('Consider enabling 2FA for better security');
              return;
            }
            
            // Navigate to appropriate dashboard
            this.handleSuccessfulLogin(response);
            this.toast.success('Logged in successfully');
          } else {
            this.errorMessage = response.message || 'Login failed. Please try again.';
            this.toast.error(this.errorMessage);
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.handleLoginError(error, email);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  handleLoginError(error: any, email: string) {
    const errorMsg = error.error?.message || '';
    const lowerMsg = errorMsg.toLowerCase();
    
    // Check if error is due to unverified email
    if (lowerMsg.includes('not verified') || lowerMsg.includes('pending verification') || 
        lowerMsg.includes('verify your email') || lowerMsg.includes('email verification')) {
      this.errorMessage = 'Your email is not verified. Redirecting to verification page...';
      this.toast.info('Please verify your email to continue');
      setTimeout(() => {
        this.router.navigate(['/verify-email'], { queryParams: { email } });
      }, 1500);
      this.isLoading = false;
      return;
    }
    
    this.failedAttempts++;
    
    // After 2 failed attempts, require verification
    if (this.failedAttempts >= 2 && !this.requiresVerification) {
      this.requiresVerification = true;
      this.sendFailedLoginVerification(email);
    } else {
      this.errorMessage = errorMsg || 'Invalid email or password. Please try again.';
      this.isLoading = false;
    }
  }

  sendFailedLoginVerification(email: string) {
    this.authService.sendFailedLoginVerification(email).subscribe({
      next: () => {
        this.verificationSent = true;
        this.isLoading = false;
        this.successMessage = 'Verification code sent to your email. Please enter it to continue.';
        this.toast.info('Verification code sent');
      },
      error: () => {
        this.errorMessage = 'Failed to send verification code. Please try again later.';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  verifyFailedLoginAttempt() {
    if (!this.verificationCode.trim()) {
      this.errorMessage = 'Please enter the verification code.';
      return;
    }

    const email = this.loginForm.get('email')?.value;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyFailedLogin(email, this.verificationCode).subscribe({
      next: () => {
        // Verification successful - reset states and allow login
        this.requiresVerification = false;
        this.failedAttempts = 0;
        this.verificationCode = '';
        this.verificationSent = false;
        this.successMessage = 'Verification successful! You can now login or reset your password.';
        this.toast.success('Verification successful');
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Invalid verification code.';
        this.toast.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  handleSuccessfulLogin(response: any) {
    // Route based on user status first
    if (response.status === 'PENDING_VERIFICATION' || response.status === 'Pending Verification') {
      this.router.navigate(['/verification-needed']);
    } else if (response.status === 'BANNED' || response.status === 'Banned' || response.status === 'banned') {
      this.router.navigate(['/account-banned']);
    } else {
      // Check if there's a return URL
      if (this.returnUrl) {
        const queryParams: any = {};
        if (this.returnProductId) {
          queryParams.productId = this.returnProductId;
        }
        this.router.navigate([this.returnUrl], { queryParams });
      } else {
        // Route based on user role
        if (response.role === 'ADMIN' || response.role === 'SUPER_ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/user-dashboard']);
        }
      }
    }
    this.isLoading = false;
  }

  // 2FA Setup prompt actions
  goToEnable2FA() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.router.navigate(['/setup-2fa']);
    }
  }

  skipEnable2FA() {
    this.showEnable2FAPrompt = false;
    const user = this.authService.getCurrentUser();
    if (user) {
      this.handleSuccessfulLogin(user);
    }
  }

  // Navigate to forgot password
  goToForgotPassword() {
    const email = this.loginForm.get('email')?.value;
    this.router.navigate(['/forgot-password'], {
      queryParams: email ? { email } : {}
    });
  }

  // Navigate to verify email
  goToVerifyEmail() {
    const email = this.loginForm.get('email')?.value;
    this.router.navigate(['/verify-email'], {
      queryParams: email ? { email } : {}
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  goToRegister() {
    // Pass return URL to register page if it exists
    if (this.returnUrl) {
      this.router.navigate(['/register'], {
        queryParams: {
          returnUrl: this.returnUrl,
          productId: this.returnProductId
        }
      });
    } else {
      this.router.navigate(['/register']);
    }
  }
}
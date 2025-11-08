import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreateUserRequest, AppUserResponse } from '../../models/user.model';
import { UserProfileRequest } from '../../models/user-profile.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  // Form data
  registerForm = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };

  // Form validation
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Validation flags
  emailValid = false;
  passwordValid = false;
  passwordSpecialChar = false;
  passwordsMatch = false;
  firstNameValid = false;
  lastNameValid = false;
  phoneValid = false;

  // Track if fields have been touched
  emailTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;
  firstNameTouched = false;
  lastNameTouched = false;
  phoneTouched = false;
  termsTouched = false;

  // Terms and conditions
  agreeToTerms = false;
  termsValid = false;
  showTermsModal = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/user-dashboard']);
    }
    
    // Initialize validation states
    this.initializeValidation();
  }

  initializeValidation() {
    this.validateEmail();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validateFirstName();
    this.validateLastName();
    this.validatePhone();
    this.validateTerms();
  }

  validateEmail() {
    const email = this.registerForm.email.toLowerCase();
    if (email === '') {
      this.emailValid = false;
      return;
    }
    
    this.emailTouched = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    
    this.emailValid = isValidFormat;
  }

  validatePassword() {
    if (this.registerForm.password === '') {
      this.passwordValid = false;
      this.passwordSpecialChar = false;
      this.checkPasswordsMatch();
      return;
    }
    this.passwordTouched = true;
    this.passwordValid = this.registerForm.password.length >= 8;
    this.passwordSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.registerForm.password);
    this.checkPasswordsMatch();
  }

  validateConfirmPassword() {
    this.confirmPasswordTouched = true;
    this.checkPasswordsMatch();
  }

  checkPasswordsMatch() {
    this.passwordsMatch = this.registerForm.password === this.registerForm.confirmPassword;
  }

  validateFirstName() {
    if (this.registerForm.firstName.trim() === '') {
      this.firstNameValid = false;
      return;
    }
    
    this.firstNameTouched = true;
    this.firstNameValid = this.registerForm.firstName.trim().length >= 2;
  }

  validateLastName() {
    if (this.registerForm.lastName.trim() === '') {
      this.lastNameValid = false;
      return;
    }
    
    this.lastNameTouched = true;
    this.lastNameValid = this.registerForm.lastName.trim().length >= 2;
  }

  validatePhone() {
    if (this.registerForm.phoneNumber.trim() === '') {
      this.phoneValid = false;
      return;
    }
    
    this.phoneTouched = true;
    this.phoneValid = this.registerForm.phoneNumber.trim().length > 0;
  }

  validateTerms() {
    if (!this.agreeToTerms) {
      this.termsValid = false;
      return;
    }
    
    this.termsTouched = true;
    this.termsValid = this.agreeToTerms;
  }

  openTermsModal() {
    this.showTermsModal = true;
  }

  closeTermsModal() {
    this.showTermsModal = false;
  }

  isFormValid(): boolean {
    return this.emailValid &&
      this.passwordValid &&
      this.passwordSpecialChar &&
      this.passwordsMatch &&
      this.firstNameValid &&
      this.lastNameValid &&
      this.phoneValid &&
      this.termsValid &&
      this.agreeToTerms &&
      this.registerForm.email.trim() !== '' &&
      this.registerForm.password !== '' &&
      this.registerForm.confirmPassword !== '' &&
      this.registerForm.firstName.trim() !== '' &&
      this.registerForm.lastName.trim() !== '' &&
      this.registerForm.phoneNumber.trim() !== '';
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Prepare the registration request
    const userProfileRequest: UserProfileRequest = {
      firstName: this.registerForm.firstName.trim(),
      lastName: this.registerForm.lastName.trim(),
      phoneNumber: this.registerForm.phoneNumber.trim() || '',
      profileImageUrl: '' // Default empty string
    };

    const createUserRequest: CreateUserRequest = {
      appUser: {
        email: this.registerForm.email.trim(),
        password: this.registerForm.password
      },
      userProfile: userProfileRequest
    };

    this.authService.register(createUserRequest).subscribe({
      next: (response: AppUserResponse) => {
        this.isLoading = false;

        const status = (response as any)?.status?.toString().toUpperCase?.() || '';
        const email = this.registerForm.email.trim();

        // If the user is already active/verified, don't ask for verification again
        if (status === 'ACTIVE' || status === 'VERIFIED') {
          this.successMessage = 'Your account is already verified. Please login to continue.';
          setTimeout(() => {
            this.router.navigate(['/login'], { queryParams: { registered: 'true', email } });
          }, 1200);
          return;
        }

        // For all new registrations, always send to verify email page
        // Backend should have sent verification code to the email
        this.successMessage = 'Registration successful! Please check your email for the verification code.';
        setTimeout(() => {
          this.router.navigate(['/verify-email'], { queryParams: { email } });
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        const message = error.error?.message || '';
        this.errorMessage = message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);

        // If the email already exists and is likely verified, send user to login instead of asking to verify again
        const lower = message.toLowerCase();
        if (lower.includes('already') && (lower.includes('exist') || lower.includes('registered'))) {
          const email = this.registerForm.email.trim();
          this.router.navigate(['/login'], { queryParams: { registered: 'true', email } });
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
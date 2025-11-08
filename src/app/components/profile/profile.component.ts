import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { UserProfile } from '../../models/user-profile.model';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isLoading = false;
  isEditingProfile = false;
  isChangingPassword = false;
  
  successMessage = '';
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.pattern(/^[\+]?[0-9\s\-\(\)]+$/)]]
    });

    this.passwordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadUserProfile();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // =================================================================
  // PROFILE DATA LOADING
  // =================================================================

  loadUserProfile() {
    if (!this.currentUser) return;
    
    this.isLoading = true;
    this.userService.getUserProfile(this.currentUser.userId).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.populateProfileForm(profile);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load profile data';
        this.isLoading = false;
      }
    });
  }

  populateProfileForm(profile: UserProfile) {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phoneNumber || ''
    });
  }

  // =================================================================
  // PROFILE EDITING
  // =================================================================

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
    this.clearMessages();
    
    if (!this.isEditingProfile && this.userProfile) {
      // Cancel editing - reset form to original values
      this.populateProfileForm(this.userProfile);
    }
  }

  saveProfile() {
    if (this.profileForm.valid && this.currentUser) {
      this.isLoading = true;
      
      const formValue = this.profileForm.value;
      let updatePromises: Promise<any>[] = [];

      // Update phone number if changed
      if (formValue.phoneNumber !== this.userProfile?.phoneNumber) {
        const phonePromise = this.userService.updatePhoneNumber(
          this.currentUser.userId, 
          formValue.phoneNumber
        ).toPromise();
        updatePromises.push(phonePromise);
      }

      // Note: firstName and lastName updates would need separate endpoints
      // For now, we'll show a message about phone number update
      
      Promise.all(updatePromises).then(() => {
        this.successMessage = 'Profile updated successfully!';
        this.isEditingProfile = false;
        this.isLoading = false;
        this.loadUserProfile(); // Reload to get updated data
      }).catch((error) => {
        console.error('Error updating profile:', error);
        this.errorMessage = 'Failed to update profile';
        this.isLoading = false;
      });
    }
  }



  // =================================================================
  // PASSWORD CHANGE
  // =================================================================

  toggleChangePassword() {
    this.isChangingPassword = !this.isChangingPassword;
    this.clearMessages();
    
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  changePassword() {
    if (this.passwordForm.valid && this.currentUser) {
      this.isLoading = true;
      
      const newPassword = this.passwordForm.value.newPassword;
      
      this.userService.resetPassword(this.currentUser.userId, newPassword).subscribe({
        next: (response) => {
          this.successMessage = 'Password updated successfully!';
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating password:', error);
          this.errorMessage = 'Failed to update password';
          this.isLoading = false;
        }
      });
    }
  }

  // =================================================================
  // FORM VALIDATORS
  // =================================================================

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // =================================================================
  // UTILITY METHODS
  // =================================================================

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Form getters for template
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get phoneNumber() { return this.profileForm.get('phoneNumber'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

  // Get user initials for profile picture
  getUserInitials(): string {
    if (!this.userProfile || !this.userProfile.firstName || !this.userProfile.lastName) {
      return 'UN'; // Default initials for "Unknown"
    }
    
    const firstInitial = this.userProfile.firstName.charAt(0).toUpperCase();
    const lastInitial = this.userProfile.lastName.charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }

  // Navigation
  goBack() {
    // Navigate to appropriate dashboard based on user role
    if (this.currentUser?.role?.toLowerCase() === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }

  getDashboardName(): string {
    // Return appropriate dashboard name based on user role
    if (this.currentUser?.role?.toLowerCase() === 'admin') {
      return 'Admin Dashboard';
    } else {
      return 'Dashboard';
    }
  }

  getProfileTitle(): string {
    // Return appropriate profile title based on user role
    if (this.currentUser?.role?.toLowerCase() === 'admin') {
      return 'Admin Profile';
    } else {
      return 'My Profile';
    }
  }

  logout() {
    this.authService.removeCurrentUser();
    this.router.navigate(['/login']);
  }
}
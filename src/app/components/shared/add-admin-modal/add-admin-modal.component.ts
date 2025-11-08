import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CreateUserRequest } from '../../../models/user.model';

export interface AddAdminResult {
  success: boolean;
  admin?: any;
  error?: string;
}

@Component({
  selector: 'app-add-admin-modal',
  templateUrl: './add-admin-modal.component.html',
  standalone: false,
  styleUrls: ['./add-admin-modal.component.scss']
})
export class AddAdminModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Output() confirmed = new EventEmitter<AddAdminResult>();
  @Output() cancelled = new EventEmitter<void>();

  adminForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.adminForm = this.createForm();
  }

  ngOnInit() {
    // Reset form when modal becomes visible
    if (this.isVisible) {
      this.resetForm();
    }
  }

  ngOnChanges() {
    // Reset form when modal becomes visible
    if (this.isVisible) {
      this.resetForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: [''],
      profileImageUrl: ['']
    });
  }

  private resetForm() {
    this.adminForm.reset();
    this.loading = false;
  }

  onOverlayClick(event: MouseEvent) {
    // Close modal if clicking on overlay (not on modal content)
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onCancel() {
    this.resetForm();
    this.cancelled.emit();
  }

  onSubmit() {
    if (this.adminForm.valid && !this.loading) {
      this.loading = true;
      
      const formValue = this.adminForm.value;
      
      // Create the request object matching the API interface
      const createAdminRequest: CreateUserRequest = {
        appUser: {
          email: formValue.email,
          password: formValue.password
        },
        userProfile: {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phoneNumber: formValue.phoneNumber || '',
          profileImageUrl: formValue.profileImageUrl || ''
        }
      };

      this.adminService.createAdmin(createAdminRequest).subscribe({
        next: (response) => {
          this.loading = false;
          this.resetForm();
          this.confirmed.emit({
            success: true,
            admin: response
          });
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Failed to create admin. Please try again.';
          
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.confirmed.emit({
            success: false,
            error: errorMessage
          });
        }
      });
    }
  }

  // Helper method to check if a field has an error
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.adminForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return !!(field.hasError(errorType) && (field.dirty || field.touched));
    }
    return !!(field.invalid && (field.dirty || field.touched));
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string): string {
    const field = this.adminForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `Password must be at least ${requiredLength} characters`;
    }
    
    return 'Invalid input';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      firstName: 'First name',
      lastName: 'Last name',
      phoneNumber: 'Phone number',
      profileImageUrl: 'Profile image URL'
    };
    return labels[fieldName] || fieldName;
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.scss']
})
export class SecuritySettingsComponent implements OnInit {
  userId: number = 0;
  userEmail: string = '';
  
  // 2FA Status
  twoFactorEnabled: boolean = false;
  checking2FAStatus: boolean = true;
  
  // UI States
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  // Password Reset
  sendingPasswordReset: boolean = false;
  
  // Disable 2FA
  showDisable2FAModal: boolean = false;
  disablePassword: string = '';
  disabling2FA: boolean = false;
  
  // Regenerate Backup Codes
  showRegenerateModal: boolean = false;
  regenerateVerificationCode: string = '';
  regenerating: boolean = false;
  newBackupCodes: string[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = user.userId;
    this.userEmail = user.email;
    
    this.check2FAStatus();
  }

  check2FAStatus() {
    this.checking2FAStatus = true;
    this.authService.check2FAStatus(this.userId).subscribe({
      next: (response) => {
        this.twoFactorEnabled = response.twoFactorEnabled || false;
        this.checking2FAStatus = false;
      },
      error: (err) => {
        console.error('Error checking 2FA status:', err);
        this.checking2FAStatus = false;
      }
    });
  }

  // Password Management
  requestPasswordReset() {
    this.sendingPasswordReset = true;
    this.error = '';
    this.success = '';

    this.authService.requestPasswordResetLink(this.userId, this.userEmail).subscribe({
      next: (response) => {
        this.sendingPasswordReset = false;
        this.success = 'Password reset link sent to your email! Check your inbox.';
        this.toast.success('Password reset link sent');
        setTimeout(() => {
          this.success = '';
        }, 5000);
      },
      error: (err) => {
        this.sendingPasswordReset = false;
        this.error = err.error?.message || 'Failed to send password reset link. Please try again.';
        this.toast.error(this.error);
      }
    });
  }

  // 2FA Management
  enable2FA() {
    this.router.navigate(['/setup-2fa']);
  }

  openDisable2FAModal() {
    this.showDisable2FAModal = true;
    this.disablePassword = '';
    this.error = '';
  }

  closeDisable2FAModal() {
    this.showDisable2FAModal = false;
    this.disablePassword = '';
    this.error = '';
  }

  disable2FA() {
    if (!this.disablePassword.trim()) {
      this.error = 'Please enter your password to disable 2FA';
      this.toast.warn(this.error);
      return;
    }

    this.disabling2FA = true;
    this.error = '';

    this.authService.disable2FA(this.userId, this.disablePassword).subscribe({
      next: (response) => {
        this.disabling2FA = false;
        this.twoFactorEnabled = false;
        this.closeDisable2FAModal();
        this.success = '2FA has been disabled successfully.';
        this.toast.success('Two-factor authentication disabled');
        setTimeout(() => {
          this.success = '';
        }, 5000);
      },
      error: (err) => {
        this.disabling2FA = false;
        this.error = err.error?.message || 'Failed to disable 2FA. Please check your password.';
        this.toast.error(this.error);
      }
    });
  }

  openRegenerateModal() {
    this.showRegenerateModal = true;
    this.regenerateVerificationCode = '';
    this.newBackupCodes = [];
    this.error = '';
  }

  closeRegenerateModal() {
    this.showRegenerateModal = false;
    this.regenerateVerificationCode = '';
    this.newBackupCodes = [];
    this.error = '';
  }

  regenerateBackupCodes() {
    if (!this.regenerateVerificationCode.trim()) {
      this.error = 'Please enter your 2FA verification code';
      this.toast.warn(this.error);
      return;
    }

    if (this.regenerateVerificationCode.length !== 6) {
      this.error = 'Verification code must be 6 digits';
      this.toast.warn(this.error);
      return;
    }

    this.regenerating = true;
    this.error = '';

    this.authService.regenerateBackupCodes(this.userId, this.regenerateVerificationCode).subscribe({
      next: (response) => {
        this.regenerating = false;
        this.newBackupCodes = response.backupCodes || [];
        this.success = 'Backup codes regenerated successfully! Please save them securely.';
        this.toast.success('Backup codes regenerated');
      },
      error: (err) => {
        this.regenerating = false;
        this.error = err.error?.message || 'Failed to regenerate backup codes. Invalid verification code.';
         this.toast.error(this.error);
      }
    });
  }

  downloadBackupCodes() {
    if (this.newBackupCodes.length === 0) return;

    const content = `UON Marketplace - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes safe and secure!
Each code can only be used once.

${this.newBackupCodes.join('\n')}

Previous backup codes are now invalid.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2fa-backup-codes-${Date.now()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  copyBackupCodes() {
    if (this.newBackupCodes.length === 0) return;

    navigator.clipboard.writeText(this.newBackupCodes.join('\n')).then(() => {
      this.success = 'Backup codes copied to clipboard!';
      this.toast.info('Backup codes copied');
      setTimeout(() => {
        this.success = '';
      }, 3000);
    });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}

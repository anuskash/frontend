import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-setup-2fa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-2fa.component.html',
  styleUrls: ['./setup-2fa.component.scss']
})
export class Setup2FAComponent implements OnInit {
  userId: number = 0;
  
  // Setup data from backend
  setupData: any = null;
  
  // UI States
  currentStep: 'loading' | 'setup' | 'verify' | 'complete' = 'loading';
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  // Verification
  verificationCode: string = '';
  
  // Backup codes management
  savedBackupCodes: boolean = false;
  copiedBackupCodes: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = user.userId;
    this.initiate2FASetup();
  }

  initiate2FASetup() {
    this.currentStep = 'loading';
    this.error = '';

    this.authService.setup2FA(this.userId).subscribe({
      next: (response) => {
        console.log('2FA Setup response:', response);
        this.setupData = response;
        this.currentStep = 'setup';
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to initialize 2FA setup. Please try again.';
        this.currentStep = 'setup';
      }
    });
  }

  copyToClipboard(text: string, type: 'secret' | 'backup') {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'backup') {
        this.copiedBackupCodes = true;
        this.success = 'Backup codes copied to clipboard!';
      } else {
        this.success = 'Secret key copied to clipboard!';
      }
      
      setTimeout(() => {
        this.success = '';
      }, 3000);
    }).catch(() => {
      this.error = 'Failed to copy to clipboard';
    });
  }

  downloadBackupCodes() {
    if (!this.setupData?.backupCodes) return;

    const content = `UON Marketplace - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes safe and secure!
Each code can only be used once.

${this.setupData.backupCodes.join('\n')}

If you lose access to your authenticator app, you can use these codes to login.
After using a code, it will be invalidated.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2fa-backup-codes-${Date.now()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.savedBackupCodes = true;
    this.success = 'Backup codes downloaded successfully!';
    setTimeout(() => {
      this.success = '';
    }, 3000);
  }

  printBackupCodes() {
    if (!this.setupData?.backupCodes) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.error = 'Please allow popups to print backup codes';
      return;
    }

    const content = `
      <html>
        <head>
          <title>2FA Backup Codes</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
            }
            h1 { 
              color: #1f2937; 
              border-bottom: 3px solid #667eea;
              padding-bottom: 10px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
            .codes {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .code {
              font-size: 18px;
              font-family: monospace;
              margin: 10px 0;
              padding: 8px;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>UON Marketplace - 2FA Backup Codes</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          
          <div class="warning">
            <strong>⚠️ IMPORTANT:</strong> Keep these codes safe and secure!<br>
            Each code can only be used once.
          </div>

          <div class="codes">
            ${this.setupData.backupCodes.map((code: string) => 
              `<div class="code">${code}</div>`
            ).join('')}
          </div>

          <div class="footer">
            <p>If you lose access to your authenticator app, you can use these codes to login.</p>
            <p>After using a code, it will be invalidated.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
    
    this.savedBackupCodes = true;
  }

  proceedToVerification() {
    if (!this.savedBackupCodes && !this.copiedBackupCodes) {
      this.error = 'Please save your backup codes before proceeding!';
      return;
    }

    this.currentStep = 'verify';
    this.error = '';
  }

  verifyAndEnable2FA() {
    if (!this.verificationCode.trim()) {
      this.error = 'Please enter the verification code';
      return;
    }

    if (this.verificationCode.length !== 6) {
      this.error = 'Verification code must be 6 digits';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.verify2FA(this.userId, this.verificationCode).subscribe({
      next: (response) => {
        console.log('2FA verification response:', response);
        this.loading = false;
        this.currentStep = 'complete';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid verification code. Please try again.';
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/user-dashboard']);
  }

  goToSecuritySettings() {
    this.router.navigate(['/security-settings']);
  }

  cancelSetup() {
    if (confirm('Are you sure you want to cancel 2FA setup? You can set it up later from your security settings.')) {
      this.router.navigate(['/user-dashboard']);
    }
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService, AdminCreateUserResponse } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  currentUser: User | null = null;
  users: AdminCreateUserResponse[] = [];
  filteredUsers: AdminCreateUserResponse[] = [];
  loading = false;
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 15;

  // Modal properties for confirmation
  showModal = false;
  modalData: any = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'btn-primary'
  };
  currentAction: { type: string; userId: number; userEmail?: string } | null = null;

  // Success modal
  showSuccessModal = false;
  successModalData: any = {
    title: 'Success',
    message: '',
    icon: 'fas fa-check-circle',
    iconColor: '#38a169',
    buttonText: 'OK'
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || !this.isAdminRole(this.currentUser.role)) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
  }

  private isAdminRole(role: string | undefined | null): boolean {
    if (!role) return false;
    const norm = role.toLowerCase().replace(/[-\s]/g, '_');
    return norm === 'admin' || norm === 'super_admin' || norm === 'superadmin';
  }

  loadUsers() {
    this.loading = true;
    this.toast.info('Loading users...');
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.loading = false;
        this.toast.success(`Loaded ${users.length} users`);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toast.error('Failed to load users');
        this.loading = false;
      }
    });
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(u => 
        u.appUser?.email?.toLowerCase().includes(term) ||
        u.userProfile?.firstName?.toLowerCase().includes(term) ||
        u.userProfile?.lastName?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1; // Reset to first page on filter change
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  banUser(userId: number) {
    this.currentAction = { type: 'ban', userId };
    this.modalData = {
      title: '🚫 Ban User',
      message: 'Are you sure you want to ban this user? This action will prevent them from accessing the marketplace.',
      confirmText: 'Ban User',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    };
    this.showModal = true;
  }

  unbanUser(userId: number) {
    this.currentAction = { type: 'unban', userId };
    this.modalData = {
      title: '✅ Unban User',
      message: 'Are you sure you want to unban this user? They will regain access to the marketplace.',
      confirmText: 'Unban User',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-success'
    };
    this.showModal = true;
  }

  verifyUser(userId: number) {
    this.currentAction = { type: 'verify', userId };
    this.modalData = {
      title: '✅ Verify User',
      message: 'Are you sure you want to verify this user? They will gain full access to the marketplace.',
      confirmText: 'Verify User',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-warning'
    };
    this.showModal = true;
  }

  resetPassword(userEmail: string) {
    this.currentAction = { type: 'resetPassword', userId: 0, userEmail };
    this.modalData = {
      title: '🔑 Reset Password',
      message: `Enter a new password for user: ${userEmail}`,
      confirmText: 'Reset Password',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-primary',
      showReasonInput: true,
      reasonPlaceholder: 'Enter new password...'
    };
    this.showModal = true;
  }

  onModalConfirmed(reason: string) {
    if (!this.currentAction) return;
    this.loading = true;
    const { type, userId, userEmail } = this.currentAction;

    switch (type) {
      case 'ban':
        this.adminService.banUser(userId).subscribe({
          next: () => {
            this.toast.success('User banned successfully');
            this.loadUsers();
            this.showSuccessMessage('User Banned', 'The user has been banned successfully.', 'fas fa-ban', '#e53e3e');
          },
          error: () => {
            this.toast.error('Failed to ban user');
            this.loading = false;
          }
        });
        break;

      case 'unban':
        this.adminService.unbanUser(userId).subscribe({
          next: () => {
            this.toast.success('User unbanned successfully');
            this.loadUsers();
            this.showSuccessMessage('User Unbanned', 'The user has been unbanned.', 'fas fa-check-circle', '#38a169');
          },
          error: () => {
            this.toast.error('Failed to unban user');
            this.loading = false;
          }
        });
        break;

      case 'verify':
        this.adminService.verifyUser(userId).subscribe({
          next: () => {
            this.toast.success('User verified successfully');
            this.loadUsers();
            this.showSuccessMessage('User Verified', 'The user has been verified.', 'fas fa-user-check', '#d69e2e');
          },
          error: () => {
            this.toast.error('Failed to verify user');
            this.loading = false;
          }
        });
        break;

      case 'resetPassword':
        if (userEmail && reason.trim()) {
          this.adminService.resetPassword(userEmail, reason.trim()).subscribe({
            next: () => {
              this.toast.success('Password reset successfully');
              this.loading = false;
              this.showSuccessMessage('Password Reset', `Password has been reset for ${userEmail}`, 'fas fa-key', '#667eea');
            },
            error: () => {
              this.toast.error('Failed to reset password');
              this.loading = false;
            }
          });
        }
        break;
    }

    this.resetModalState();
  }

  onModalCancelled() {
    this.resetModalState();
  }

  private resetModalState() {
    this.currentAction = null;
    this.showModal = false;
    this.cdr.detectChanges();
  }

  private showSuccessMessage(title: string, message: string, icon: string, iconColor: string) {
    this.successModalData = { title, message, icon, iconColor, buttonText: 'OK' };
    this.showSuccessModal = true;
  }

  onSuccessModalClosed() {
    this.showSuccessModal = false;
  }

  viewUserProfile(userId: number) {
    this.router.navigate(['/admin/user-profile', userId]);
  }

  isBanned(status: string): boolean {
    return status?.toLowerCase() === 'banned' || status?.toLowerCase() === 'suspended';
  }

  isActive(status: string): boolean {
    return status?.toLowerCase() === 'active';
  }

  isPendingVerification(status: string): boolean {
    return status?.toLowerCase() === 'pending verification' || 
           status?.toLowerCase() === 'pending_verification' ||
           status?.toLowerCase() === 'pendingverification';
  }
}


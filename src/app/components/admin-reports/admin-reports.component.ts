import { Component, OnInit } from '@angular/core';
import { AdminService, ProductReport } from '../../services/admin.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-reports',
  standalone: false,
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent implements OnInit {
  loading = false;
  error?: string;
  reports: ProductReport[] = [];
  filteredReports: ProductReport[] = [];
  
  // Filter state
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  
  // Review modal
  showReviewModal = false;
  selectedReport: ProductReport | null = null;
  reviewAction: 'approved' | 'rejected' | 'remove_product' = 'approved';
  adminNotes = '';
  submittingReview = false;

  // Enrichment caches
  private productsById = new Map<number, { name?: string }>();
  private usersById = new Map<number, { email?: string }>();

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.error = undefined;
    
    this.adminService.getPendingReports().subscribe({
      next: (reports) => {
        this.reports = reports || [];
        // Kick off enrichment but don't block UI
        this.enrichReports(this.reports);
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.error = 'Failed to load product reports';
        this.loading = false;
      }
    });
  }

  // Fetch additional data to replace N/A fields
  private enrichReports(reports: ProductReport[]): void {
    const productIds = Array.from(new Set(reports.map(r => r.productId).filter(Boolean))) as number[];
    const reporterIds = Array.from(new Set(reports.map(r => r.reporterUserId).filter(Boolean))) as number[];

    // Enrich products
    if (productIds.length) {
      // Use available products as a quick source; if missing, leave as N/A
      this.userService.getAvailableProducts().subscribe({
        next: (products) => {
          products.forEach(p => this.productsById.set(p.productId, { name: p.productName }));
          // Apply names if missing
          this.reports = this.reports.map(r => ({
            ...r,
            productName: r.productName || this.productsById.get(r.productId || -1)?.name
          }));
          this.applyFilters();
        },
        error: () => {
          // Non-fatal; keep N/A
        }
      });
    }

    // Enrich reporter emails (admin API has getUserProfile)
    if (reporterIds.length) {
      // Fetch in sequence to avoid too many requests; simple loop okay for small sets
      reporterIds.forEach(id => {
        this.adminService.getUserProfile(id).subscribe({
          next: (profile) => {
            this.usersById.set(id, { email: profile.userDetails?.email });
            this.reports = this.reports.map(r => (
              r.reporterUserId === id && !r.reporterEmail
                ? { ...r, reporterEmail: this.usersById.get(id)?.email }
                : r
            ));
            this.applyFilters();
          },
          error: () => {/* ignore */}
        });
      });
    }
  }

  applyFilters(): void {
    this.filteredReports = this.reports.filter(report => {
      // Status filter
      if (this.statusFilter !== 'all' && report.status !== this.statusFilter) {
        return false;
      }

      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesProduct = report.productName?.toLowerCase().includes(searchLower);
        const matchesReason = report.reportReason?.toLowerCase().includes(searchLower);
        const matchesReporter = report.reporterEmail?.toLowerCase().includes(searchLower);
        const matchesId = report.reportId?.toString().includes(searchLower) || 
                          report.productId?.toString().includes(searchLower);
        
        if (!matchesProduct && !matchesReason && !matchesReporter && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  openReviewModal(report: ProductReport): void {
    this.selectedReport = report;
    this.reviewAction = 'approved';
    this.adminNotes = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedReport = null;
    this.adminNotes = '';
  }

  submitReview(): void {
    if (!this.selectedReport || this.submittingReview) return;

    this.submittingReview = true;

    this.adminService.reviewReport(
      this.selectedReport.reportId,
      this.reviewAction,
      this.adminNotes
    ).subscribe({
      next: (response) => {
        console.log('Review submitted:', response);
        this.toastService.success(`Report ${this.reviewAction}. ${
          this.reviewAction === 'remove_product' ? 'Product has been removed.' : ''
        }`);
        this.submittingReview = false;
        this.closeReviewModal();
        this.loadReports(); // Refresh list
      },
      error: (err) => {
        console.error('Failed to review report:', err);
        this.toastService.error('Failed to process report review');
        this.submittingReview = false;
      }
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getReportDate(report: ProductReport): string {
    // Try different date fields that might exist
    const date = report.reportedAt || (report as any).createdAt || (report as any).reportedDate;
    return this.formatDate(date);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-secondary';
      default: return 'badge-default';
    }
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'approved': return 'Approve & Flag Product';
      case 'rejected': return 'Reject Report';
      case 'remove_product': return 'Remove Product';
      default: return action;
    }
  }
}

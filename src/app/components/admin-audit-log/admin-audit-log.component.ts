import { Component, OnInit } from '@angular/core';
import { AdminService, AuditLog } from '../../services/admin.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-admin-audit-log',
  standalone: false,
  templateUrl: './admin-audit-log.component.html',
  styleUrls: ['./admin-audit-log.component.scss']
})
export class AdminAuditLogComponent implements OnInit {
  loading = false;
  error?: string;
  allLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  filterForm: FormGroup;

  // Filter options (extracted from logs)
  availableActions: string[] = [];
  availableTargetTypes: string[] = [];

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      searchText: [''],
      action: [''],
      targetType: [''],
      dateFrom: [''],
      dateTo: [''],
      userId: ['']
    });
  }

  ngOnInit(): void {
    this.loadAuditLogs();
    
    // Apply filters when form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.error = undefined;
    
    // New API: Get all logs and filter on frontend
    this.adminService.getAuditLogs().subscribe({
      next: (logs) => {
        this.allLogs = logs;
        this.filteredLogs = [...logs];
        this.extractFilterOptions();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load audit logs:', err);
        this.error = 'Failed to load audit logs';
        this.loading = false;
      }
    });
  }

  private extractFilterOptions(): void {
    const actionsSet = new Set<string>();
    const targetTypesSet = new Set<string>();

    this.allLogs.forEach(log => {
      if (log.action) actionsSet.add(log.action);
      if (log.targetType) targetTypesSet.add(log.targetType);
    });

    this.availableActions = Array.from(actionsSet).sort();
    this.availableTargetTypes = Array.from(targetTypesSet).sort();
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredLogs = this.allLogs.filter(log => {
      // Filter by action
      if (filters.action && log.action !== filters.action) {
        return false;
      }

      // Filter by target type
      if (filters.targetType && log.targetType !== filters.targetType) {
        return false;
      }

      // Filter by userId
      if (filters.userId && log.userId.toString() !== filters.userId.toString()) {
        return false;
      }

      // Filter by date range
      if (filters.dateFrom) {
        const logDate = new Date(log.timestamp);
        const fromDate = new Date(filters.dateFrom);
        if (logDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const logDate = new Date(log.timestamp);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (logDate > toDate) {
          return false;
        }
      }

      // Filter by search text in details
      if (filters.searchText && filters.searchText.trim() !== '') {
        const searchLower = filters.searchText.toLowerCase();
        const detailsMatch = log.details?.toLowerCase().includes(searchLower);
        const targetIdMatch = log.targetId?.toLowerCase().includes(searchLower);
        if (!detailsMatch && !targetIdMatch) {
          return false;
        }
      }

      return true;
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchText: '',
      action: '',
      targetType: '',
      dateFrom: '',
      dateTo: '',
      userId: ''
    });
    this.filteredLogs = [...this.allLogs];
  }

  exportLogs(): void {
    // Export filtered logs as CSV
    const headers = ['ID', 'Timestamp', 'User ID', 'Action', 'Target Type', 'Target ID', 'Details'];
    const csvRows = [headers.join(',')];

    this.filteredLogs.forEach(log => {
      const row = [
        log.id,
        log.timestamp,
        log.userId,
        log.action,
        log.targetType,
        log.targetId,
        `"${log.details?.replace(/"/g, '""') || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

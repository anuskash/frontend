import { Component, OnInit } from '@angular/core';
import { AdminService, MarketPlaceProduct } from '../../services/admin.service';
import { FormBuilder, FormGroup } from '@angular/forms';

type ListingView = MarketPlaceProduct & { hidden?: boolean };

@Component({
  selector: 'app-admin-listings',
  standalone: false,
  templateUrl: './admin-listings.component.html',
  styleUrls: ['./admin-listings.component.scss']
})
export class AdminListingsComponent implements OnInit {
  loading = false;
  error?: string;
  listings: ListingView[] = [];
  filtered: ListingView[] = [];
  filterForm: FormGroup;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      q: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadFlagged();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadFlagged(): void {
    this.loading = true;
    this.error = undefined;
    this.adminService.getFlaggedProducts().subscribe({
      next: products => {
        this.listings = products.map(p => ({ ...p, hidden: p.status?.toLowerCase() === 'hidden' }));
        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        this.error = 'Failed to load flagged listings';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const { q, status } = this.filterForm.value;
    this.filtered = this.listings.filter(l => {
      const matchesQ = !q || l.productName.toLowerCase().includes(q.toLowerCase()) || l.category.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = !status || status === 'flagged' && (l as any).flagged || status && l.status.toLowerCase() === status.toLowerCase();
      return matchesQ && matchesStatus;
    });
  }

  unflag(listing: ListingView): void {
    if (!confirm(`Remove flag from ${listing.productName}?`)) return;
    this.adminService.unflagProduct(listing.productId).subscribe({
      next: () => this.loadFlagged(),
      error: () => alert('Failed to unflag')
    });
  }

  hide(listing: ListingView): void {
    if (!confirm(`Hide listing ${listing.productName}?`)) return;
    this.adminService.hideProduct(listing.productId).subscribe({
      next: () => this.loadFlagged(),
      error: () => alert('Failed to hide')
    });
  }

  unhide(listing: ListingView): void {
    if (!confirm(`Unhide listing ${listing.productName}?`)) return;
    this.adminService.unhideProduct(listing.productId).subscribe({
      next: () => this.loadFlagged(),
      error: () => alert('Failed to unhide')
    });
  }

  delete(listing: ListingView): void {
    if (!confirm(`Delete listing ${listing.productName}? This cannot be undone.`)) return;
    this.adminService.deleteListing(listing.productId).subscribe({
      next: () => this.loadFlagged(),
      error: () => alert('Failed to delete')
    });
  }
}

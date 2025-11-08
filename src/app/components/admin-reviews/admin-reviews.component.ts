import { Component, OnInit } from '@angular/core';
import { AdminService, BuyerReview, SellerReview } from '../../services/admin.service';
import { FormBuilder, FormGroup } from '@angular/forms';

interface ReviewView {
  type: 'buyer' | 'seller';
  reviewId: number;
  productId?: number;
  reviewerId?: number;
  targetUserId?: number; // buyerId or sellerId
  reviewerName: string;
  targetName: string; // buyerName or sellerName
  rating: number;
  reviewText: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  category: string;
  condition: string;
  flagged?: boolean;
  hidden?: boolean;
  flagReason?: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.scss']
})
export class AdminReviewsComponent implements OnInit {
  loading = false;
  error?: string;
  reviews: ReviewView[] = [];
  filtered: ReviewView[] = [];
  filterForm: FormGroup;
  violationCounts: Record<string, number> = {}; // key: userId role composite
  showStats = true;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      q: [''],
      type: [''],
      flaggedOnly: [false],
      hiddenOnly: [false],
      minRating: [''],
      maxRating: ['']
    });
  }

  ngOnInit(): void {
    this.loadAll();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadAll(): void {
    this.loading = true;
    this.error = undefined;
    // Use new dedicated endpoints for moderation lists
    const buyer$ = this.adminService.getAllBuyerReviews();
    const seller$ = this.adminService.getAllSellerReviews();
    let buyer: BuyerReview[] = [];
    let seller: SellerReview[] = [];
    let done = 0;
    buyer$.subscribe({
      next: b => { buyer = b; done++; if (done === 2) this.finishLoad(buyer, seller); },
      error: (err) => { console.error('Buyer reviews load error:', err); this.error = 'Failed to load buyer reviews'; this.loading = false; }
    });
    seller$.subscribe({
      next: s => { seller = s; done++; if (done === 2) this.finishLoad(buyer, seller); },
      error: (err) => { console.error('Seller reviews load error:', err); this.error = 'Failed to load seller reviews'; this.loading = false; }
    });
  }

  finishLoad(buyer: BuyerReview[], seller: SellerReview[]): void {
    this.reviews = [
      ...buyer.map(r => this.mapBuyer(r)),
      ...seller.map(r => this.mapSeller(r))
    ];
    this.computeViolations();
    this.applyFilters();
    this.loading = false;
  }

  mapBuyer(r: BuyerReview): ReviewView {
    return {
      type: 'buyer',
      reviewId: r.reviewId,
      productId: (r as any).productId,
      reviewerId: r.reviewerId,
      targetUserId: r.buyerId,
      reviewerName: r.reviewerName,
      targetName: r.buyerName,
      rating: r.rating,
      reviewText: r.reviewText,
      productName: r.productName,
      productPrice: r.productPrice,
      productImageUrl: r.productImageUrl,
      category: r.category,
      condition: r.condition,
      flagged: r.flagged,
      hidden: r.hidden,
      flagReason: r.flagReason
    };
  }

  mapSeller(r: SellerReview): ReviewView {
    return {
      type: 'seller',
      reviewId: r.reviewId,
      productId: (r as any).productId,
      reviewerId: r.reviewerId,
      targetUserId: r.sellerId,
      reviewerName: r.reviewerName,
      targetName: r.sellerName,
      rating: r.rating,
      reviewText: r.reviewText,
      productName: r.productName,
      productPrice: r.productPrice,
      productImageUrl: r.productImageUrl,
      category: r.category,
      condition: r.condition,
      flagged: r.flagged,
      hidden: r.hidden,
      flagReason: r.flagReason
    };
  }

  applyFilters(): void {
    const { q, type, flaggedOnly, hiddenOnly, minRating, maxRating } = this.filterForm.value;
    this.filtered = this.reviews.filter(r => {
      const searchLower = q?.toLowerCase();
      const matchesQ = !q ||
        r.reviewText.toLowerCase().includes(searchLower) ||
        r.productName.toLowerCase().includes(searchLower) ||
        r.reviewerName.toLowerCase().includes(searchLower) ||
        r.targetName.toLowerCase().includes(searchLower) ||
        (r.flagReason?.toLowerCase().includes(searchLower));
      const matchesType = !type || r.type === type;
      const matchesFlag = !flaggedOnly || r.flagged;
      const matchesHidden = !hiddenOnly || r.hidden;
      const matchesMin = !minRating || r.rating >= Number(minRating);
      const matchesMax = !maxRating || r.rating <= Number(maxRating);
      return matchesQ && matchesType && matchesFlag && matchesHidden && matchesMin && matchesMax;
    });
  }

  computeViolations(): void {
    const counts: Record<string, number> = {};
    this.reviews.forEach(r => {
      if (r.flagged || r.hidden) {
        const key = `${r.targetUserId || 'unknown'}:${r.type}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    this.violationCounts = counts;
  }

  flag(r: ReviewView): void {
    if (!confirm('Flag this review as abusive?')) return;
    const reason = prompt('Optional: provide flag reason') || undefined;
    const obs = r.type === 'seller'
      ? this.adminService.flagSellerReview(r.reviewId, reason)
      : this.adminService.flagBuyerReview(r.reviewId, reason);
    obs.subscribe({
      next: () => this.loadAll(),
      error: () => alert('Failed to flag review')
    });
  }

  hide(r: ReviewView): void {
    if (!confirm('Hide this review from public view?')) return;
    const obs = r.type === 'seller'
      ? this.adminService.hideSellerReview(r.reviewId)
      : this.adminService.hideBuyerReview(r.reviewId);
    obs.subscribe({
      next: () => this.loadAll(),
      error: () => alert('Failed to hide review')
    });
  }

  unhide(r: ReviewView): void {
    if (!confirm('Restore this review to public view?')) return;
    // No dedicated unhide endpoints provided—would need backend support.
    alert('Unhide functionality requires backend endpoint (not implemented).');
  }

  remove(r: ReviewView): void {
    if (!confirm('Delete this review permanently?')) return;
    const obs = r.type === 'seller'
      ? this.adminService.deleteSellerReview(r.reviewId)
      : this.adminService.deleteBuyerReview(r.reviewId);
    obs.subscribe({
      next: () => this.loadAll(),
      error: () => alert('Failed to delete review')
    });
  }
}

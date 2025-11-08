import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarketPlaceProduct } from '../../models/product.model';
import { UserService } from '../../services/user.service';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

interface ProductImagesResponse {
  productId: number;
  imageUrls: string[];
  count: number;
}

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: MarketPlaceProduct | null = null;
  productId!: number;

  // Images
  images: string[] = [];
  currentImageIndex = 0;
  isLoadingImages = false;

  // Reviews
  totalSellerReviews = 0;
  totalBuyerReviews = 0;

  // Seller contact
  sellerEmail = '';
  sellerPhone = '';
  isLoadingSeller = false;

  // Similar items
  similarProducts: MarketPlaceProduct[] = [];

  // Save/Share/Report state
  isSaved = false;
  savingProduct = false;
  showShareModal = false;
  showReportModal = false;
  reportReason = '';
  reportDescription = '';
  reportSubmitting = false;

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private messagingService: MessagingService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.route.paramMap.subscribe(params => {
        const idParam = params.get('id');
        if (!idParam) {
          this.router.navigate(['/browse-listings']);
          return;
        }
        this.productId = Number(idParam);
        // Attempt to use navigation state first
        const navProduct: MarketPlaceProduct | undefined = history.state?.product;
        if (navProduct && navProduct.productId === this.productId) {
          this.product = navProduct;
          this.afterProductLoaded();
        } else {
          // Fallback: fetch available products and find this one
          const sub = this.userService.getAvailableProducts().subscribe({
            next: (products) => {
              this.product = products.find(p => p.productId === this.productId) || null;
              if (!this.product) {
                // As a last resort, navigate back
                this.router.navigate(['/browse-listings']);
                return;
              }
              this.afterProductLoaded();
            },
            error: () => {
              this.router.navigate(['/browse-listings']);
            }
          });
          this.subs.push(sub);
        }
      })
    );
  }

  private afterProductLoaded(): void {
    if (!this.product) return;
    
        // Check if product is saved
    this.userService.isProductSaved(this.product.productId).subscribe({
      next: (resp) => {
        this.isSaved = !!resp?.isSaved;
      },
      error: (err) => console.error('Error checking saved status:', err)
    });

    // Load images from API
    this.isLoadingImages = true;
    const imgsSub = this.userService.fetchProductImageUrls(this.product.productId).subscribe({
      next: (res: ProductImagesResponse) => {
        this.images = res.imageUrls?.length ? res.imageUrls : this.fallbackImages();
        this.isLoadingImages = false;
      },
      error: () => {
        this.images = this.fallbackImages();
        this.isLoadingImages = false;
      }
    });
    this.subs.push(imgsSub);

    // Load reviews counts
    const revSub = this.userService.getProductReviews(this.product.productId).subscribe({
      next: (reviews) => {
        this.totalSellerReviews = reviews.sellerReviews?.length || 0;
        this.totalBuyerReviews = reviews.buyerReviews?.length || 0;
      },
      error: () => {
        this.totalSellerReviews = 0;
        this.totalBuyerReviews = 0;
      }
    });
    this.subs.push(revSub);

    // Load seller contact
    this.isLoadingSeller = true;
    const sellerSub = this.userService.getSellerInfo(this.product.sellerId).subscribe({
      next: (seller) => {
        this.sellerEmail = seller.email;
        this.sellerPhone = seller.phoneNumber || '';
        this.isLoadingSeller = false;
      },
      error: () => {
        this.sellerEmail = '';
        this.sellerPhone = '';
        this.isLoadingSeller = false;
      }
    });
    this.subs.push(sellerSub);

    // Load similar items
    const simSub = this.userService.getAvailableProducts().subscribe({
      next: (products) => {
        this.similarProducts = products
          .filter(p => p.productId !== this.productId && p.category === this.product?.category)
          .slice(0, 8);
      },
      error: () => {
        this.similarProducts = [];
      }
    });
    this.subs.push(simSub);
  }

  private fallbackImages(): string[] {
    if (!this.product) return [];
    if (this.product.productImages?.length) return this.product.productImages;
    if (this.product.productImageUrl) return [this.product.productImageUrl];
    return [];
  }

  // Image carousel
  get hasMultipleImages(): boolean { return this.images.length > 1; }
  get currentImage(): string { return this.images[this.currentImageIndex] || ''; }
  prevImage(): void { if (this.currentImageIndex > 0) this.currentImageIndex--; }
  nextImage(): void { if (this.currentImageIndex < this.images.length - 1) this.currentImageIndex++; }
  goToImage(i: number): void { this.currentImageIndex = i; }

  formatPrice(price: number | undefined): string { return price != null ? `$${price.toFixed(2)}` : 'N/A'; }

  copy(text: string) { 
    navigator.clipboard.writeText(text).then(() => {
      // Successfully copied
    }).catch(() => {}); 
  }

  trackById(_idx: number, p: MarketPlaceProduct) { return p.productId; }

  navigateToSimilar(p: MarketPlaceProduct) { this.router.navigate(['/product', p.productId], { state: { product: p } }); }

  // Message sending state
  messageSending = false;
  messageSuccess = false;
  messageError = false;
  messageContent = '';

  sendMessage(content: string) {
    const text = content?.trim();
    if (!text || !this.product || this.messageSending) return;

    this.messageSending = true;
    this.messageSuccess = false;
    this.messageError = false;

    const currentUserId = this.authService.getCurrentUser()?.userId;
    if (!currentUserId) {
      this.messageError = true;
      this.messageSending = false;
      setTimeout(() => this.messageError = false, 3000);
      return;
    }

    this.messagingService.sendMessage(currentUserId, {
      receiverId: this.product.sellerId,
      productId: this.product.productId!,
      content: text
    }).subscribe({
      next: () => {
        this.messageSending = false;
        this.messageSuccess = true;
        this.messageContent = '';
        setTimeout(() => this.messageSuccess = false, 5000);
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        this.messageSending = false;
        this.messageError = true;
        setTimeout(() => this.messageError = false, 5000);
      }
    });
  }

  // Save / Unsave product using structured responses
  toggleSave(): void {
    if (!this.product || this.savingProduct) return;

    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please log in to save products');
      return;
    }

    this.savingProduct = true;
    const productId = this.product.productId;

    const request$ = this.isSaved
      ? this.userService.unsaveProduct(productId)
      : this.userService.saveProduct(productId);

    request$.subscribe({
      next: (resp: any) => {
        if (resp?.success === false) {
          this.toastService.error(resp.message || 'Operation failed');
        } else {
          this.isSaved = !this.isSaved;
          const msg = resp?.message || (this.isSaved ? 'Product saved successfully' : 'Product removed from saved list');
          this.toastService.success(msg);
        }
        this.savingProduct = false;
      },
      error: (err) => {
        console.error('Failed to toggle save:', err);
        this.toastService.error('Failed to update saved status. Please try again.');
        this.savingProduct = false;
      }
    });
  }

  // Share product
  openShareModal(): void {
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
  }

  shareViaEmail(): void {
    if (!this.product) return;
    const subject = encodeURIComponent(`Check out: ${this.product.productName}`);
    const body = encodeURIComponent(
      `I found this product on UON Marketplace:\n\n${this.product.productName}\nPrice: ${this.formatPrice(this.product.price)}\n\nView it here: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    this.closeShareModal();
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
      this.closeShareModal();
    }).catch(() => {
      alert('Failed to copy link');
    });
  }

  shareNative(): void {
    if (!this.product) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.product.productName,
        text: `Check out ${this.product.productName} on UON Marketplace`,
        url: window.location.href
      }).catch(() => {
        // User cancelled or error - ignore
      });
      this.closeShareModal();
    } else {
      this.copyLink();
    }
  }

  // Report product
  openReportModal(): void {
    this.showReportModal = true;
    this.reportReason = '';
    this.reportDescription = '';
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportReason = '';
    this.reportDescription = '';
  }

  submitReport(): void {
    if (!this.product || !this.reportReason || this.reportSubmitting) {
      console.warn('Cannot submit report:', { 
        hasProduct: !!this.product, 
        hasReason: !!this.reportReason, 
        isSubmitting: this.reportSubmitting 
      });
      return;
    }

    // Check if user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.error('Please log in to report products');
      this.closeReportModal();
      return;
    }

    // Extract productId - try both possible property names
    const productId = this.product.productId || (this.product as any).id;
    
    if (!productId) {
      console.error('Product ID is missing from product object:', this.product);
      this.toastService.error('Unable to report: Product ID is missing');
      return;
    }

    this.reportSubmitting = true;
    
    const reportPayload = {
      productId: Number(productId), // Ensure it's a number
      reportReason: this.reportReason,
      reportDetails: this.reportDescription || undefined
    };
    
    console.log('Submitting report with payload:', reportPayload);
    console.log('Current user:', currentUser);
    console.log('Full product object:', this.product);
    
    this.userService.reportProduct(reportPayload).subscribe({
      next: (response) => {
        console.log('Report submitted successfully:', response);
        this.reportSubmitting = false;
        this.closeReportModal();
        this.toastService.success('Thank you for your report. Our team will review it shortly.');
      },
      error: (err) => {
        console.error('Failed to submit report - Full error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', err.error);
        this.reportSubmitting = false;
        
        let errorMessage = 'Failed to submit report. Please try again.';
        
        // Check if user already reported this product
        if (err.status === 400 || err.status === 409) {
          const errorText = typeof err.error === 'string' ? err.error : err.error?.message || '';
          if (errorText.toLowerCase().includes('already reported')) {
            errorMessage = 'You have already reported this product';
          } else if (errorText) {
            errorMessage = errorText;
          }
        } else if (err.status === 404) {
          errorMessage = 'Report endpoint not found. Please contact support.';
        } else if (err.status === 401) {
          errorMessage = 'You must be logged in to report products.';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to report this product.';
        } else if (err.status === 0) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        }
        
        this.toastService.error(errorMessage);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}

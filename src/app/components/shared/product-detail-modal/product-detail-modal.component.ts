import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { MarketPlaceProduct } from '../../../models/product.model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-product-detail-modal',
  standalone: false,
  templateUrl: './product-detail-modal.component.html',
  styleUrls: ['./product-detail-modal.component.scss']
})
export class ProductDetailModalComponent implements OnChanges {
  @Input() product: MarketPlaceProduct | null = null;
  @Input() show = false;
  @Output() closeModal = new EventEmitter<void>();

  currentImageIndex = 0;
  loadedImages: string[] = [];
  isLoadingImages = false;

  constructor(private userService: UserService, private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    // When product changes and modal is shown, load images from backend
    if (changes['product'] && this.product && this.product.productId) {
      this.loadProductImagesFromApi();
    }
    
    // Reset image index when product changes
    if (changes['product']) {
      this.currentImageIndex = 0;
    }
  }

  /**
   * Load product images from backend API
   * Falls back to product.productImages if API fails
   */
  private loadProductImagesFromApi(): void {
    if (!this.product) return;

    this.isLoadingImages = true;
    
    this.userService.fetchProductImageUrls(this.product.productId).subscribe({
      next: (response) => {
        if (response.imageUrls && response.imageUrls.length > 0) {
          this.loadedImages = response.imageUrls;
        } else {
          // Fallback to existing product images
          this.loadedImages = this.getFallbackImages();
        }
        this.isLoadingImages = false;
      },
      error: (error) => {
        console.warn('Failed to load product images from API, using fallback:', error);
        this.loadedImages = this.getFallbackImages();
        this.isLoadingImages = false;
      }
    });
  }

  /**
   * Get fallback images from product object
   */
  private getFallbackImages(): string[] {
    if (!this.product) return [];
    if (this.product.productImages && this.product.productImages.length > 0) {
      return this.product.productImages;
    }
    if (this.product.productImageUrl) {
      return [this.product.productImageUrl];
    }
    return [];
  }

  get images(): string[] {
    // Prefer API-loaded images, fallback to product object images
    if (this.loadedImages.length > 0) {
      return this.loadedImages;
    }
    if (!this.product) return [];
    // Use productImages array if available, otherwise fallback to single productImageUrl
    if (this.product.productImages && this.product.productImages.length > 0) {
      return this.product.productImages;
    }
    if (this.product.productImageUrl) {
      return [this.product.productImageUrl];
    }
    return [];
  }

  get currentImage(): string {
    return this.images[this.currentImageIndex] || '';
  }

  nextImage(): void {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  close(): void {
    this.currentImageIndex = 0;
    this.closeModal.emit();
  }

  viewMore(): void {
    if (!this.product) return;
    const productId = this.product.productId;
    // Pass minimal state to reduce refetch on navigation
    this.router.navigate(['/product', productId], { state: { product: this.product } });
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) {
      return 'Price not set';
    }
    return `$${price.toFixed(2)}`;
  }

  formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

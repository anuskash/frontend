import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { MarketPlaceProduct } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-saved-products',
  standalone: false,
  templateUrl: './saved-products.component.html',
  styleUrls: ['./saved-products.component.scss']
})
export class SavedProductsComponent implements OnInit {
  savedProducts: MarketPlaceProduct[] = [];
  isLoading = true;
  errorMessage = '';
  currentUserId: number | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUserId = user.userId;
    this.loadSavedProducts();
  }

  loadSavedProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getSavedProducts().subscribe({
      next: (products) => {
        this.savedProducts = products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading saved products:', err);
        this.errorMessage = 'Failed to load saved products. Please try again.';
        this.isLoading = false;
      }
    });
  }

  removeFromSaved(productId: number): void {
    if (confirm('Remove this item from your saved products?')) {
      this.userService.unsaveProduct(productId).subscribe({
        next: () => {
          this.savedProducts = this.savedProducts.filter(p => p.productId !== productId);
          this.toastService.success('Product removed from saved list');
        },
        error: (err) => {
          console.error('Failed to remove product:', err);
          this.toastService.error('Failed to remove product. Please try again.');
        }
      });
    }
  }

  viewProduct(product: MarketPlaceProduct): void {
    this.router.navigate(['/product', product.productId]);
  }

  trackById(_idx: number, p: MarketPlaceProduct): number {
    return p.productId;
  }
}

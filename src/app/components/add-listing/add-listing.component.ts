import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { MarketPlaceProductRequest } from '../../models/product.model';
import { UploadService } from '../../services/upload.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-add-listing',
  templateUrl: './add-listing.component.html',
  standalone: false,
  styleUrls: ['./add-listing.component.scss']
})
export class AddListingComponent implements OnInit {
  addListingForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  
  // Edit mode properties
  isEditMode = false;
  productId: number | null = null;
  
  // Image preview properties
  previewImageUrl = '';
  imageLoadError = false;
  imageLoading = false;

  // New uploader state
  previews: { file: File; url: string; progress?: number; error?: string }[] = [];
  multipleEnabled = false;
  primaryIndex = 0;
  validationError = '';
  // Drag & drop state
  isDragOver = false;
  // Stepper state: 1=Title, 2=Category, 3=Details
  currentStep: 1 | 2 | 3 = 1;
  // Track whether a step has been submitted (to show validation)
  stepSubmitted: Record<1 | 2 | 3, boolean> = { 1: false, 2: false, 3: false };

  // Predefined options for dropdowns
  categories = [
    'Electronics', 'Books & Media', 'Clothing & Accessories', 'Home & Garden',
    'Sports & Recreation', 'Vehicles & Parts', 'Health & Beauty', 'Food & Beverages',
    'Tools & Equipment', 'Art & Collectibles', 'Other'
  ];

  conditions = [
    'New', 'Like New', 'Good', 'Fair', 'Poor'
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private uploadService: UploadService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = parseInt(id, 10);
        this.loadProductData();
      }
    });
    
    this.initializeForm();
    this.setupImagePreview();
  }

  private initializeForm() {
    this.addListingForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      productDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      price: ['', [Validators.required, Validators.min(0.01), Validators.max(999999)]],
      category: ['', Validators.required],
      condition: ['', Validators.required],
      // productImageUrl is optional - no required validator, and pattern only applies if value exists
      productImageUrl: ['']
    });
  }

  private loadProductData() {
    if (!this.productId) return;
    
    // Get current user ID for fetching seller products
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.userId) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    // Fetch seller products and find the one being edited
    this.userService.getProductsBySeller(currentUser.userId).subscribe({
      next: (products) => {
        const product = products.find(p => p.productId === this.productId);
        if (!product) {
          this.errorMessage = 'Product not found';
          this.router.navigate(['/my-listings']);
          return;
        }

        // Check ownership
        if (product.sellerId !== currentUser.userId) {
          this.errorMessage = 'You can only edit your own products';
          this.router.navigate(['/my-listings']);
          return;
        }

        // Populate form with existing data
        this.addListingForm.patchValue({
          productName: product.productName,
          productDescription: product.productDescription,
          price: product.price,
          category: product.category,
          condition: product.condition,
          productImageUrl: '' // Clear this since we're using productImages array
        });

        // Load existing images into previews
        if (product.productImages && product.productImages.length > 0) {
          this.previews = product.productImages.map((url: string) => ({
            file: null as any, // No file for existing images
            url: url,
            progress: 100
          }));
          
          if (this.previews.length > 1) {
            this.multipleEnabled = true;
          }
        } else if (product.productImageUrl) {
          // Fallback to single image URL if no array
          this.previews = [{
            file: null as any,
            url: product.productImageUrl,
            progress: 100
          }];
        }
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.errorMessage = 'Failed to load product data';
      }
    });
  }

  private setupImagePreview() {
    // Subscribe to image URL changes for preview
    this.addListingForm.get('productImageUrl')?.valueChanges.subscribe((url: string) => {
      if (url && url.trim() && this.isValidUrl(url)) {
        this.previewImageUrl = url.trim();
        this.imageLoadError = false;
        this.imageLoading = true;
      } else {
        this.previewImageUrl = '';
        this.imageLoadError = false;
        this.imageLoading = false;
      }
    });
  }

  // File selection handlers
  async onSingleSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.resetPreviews();
    const file = input.files[0];
    await this.validateAndAdd(file);
  }

  enableMultiple() {
    this.multipleEnabled = true;
  }

  async onMultipleSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    for (const f of Array.from(input.files)) {
      // eslint-disable-next-line no-await-in-loop
      await this.validateAndAdd(f);
    }
  }

  private async validateAndAdd(file: File) {
    this.validationError = '';
    const validBasic = this.validateFileBasics(file);
    if (!validBasic) return;
    const dimsOk = await this.validateImageDimensions(file);
    if (!dimsOk) return;
    this.addPreview(file);
  }

  private addPreview(file: File) {
    const url = URL.createObjectURL(file);
    this.previews.push({ file, url, progress: 0 });
  }

  private resetPreviews() {
    this.previews.forEach((p) => URL.revokeObjectURL(p.url));
    this.previews = [];
    this.primaryIndex = 0;
  }

  setPrimary(i: number) {
    this.primaryIndex = i;
  }

  remove(i: number) {
    URL.revokeObjectURL(this.previews[i].url);
    this.previews.splice(i, 1);
    if (this.primaryIndex >= this.previews.length) this.primaryIndex = 0;
  }

  // Match backend constraints (type/size; optional dimensions check)
  private validateFileBasics(file: File): boolean {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.validationError = 'Only JPEG, PNG, or WEBP images are allowed.';
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.validationError = 'Image must be 5 MB or smaller.';
      return false;
    }
    return true;
  }

  private validateImageDimensions(file: File): Promise<boolean> {
    const MIN = 300;
    const MAX = 4000;
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const { width, height } = img as HTMLImageElement;
        URL.revokeObjectURL(url);
        if (width < MIN || height < MIN) {
          this.validationError = `Image dimensions too small (${width}x${height}). Minimum is ${MIN}x${MIN}.`;
          resolve(false);
          return;
        }
        if (width > MAX || height > MAX) {
          this.validationError = `Image dimensions too large (${width}x${height}). Maximum is ${MAX}x${MAX}.`;
          resolve(false);
          return;
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        // If we cannot read dimensions, allow but warn
        this.validationError = '';
        resolve(true);
      };
      img.src = url;
    });
  }

  // Drag & drop events
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }
  async onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    if (!this.multipleEnabled) this.resetPreviews();
    for (const f of Array.from(files)) {
      // eslint-disable-next-line no-await-in-loop
      await this.validateAndAdd(f);
    }
  }

  // Stepper navigation
  goNext() {
    if (this.currentStep === 1) {
      this.stepSubmitted[1] = true;
      const nameCtrl = this.addListingForm.get('productName');
      if (nameCtrl?.invalid) return;
      this.currentStep = 2;
      this.stepSubmitted[2] = false;
      return;
    }
    if (this.currentStep === 2) {
      this.stepSubmitted[2] = true;
      const catCtrl = this.addListingForm.get('category');
      const condCtrl = this.addListingForm.get('condition');
      if (catCtrl?.invalid || condCtrl?.invalid) return;
      this.currentStep = 3;
      this.stepSubmitted[3] = false;
      return;
    }
  }
  goBack() {
    if (this.currentStep === 3) { this.currentStep = 2; return; }
    if (this.currentStep === 2) { this.currentStep = 1; return; }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  onImageLoad() {
    this.imageLoading = false;
    this.imageLoadError = false;
  }

  onImageError() {
    this.imageLoading = false;
    this.imageLoadError = true;
  }

  onSubmit() {
    if (this.addListingForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        this.errorMessage = 'User not authenticated. Please login again.';
        this.isSubmitting = false;
        return;
      }

      const finalizeCreateOrUpdate = (uploadedImageUrls: string[]) => {
        if (this.isEditMode && this.productId) {
          // UPDATE MODE
          const updateRequest: MarketPlaceProductRequest = {
            sellerId: currentUser.userId,
            productName: this.addListingForm.value.productName,
            productDescription: this.addListingForm.value.productDescription,
            price: this.addListingForm.value.price,
            category: this.addListingForm.value.category,
            condition: this.addListingForm.value.condition,
            imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
            productImageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : undefined
          };

          this.userService.updateProduct(this.productId, currentUser.userId, updateRequest).subscribe({
            next: () => {
              this.successMessage = 'Listing updated successfully!';
              this.isSubmitting = false;
              setTimeout(() => {
                this.router.navigate(['/my-listings']);
              }, 2000);
            },
            error: (error) => {
              console.error('Error updating listing:', error);
              if (error.status === 403) {
                this.errorMessage = 'You can only edit your own products';
              } else if (error.status === 400) {
                this.errorMessage = error.error?.error || 'Product rejected by content moderation';
              } else {
                this.errorMessage = 'Failed to update listing. Please try again.';
              }
              this.isSubmitting = false;
            }
          });
        } else {
          // CREATE MODE
          const productRequest: MarketPlaceProductRequest = {
            sellerId: currentUser.userId,
            productName: this.addListingForm.value.productName,
            productDescription: this.addListingForm.value.productDescription,
            price: this.addListingForm.value.price,
            category: this.addListingForm.value.category,
            condition: this.addListingForm.value.condition,
            status: 'AVAILABLE',
            imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
            productImageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : undefined
          };

          this.userService.addProduct(productRequest).subscribe({
            next: () => {
              this.successMessage = 'Listing created successfully!';
              this.isSubmitting = false;
              setTimeout(() => {
                this.router.navigate(['/my-listings']);
              }, 2000);
            },
            error: (error) => {
              console.error('Error creating listing:', error);
              const backendMsg = error?.error?.error || error?.error?.message || error?.message || '';
              // If backend message contains 'prohibited' or 'inappropriate', show a clear error
              if (backendMsg && (backendMsg.toLowerCase().includes('prohibited') || backendMsg.toLowerCase().includes('inappropriate'))) {
                // Try to extract the word
                let word = '';
                const match = backendMsg.match(/prohibited keyword: ([^\s]+)/i) || backendMsg.match(/inappropriate word: ([^\s]+)/i);
                if (match && match[1]) {
                  word = match[1];
                } else {
                  // Try to extract quoted word
                  const quoted = backendMsg.match(/['"]([^'"]+)['"]/);
                  if (quoted && quoted[1]) word = quoted[1];
                }
                this.errorMessage = word
                  ? `Can't post this item. This marketplace does not allow listing of "${word}" or similar products.`
                  : `Can't post this item. This marketplace does not allow listing of this product due to inappropriate content.`;
              } else {
                this.errorMessage = 'Failed to create listing. Please try again.';
              }
              this.isSubmitting = false;
            }
          });
        }
      };

      // STEP 1: Upload images first (if any NEW files selected)
      // STEP 2: Create/Update product with the uploaded image URLs
      
      const newFiles = this.previews.filter(p => p.file != null);
      const existingUrls = this.previews.filter(p => p.file == null).map(p => p.url);
      
      if (newFiles.length > 0) {
        // User uploaded new file(s)
        if (newFiles.length === 1) {
          // Single file upload
          this.uploadService.uploadSingle(newFiles[0].file).subscribe({
            next: (event: HttpEvent<any>) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                newFiles[0].progress = Math.round((event.loaded / event.total) * 100);
              } else if (event.type === HttpEventType.Response) {
                const url = event.body?.imageUrl as string;
                // Combine existing + new URLs
                finalizeCreateOrUpdate([...existingUrls, url]);
              }
            },
            error: (err) => {
              console.error('Upload failed', err);
              const status = err?.status ? ` (${err.status}${err.statusText ? ' ' + err.statusText : ''})` : '';
              const body = err?.error;
              const detail = typeof body === 'string' ? body : (body?.message || body?.error || err?.message || '');
              this.errorMessage = `Image upload failed${status}. ${detail || 'Please try again.'}`;
              this.isSubmitting = false;
            }
          });
        } else {
          // Multiple files upload
          const files = newFiles.map((p) => p.file);
          this.uploadService.uploadMultiple(files).subscribe({
            next: (event: HttpEvent<any>) => {
              if (event.type === HttpEventType.UploadProgress) {
                // Optionally compute aggregate progress
              } else if (event.type === HttpEventType.Response) {
                const urls: string[] = event.body?.imageUrls || [];
                // Combine existing + new URLs
                finalizeCreateOrUpdate([...existingUrls, ...urls]);
              }
            },
            error: (err) => {
              console.error('Multi-upload failed', err);
              const status = err?.status ? ` (${err.status}${err.statusText ? ' ' + err.statusText : ''})` : '';
              const body = err?.error;
              const detail = typeof body === 'string' ? body : (body?.message || body?.error || err?.message || '');
              this.errorMessage = `Image upload failed${status}. ${detail || 'Please try again.'}`;
              this.isSubmitting = false;
            }
          });
        }
      } else {
        // Scenario 3: No new file upload - use existing URLs or form URL
        this.stepSubmitted[3] = true;
        const urlField = this.addListingForm.value.productImageUrl?.trim();
        const finalUrls = existingUrls.length > 0 ? existingUrls : (urlField ? [urlField] : []);
        finalizeCreateOrUpdate(finalUrls);
      }
    } else {
      // Trigger validation visibility on current step only
      this.stepSubmitted[this.currentStep] = true;
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.addListingForm.controls).forEach(key => {
      const control = this.addListingForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.addListingForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Step-aware invalid check: show errors when control is touched or the step has been submitted
  isFieldInvalidAtStep(fieldName: string, step: 1 | 2 | 3): boolean {
    const field = this.addListingForm.get(fieldName);
    if (!field) return false;
    const submitted = this.stepSubmitted[step];
    return field.invalid && (field.touched || submitted);
  }

  getFieldError(fieldName: string): string {
    const field = this.addListingForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${this.getFieldDisplayName(fieldName)} must not exceed ${field.errors['max'].max}`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid image URL starting with http:// or https://';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      productName: 'Product Name',
      productDescription: 'Product Description',
      price: 'Price',
      category: 'Category',
      condition: 'Condition',
      productImageUrl: 'Image URL'
    };
    return displayNames[fieldName] || fieldName;
  }

  onCancel() {
    this.router.navigate(['/my-listings']);
  }

  resetForm() {
    this.addListingForm.reset();
    this.previewImageUrl = '';
    this.imageLoadError = false;
    this.imageLoading = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ProductFilters {
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name';
  status?: string; // for My Listings
}

@Component({
  selector: 'app-sidebar-filters',
  templateUrl: './sidebar-filters.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./sidebar-filters.component.scss']
})
export class SidebarFiltersComponent {
  @Input() categories: string[] = [];
  @Input() conditions: string[] = [];
  @Input() showStatus: boolean = false;
  @Input() title: string = 'Filters';

  @Output() filtersChange = new EventEmitter<ProductFilters>();

  // Local state
  search = '';
  category = '';
  condition = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: ProductFilters['sortBy'] = 'newest';
  status = '';

  emit() {
    this.filtersChange.emit({
      search: this.search.trim(),
      category: this.category,
      condition: this.condition,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      sortBy: this.sortBy,
      status: this.showStatus ? this.status : undefined
    });
  }

  clear() {
    this.search = '';
    this.category = '';
    this.condition = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'newest';
    this.status = '';
    this.emit();
  }
}

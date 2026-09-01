import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.api.getProducts().pipe(
      catchError((err) => {
        console.error('Failed to load products:', err);
        this.error = 'Unable to load product catalog. Ensure backend service is running.';
        return of(null);
      })
    ).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.products = res.data;
          this.applyFilter();
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredProducts = this.products.filter(p => 
      (p.product_id || '').toLowerCase().includes(term) ||
      (p.product_name || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  }

  formatCurrency(value: any): string {
    const num = Number(value) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

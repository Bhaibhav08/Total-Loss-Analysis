import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api } from '../../core/services/api';
import { PeriodService } from '../../core/services/period.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  inventoryItems: any[] = [];
  filteredItems: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string | null = null;

  selectedPeriod: string = 'August 2026';
  hasDataForPeriod: boolean = true;

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef,
    public periodService: PeriodService
  ) {}

  ngOnInit(): void {
    this.periodService.selectedPeriod$.subscribe(period => {
      this.selectedPeriod = period;
      this.hasDataForPeriod = (period === 'August 2026' || period === 'YTD 2026');
      if (this.hasDataForPeriod) {
        this.loadInventory();
      }
    });
  }

  loadInventory(): void {
    this.loading = true;
    this.error = null;

    this.api.getInventory().pipe(
      catchError((err) => {
        console.error('Failed to load inventory:', err);
        this.error = 'Unable to load inventory records. Ensure backend service is running.';
        return of(null);
      })
    ).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.inventoryItems = res.data;
          this.applyFilter();
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectActivePeriod(): void {
    this.periodService.setPeriod('August 2026');
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.inventoryItems];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredItems = this.inventoryItems.filter(item => 
      (item.store_id || '').toLowerCase().includes(term) ||
      (item.product_id || '').toLowerCase().includes(term) ||
      (item.product_name || '').toLowerCase().includes(term)
    );
  }

  formatCurrency(value: any): string {
    const num = Number(value) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

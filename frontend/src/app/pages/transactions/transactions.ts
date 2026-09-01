import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api } from '../../core/services/api';
import { PeriodService } from '../../core/services/period.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css'
})
export class Transactions implements OnInit {
  transactions: any[] = [];
  filteredTransactions: any[] = [];
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
        this.loadTransactions();
      }
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    this.api.getTransactions().pipe(
      catchError((err) => {
        console.error('Failed to load transactions:', err);
        this.error = 'Unable to load transaction records. Ensure backend service is running.';
        return of(null);
      })
    ).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.transactions = res.data;
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
      this.filteredTransactions = [...this.transactions];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredTransactions = this.transactions.filter(t => 
      (t.transaction_id || '').toLowerCase().includes(term) ||
      (t.store_id || '').toLowerCase().includes(term) ||
      (t.product_id || '').toLowerCase().includes(term) ||
      (t.transaction_type || '').toLowerCase().includes(term) ||
      (t.employee_id || '').toLowerCase().includes(term)
    );
  }

  formatCurrency(value: any): string {
    const num = Number(value) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

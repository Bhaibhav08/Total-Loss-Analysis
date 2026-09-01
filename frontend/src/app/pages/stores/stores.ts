import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api, InvestigationData } from '../../core/services/api';
import { PeriodService } from '../../core/services/period.service';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stores.html',
  styleUrl: './stores.css'
})
export class Stores implements OnInit {
  stores: InvestigationData[] = [];
  filteredStores: InvestigationData[] = [];
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
        this.loadStores();
      }
    });
  }

  loadStores(): void {
    this.loading = true;
    this.error = null;

    this.api.getInvestigations().pipe(
      catchError((err) => {
        console.error('Failed to load stores:', err);
        this.error = 'Unable to load retail store loss intelligence. Please verify backend service is running.';
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.stores = response.data;
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
      this.filteredStores = [...this.stores];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredStores = this.stores.filter(store => 
      store.store_id.toLowerCase().includes(term) ||
      store.store_name.toLowerCase().includes(term) ||
      store.region.toLowerCase().includes(term) ||
      store.risk_level.toLowerCase().includes(term)
    );
  }

  formatCurrency(value: number): string {
    if (!value) return '₹0';
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api, InvestigationData } from '../../core/services/api';
import { PeriodService } from '../../core/services/period.service';

@Component({
  selector: 'app-investigations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './investigations.html',
  styleUrl: './investigations.css'
})
export class Investigations implements OnInit {
  investigations: InvestigationData[] = [];
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
        this.loadInvestigations();
      }
    });
  }

  loadInvestigations(): void {
    this.loading = true;
    this.error = null;

    this.api.getInvestigations().pipe(
      catchError((err) => {
        console.error('Failed to load investigations:', err);
        this.error = 'Unable to load investigation queue. Please verify backend service is running.';
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.investigations = response.data;
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectActivePeriod(): void {
    this.periodService.setPeriod('August 2026');
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

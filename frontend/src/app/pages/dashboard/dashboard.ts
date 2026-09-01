import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api, InvestigationData } from '../../core/services/api';
import { PeriodService } from '../../core/services/period.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  returnRate: number = 17.13;
  refundRate: number = 13.93;
  shrinkage: number = 42788;
  storesAnalyzed: number = 12;

  totalLoss: number = 1639632;
  returnsLoss: number = 799000;
  shrinkageLoss: number = 513456;
  refundsLoss: number = 327176;

  returnsPercentage: number = 49;
  shrinkagePercentage: number = 31;
  refundsPercentage: number = 20;

  investigations: InvestigationData[] = [];
  loading: boolean = true;
  error: string | null = null;

  selectedPeriod: string = 'August 2026';
  hasDataForPeriod: boolean = true;

  constructor(
    private api: Api,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public periodService: PeriodService
  ) {}

  ngOnInit(): void {
    this.periodService.selectedPeriod$.subscribe(period => {
      this.selectedPeriod = period;
      this.hasDataForPeriod = (period === 'August 2026' || period === 'YTD 2026');
      if (this.hasDataForPeriod) {
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      baseline: this.api.getBaseline().pipe(catchError(err => {
        console.error('Baseline API error:', err);
        return of(null);
      })),
      dashboard: this.api.getDashboard().pipe(catchError(err => {
        console.error('Dashboard API error:', err);
        return of(null);
      })),
      investigations: this.api.getInvestigations().pipe(catchError(err => {
        console.error('Investigations API error:', err);
        return of(null);
      }))
    }).subscribe({
      next: (results) => {
        if (results.baseline?.data) {
          this.returnRate = results.baseline.data.average_return_rate;
          this.refundRate = results.baseline.data.average_refund_rate;
          this.shrinkage = results.baseline.data.average_shrinkage;
          this.storesAnalyzed = results.baseline.data.stores_analyzed;
        }

        if (results.dashboard?.data) {
          this.totalLoss = results.dashboard.data.total_loss || this.totalLoss;
          this.returnsLoss = results.dashboard.data.loss_breakdown?.returns || this.returnsLoss;
          this.shrinkageLoss = results.dashboard.data.loss_breakdown?.shrinkage || this.shrinkageLoss;
          this.refundsLoss = results.dashboard.data.loss_breakdown?.refunds || this.refundsLoss;

          const total = this.totalLoss || 1;
          this.returnsPercentage = Math.round((this.returnsLoss / total) * 100);
          this.shrinkagePercentage = Math.round((this.shrinkageLoss / total) * 100);
          this.refundsPercentage = Math.round((this.refundsLoss / total) * 100);
        }

        if (results.investigations?.data) {
          this.investigations = results.investigations.data;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectActivePeriod(): void {
    this.periodService.setPeriod('August 2026');
  }

  navigateToStore(storeId: string): void {
    this.router.navigate(['/investigations', storeId]);
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
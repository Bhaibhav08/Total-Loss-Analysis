import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api, InvestigationData, BaselineData } from '../../../core/services/api';

@Component({
  selector: 'app-store-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './store-details.html',
  styleUrl: './store-details.css'
})
export class StoreDetails implements OnInit {
  storeId: string = '';
  investigation: InvestigationData | null = null;
  baseline: BaselineData | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.storeId = params['storeId'] || '';
      if (this.storeId) {
        this.loadStoreData();
      }
    });
  }

  loadStoreData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      baseline: this.api.getBaseline().pipe(catchError(() => of(null))),
      investigation: this.api.getInvestigationByStore(this.storeId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (res) => {
        this.baseline = res.baseline?.data || null;
        this.investigation = res.investigation?.data || null;

        if (!this.investigation) {
          this.error = `No active investigation found for Store ${this.storeId}.`;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = `Unable to load details for Store ${this.storeId}.`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  runAIAnalysis(): void {
    // Trigger CSV download of the store's data for AAVA
    const exportUrl = `${this.api.baseUrl}/data/export/${this.storeId}`;
    window.open(exportUrl, '_blank');

    // Navigate to the AI Analysis page
    this.router.navigate(['/ai-analysis', this.storeId]);
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

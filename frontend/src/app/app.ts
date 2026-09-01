import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Sidebar } from './layout/sidebar/sidebar';
import { AuthService, UserProfile } from './core/services/auth.service';
import { PeriodService } from './core/services/period.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  breadcrumbMain: string = 'Retail Intelligence';
  breadcrumbSub: string = 'Overview';

  showPeriodDropdown: boolean = false;
  selectedPeriod: string = 'August 2026';
  periods: string[] = ['August 2026', 'July 2026', 'June 2026', 'Q2 2026', 'YTD 2026'];
  toastMessage: string | null = null;

  currentUser: UserProfile | null = null;
  isAuthenticated: boolean = true;
  isLoginPage: boolean = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    public periodService: PeriodService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (!isAuth && !this.isLoginPage) {
        this.router.navigate(['/login']);
      }
    });

    this.periodService.selectedPeriod$.subscribe(period => {
      this.selectedPeriod = period;
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
      this.closeAllPopovers();
    });

    this.updateBreadcrumbs(this.router.url);
  }

  updateBreadcrumbs(url: string): void {
    this.isLoginPage = url.includes('/login');

    if (url.includes('/dashboard')) {
      this.breadcrumbSub = 'Overview';
    } else if (url.includes('/stores')) {
      this.breadcrumbSub = 'Store Risk Directory';
    } else if (url.includes('/investigations/')) {
      const parts = url.split('/');
      const storeId = parts[parts.length - 1];
      this.breadcrumbSub = `Store Investigation (${storeId})`;
    } else if (url.includes('/investigations')) {
      this.breadcrumbSub = 'Active Investigations';
    } else if (url.includes('/ai-analysis')) {
      this.breadcrumbSub = 'AAVA AI Analysis';
    } else if (url.includes('/transactions')) {
      this.breadcrumbSub = 'Transaction Records';
    } else if (url.includes('/inventory')) {
      this.breadcrumbSub = 'Inventory Discrepancy Audit';
    } else if (url.includes('/products')) {
      this.breadcrumbSub = 'Product Catalog';
    } else if (url.includes('/login')) {
      this.breadcrumbSub = 'Portal Sign-In';
    }
  }

  togglePeriodDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showPeriodDropdown = !this.showPeriodDropdown;
  }

  closeAllPopovers(): void {
    this.showPeriodDropdown = false;
  }

  selectPeriod(period: string): void {
    this.periodService.setPeriod(period);
    this.closeAllPopovers();
    this.showToast(`Reporting period set to ${period}`);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  logout(): void {
    this.closeAllPopovers();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
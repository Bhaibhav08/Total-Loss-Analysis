import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {
  private selectedPeriodSubject = new BehaviorSubject<string>('August 2026');
  public selectedPeriod$: Observable<string> = this.selectedPeriodSubject.asObservable();

  public get currentPeriod(): string {
    return this.selectedPeriodSubject.value;
  }

  setPeriod(period: string): void {
    this.selectedPeriodSubject.next(period);
  }
}

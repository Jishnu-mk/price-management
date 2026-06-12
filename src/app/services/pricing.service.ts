import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { PricingData, RuiData } from '../models/pricing.models';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly _rawData = signal<PricingData | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly ruiData = computed<RuiData | null>(() => {
    const raw = this._rawData();
    return raw?.data?.embroidered_specials?.rui ?? null;
  });

  constructor(private http: HttpClient) {
    this.loadPricing();
  }

  loadPricing(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this.http.get<PricingData>('data/pricing.json').subscribe({
      next: (data) => {
        this._rawData.set(data);
        this._isLoading.set(false);
      },
      error: (err) => {
        this._error.set('Failed to load pricing data: ' + err.message);
        this._isLoading.set(false);
      }
    });
  }
}

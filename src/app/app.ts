import { Component, signal, VERSION } from '@angular/core';
import { PricingService } from './services/pricing.service';
import { FrPricingTableComponent } from './components/pricing-table/fr-pricing-table.component';
import { FlatPricingTableComponent } from './components/flat-pricing/flat-pricing-table.component';
import { AdditionalChargesComponent } from './components/additional-charges/additional-charges.component';
import { FrPricing, FlatPricing, AdditionalCharges } from './models/pricing.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FrPricingTableComponent, FlatPricingTableComponent, AdditionalChargesComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly angularVersion = VERSION.major + '.' + VERSION.minor;

  // Track which accordion panels are open (open by default: first flat panel)
  openPanels = signal<Set<string>>(new Set(['default']));

  private state = signal<Record<string, unknown>>({});

  constructor(public pricingService: PricingService) {}

  isOpen(id: string): boolean {
    return this.openPanels().has(id);
  }

  toggle(id: string): void {
    this.openPanels.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  onFrChanged(data: FrPricing): void {
    this.state.update(s => ({ ...s, fr: data }));
  }

  onFlatChanged(key: string, data: FlatPricing): void {
    this.state.update(s => ({ ...s, [key]: data }));
  }

  onChargesChanged(key: string, data: AdditionalCharges): void {
    this.state.update(s => ({ ...s, [`charges_${key}`]: data }));
  }
}

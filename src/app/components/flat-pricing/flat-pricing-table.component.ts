import {
  Component, input, output, signal, computed, OnInit
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { FlatPricing } from '../../models/pricing.models';

interface FlatFormModel {
  tiers: { value: string }[];
  prices: { value: string }[];
}

@Component({
  selector: 'app-flat-pricing-table',
  standalone: true,
  imports: [FormField],
  templateUrl: './flat-pricing-table.component.html',
  styleUrl: './flat-pricing-table.component.scss'
})
export class FlatPricingTableComponent implements OnInit {
  flatData = input.required<FlatPricing>();
  name     = input.required<string>();
  dataChanged = output<FlatPricing>();

  private discountOverride = signal<number | null>(null);
  currentDiscount = computed(() => this.discountOverride() ?? this.flatData().discount);

  flatModel = signal<FlatFormModel>({ tiers: [], prices: [] });
  flatForm  = form(this.flatModel);

  ngOnInit(): void {
    this.resetFromData();
  }

  private resetFromData(): void {
    this.discountOverride.set(null);
    this.flatModel.set({
      tiers:  this.flatData().item_tier.map(t => ({ value: String(t) })),
      prices: this.flatData().price.map(p => ({ value: String(p) }))
    });
  }

  onDiscountChange(val: string): void {
    const n = parseFloat(val);
    if (!isNaN(n)) this.discountOverride.set(n);
  }

  addColumn(): void {
    const tiers = this.flatModel().tiers;
    const last  = tiers[tiers.length - 1];
    const lastNum = last ? Number(last.value) : 0;
    const newTier = isNaN(lastNum) ? 0 : lastNum + 500;
    this.flatModel.update(m => ({
      tiers:  [...m.tiers,  { value: String(newTier) }],
      prices: [...m.prices, { value: '0' }]
    }));
  }

  removeColumn(index: number): void {
    this.flatModel.update(m => ({
      tiers:  m.tiers.filter((_, i) => i !== index),
      prices: m.prices.filter((_, i) => i !== index)
    }));
  }

  saveChanges(): void {
    const m = this.flatModel();
    const updated: FlatPricing = {
      discount:  this.currentDiscount(),
      item_tier: m.tiers.map(t => { const n = Number(t.value); return isNaN(n) ? (t.value as unknown as number) : n; }),
      price:     m.prices.map(p => { const n = Number(p.value); return isNaN(n) ? p.value : n; })
    };
    console.log(`[${this.name().toUpperCase()}] Updated:`, JSON.stringify(updated, null, 2));
    this.dataChanged.emit(updated);
  }

  reset(): void {
    this.resetFromData();
  }

  indices(len: number): number[] {
    return Array.from({ length: len }, (_, i) => i);
  }
}

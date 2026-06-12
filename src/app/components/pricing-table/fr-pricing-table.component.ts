import {
  Component, input, output, signal, computed, OnInit
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { FrPricing } from '../../models/pricing.models';

interface FrRowModel {
  size: number;
  prices: { value: string }[];
}

interface FrFormModel {
  itemTiers: { value: string }[];
  rows: FrRowModel[];
}

@Component({
  selector: 'app-fr-pricing-table',
  standalone: true,
  imports: [FormField],
  templateUrl: './fr-pricing-table.component.html',
  styleUrl: './fr-pricing-table.component.scss'
})
export class FrPricingTableComponent implements OnInit {
  frData = input.required<FrPricing>();
  dataChanged = output<FrPricing>();

  frModel = signal<FrFormModel>({ itemTiers: [], rows: [] });
  frForm  = form(this.frModel);

  ngOnInit(): void {
    this.initFromData();
  }

  private initFromData(): void {
    const data = this.frData();
    this.frModel.set({
      itemTiers: data.item_tier.map(t => ({ value: String(t) })),
      rows: data.size_tier.map(st => ({
        size: st.size,
        prices: st.price.map(p => ({ value: String(p) }))
      }))
    });
  }

  addColumn(): void {
    const tiers = this.frModel().itemTiers;
    const last  = tiers[tiers.length - 1];
    const lastNum = last ? Number(last.value) : 0;
    const newTier = isNaN(lastNum) ? 0 : lastNum + 100;
    this.frModel.update(m => ({
      itemTiers: [...m.itemTiers, { value: String(newTier) }],
      rows: m.rows.map(r => ({ ...r, prices: [...r.prices, { value: '0' }] }))
    }));
  }

  removeColumn(colIndex: number): void {
    this.frModel.update(m => ({
      itemTiers: m.itemTiers.filter((_, i) => i !== colIndex),
      rows: m.rows.map(r => ({
        ...r,
        prices: r.prices.filter((_, i) => i !== colIndex)
      }))
    }));
  }

  saveChanges(): void {
    const m = this.frModel();
    const updated: FrPricing = {
      ...this.frData(),
      item_tier: m.itemTiers.map(t => {
        const n = Number(t.value); return isNaN(n) ? (t.value as unknown as number) : n;
      }),
      size_tier: m.rows.map(r => ({
        size: r.size,
        price: r.prices.map(p => { const n = Number(p.value); return isNaN(n) ? p.value : n; })
      }))
    };
    console.log('[FR Pricing] Updated Data:', JSON.stringify(updated, null, 2));
    this.dataChanged.emit(updated);
  }

  resetToOriginal(): void {
    this.initFromData();
  }

  indices(len: number): number[] {
    return Array.from({ length: len }, (_, i) => i);
  }
}

import { Component, input, output, signal, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdditionalCharges } from '../../models/pricing.models';

interface ScalarField {
  kind: 'scalar';
  key: string;
  value: string;
}

interface PairedField {
  kind: 'paired';
  labelA: string;
  labelB: string;
  rows: { valueA: string; valueB: string }[];
}

type FieldDef = ScalarField | PairedField;

interface ChargeEntry {
  key: string;
  label: string;
  fields: FieldDef[];
}

function toLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseVal(s: string): number | string {
  const n = Number(s);
  return s.trim() !== '' && !isNaN(n) ? n : s;
}

@Component({
  selector: 'app-additional-charges',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './additional-charges.component.html',
  styleUrl: './additional-charges.component.scss'
})
export class AdditionalChargesComponent implements OnInit {
  charges     = input.required<AdditionalCharges>();
  title       = input('');
  dataChanged = output<AdditionalCharges>();

  entries = signal<ChargeEntry[]>([]);

  ngOnInit(): void {
    this.build();
  }

  private build(): void {
    const result: ChargeEntry[] = [];

    for (const [key, raw] of Object.entries(this.charges())) {
      const fields = this.buildFields(raw);
      result.push({ key, label: toLabel(key), fields });
    }
    this.entries.set(result);
  }

  private buildFields(raw: unknown): FieldDef[] {
    if (raw === null || raw === undefined) return [];
    if (typeof raw !== 'object' || Array.isArray(raw)) return [];

    const obj = raw as Record<string, unknown>;
    const keys = Object.keys(obj);

    const arrayKeys = keys.filter(k => Array.isArray(obj[k]));
    const scalarKeys = keys.filter(k => !Array.isArray(obj[k]));

    const fields: FieldDef[] = [];

    for (const k of scalarKeys) {
      fields.push({ kind: 'scalar', key: k, value: String(obj[k] ?? '') });
    }

    if (arrayKeys.length === 2) {
      const tierKey = arrayKeys.find(k => k === 'size_tier') ?? arrayKeys[0];
      const valKey  = arrayKeys.find(k => k !== tierKey)    ?? arrayKeys[1];
      const tierArr = obj[tierKey] as unknown[];
      const valArr  = obj[valKey]  as unknown[];
      const rows = tierArr.map((t, i) => ({
        valueA: String(t ?? ''),
        valueB: String(valArr[i] ?? '')
      }));
      fields.push({ kind: 'paired', labelA: tierKey, labelB: valKey, rows });
    } else if (arrayKeys.length === 1) {
      const k = arrayKeys[0];
      const arr = obj[k] as unknown[];
      const rows = arr.map(v => ({ valueA: '', valueB: String(v ?? '') }));
      fields.push({ kind: 'paired', labelA: '', labelB: k, rows });
    }

    return fields;
  }

  emitAll(): void {
    const out: AdditionalCharges = {};
    for (const entry of this.entries()) {
      out[entry.key] = this.reconstruct(entry, this.charges()[entry.key]);
    }
    this.dataChanged.emit(out);
  }

  private reconstruct(entry: ChargeEntry, original: unknown): unknown {
    if (typeof original !== 'object' || original === null || Array.isArray(original)) return original;
    const obj = original as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const f of entry.fields) {
      if (f.kind === 'scalar') {
        result[f.key] = parseVal(f.value);
      } else {
        if (f.labelA) result[f.labelA] = f.rows.map(r => parseVal(r.valueA));
        result[f.labelB] = f.rows.map(r => parseVal(r.valueB));
      }
    }

    for (const k of Object.keys(obj)) {
      if (!(k in result)) result[k] = obj[k];
    }
    return result;
  }

  asScalar(f: FieldDef): ScalarField { return f as ScalarField; }
  asPaired(f: FieldDef): PairedField { return f as PairedField; }
}

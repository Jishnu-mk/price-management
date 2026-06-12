import {
  Component, input, output, linkedSignal
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormField, form, required, applyEach, SchemaPathTree } from '@angular/forms/signals';
import { AdditionalCharges } from '../../models/pricing.models';

interface ChargeField {
  key:      string;
  label:    string;
  value:    string;   
  labelA:   string;  
  labelB:   string;   
  valueA:   string;   
  valueB:   string;   
  isPaired: string;   
}

interface ChargeEntry {
  key:   string;
  label: string;
  field: ChargeField;
}

interface ChargeModel {
  entries: ChargeEntry[];
}

function entrySchema(path: SchemaPathTree<ChargeEntry>): void {
  required(path.field.value, {
    message:  'Value is required',
    when: ({ valueOf }) => valueOf(path.field.isPaired) === 'false'
  });
}

function toLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseVal(s: string): number | string {
  const n = Number(s);
  return s.trim() !== '' && !isNaN(n) ? n : s;
}

function buildEntry(key: string, raw: unknown): ChargeEntry {
  const label = toLabel(key);
  const empty: ChargeEntry = {
    key, label,
    field: {
      key, label, value: '',
      labelA: '', labelB: '',
      valueA: '', valueB: '',
      isPaired: 'false'
    }
  };

  if (raw === null || raw === undefined ||
      typeof raw !== 'object' || Array.isArray(raw)) {
    return empty;
  }

  const obj       = raw as Record<string, unknown>;
  const keys      = Object.keys(obj);
  const arrayKeys = keys.filter(k =>  Array.isArray(obj[k]));
  const scalarKeys= keys.filter(k => !Array.isArray(obj[k]));

  if (scalarKeys.length > 0 && arrayKeys.length === 0) {
    const k = scalarKeys[0];
    return {
      key, label,
      field: {
        key: k, label: toLabel(k),
        value:    String(obj[k] ?? ''),
        labelA:   '', labelB: '',
        valueA:   '', valueB: '',
        isPaired: 'false'
      }
    };
  }

  const tierKey = arrayKeys.find(k => k === 'size_tier') ?? arrayKeys[0] ?? '';
  const valKey  = arrayKeys.find(k => k !== tierKey)    ?? arrayKeys[1] ?? '';
  const tierArr = (obj[tierKey] ?? []) as unknown[];
  const valArr  = (obj[valKey]  ?? []) as unknown[];

  return {
    key, label,
    field: {
      key:    '',
      label:  toLabel(valKey),
      value:  '',
      labelA: tierKey,
      labelB: valKey,
      valueA: String(tierArr[0] ?? ''),
      valueB: String(valArr[0]  ?? ''),
      isPaired: 'true'
    }
  };
}

function buildModel(charges: AdditionalCharges): ChargeModel {
  return {
    entries: Object.entries(charges).map(([key, raw]) => buildEntry(key, raw))
  };
}


@Component({
  selector: 'app-additional-charges',
  standalone: true,
  imports: [FormField, TitleCasePipe],
  templateUrl: './additional-charges.component.html',
  styleUrl:    './additional-charges.component.scss'
})
export class AdditionalChargesComponent {
  charges     = input.required<AdditionalCharges>();
  title       = input('');
  dataChanged = output<AdditionalCharges>();

  
  protected readonly chargeModel = linkedSignal<ChargeModel>(
    () => buildModel(this.charges())
  );

  
  protected readonly chargeForm = form(this.chargeModel, (f) => {
    applyEach(f.entries, entrySchema);
  });

  
  protected emitAll(): void {
    if (this.chargeForm().invalid()) return;

    const out: AdditionalCharges = {};
    const original = this.charges();

    for (const entry of this.chargeModel().entries) {
      out[entry.key] = this.reconstruct(entry, original[entry.key]);
    }
    this.dataChanged.emit(out);
  }

  private reconstruct(entry: ChargeEntry, original: unknown): unknown {
    if (
      typeof original !== 'object' ||
      original === null ||
      Array.isArray(original)
    ) {
      return original;
    }

    const obj    = original as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const f = entry.field;

    if (f.isPaired === 'false') {
      result[f.key] = parseVal(f.value);
    } else {
      if (f.labelA) result[f.labelA] = [parseVal(f.valueA)];
      if (f.labelB) result[f.labelB] = [parseVal(f.valueB)];
    }

    // preserve keys not covered by this field
    for (const k of Object.keys(obj)) {
      if (!(k in result)) result[k] = obj[k];
    }

    return result;
  }
}
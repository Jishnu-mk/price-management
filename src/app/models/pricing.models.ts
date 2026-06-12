export interface SizeTier {
  size: number;
  price: (number | string)[];
}

export interface AdditionalChargeSize {
  size_tier: number[];
  percentage: (number | string)[];
}

export interface AdditionalChargeVelcro {
  price: number[];
  size_tier: number[];
}

export interface AdditionalChargePressureSensitive {
  price: number[];
  size_tier: number[];
}

export interface AdditionalChargeStitch {
  over: number;
  every: number;
  price: number;
}

export interface AdditionalChargeColorOvercharge {
  over: number;
  price: number;
}

export interface AdditionalCharges {
  size?: AdditionalChargeSize;
  blunt_corners?: { price: number };
  square_corners?: { price: number };
  irregular_shape?: { percentage: number };
  metallic_merrow?: { price: number };
  metallic_thread?: { price: number };
  velcro_one_side?: AdditionalChargeVelcro;
  velcro_two_side?: AdditionalChargeVelcro;
  stitch_overcharge?: AdditionalChargeStitch;
  pressure_sensitive?: AdditionalChargePressureSensitive;
  sharp_round_corners?: { price: number };
  metallic_merrow_thread?: { price: number };
  no_of_color_overcharge?: AdditionalChargeColorOvercharge;
  [key: string]: unknown;
}

export interface FrPricing {
  discount: number;
  item_tier: number[];
  size_tier: SizeTier[];
  additional_charge: AdditionalCharges;
}

export interface FlatPricing {
  price: (number | string)[];
  discount: number;
  item_tier: number[];
}

export interface RuiData {
  fr: FrPricing;
  fancy: FlatPricing;
  hi_vis: FlatPricing;
  default: FlatPricing;
  inserts: FlatPricing;
  reflective: FlatPricing;
  fancy_inserts: FlatPricing;
  additional_charge: AdditionalCharges;
  [key: string]: unknown;
}

export interface PricingData {
  data: {
    embroidered_specials: {
      rui: RuiData;
    };
  };
}

// ---- UI Models ----

export type PricingType = 'fr' | 'flat' | 'additional_charge';

export interface FlatPricingRow {
  index: number;
  tier: number | string;
  price: number | string;
}

export interface SizePricingRow {
  size: number;
  prices: (number | string)[];
}

export interface AdditionalChargeRow {
  key: string;
  type: 'fixed' | 'percentage' | 'tiered' | 'stitch' | 'color';
  label: string;
  value: number | string | (number | string)[] | null;
  meta?: Record<string, unknown>;
}

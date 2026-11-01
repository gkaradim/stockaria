import type { ParcelSize } from "../types";

// DEMO values for the prototype only. Not real carrier prices or a real commission.
export const DEFAULT_COMMISSION = 0.12;
export const SHIPPING_CENTS: Record<ParcelSize, number> = { S: 290, M: 350, L: 450 };

export const CATEGORIES = ["Γυναικεία ρούχα", "Ανδρικά ρούχα", "Παιδικά ρούχα", "Παπούτσια", "Αξεσουάρ"] as const;
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export const PARCEL_BY_CATEGORY: Record<string, ParcelSize> = {
  "Γυναικεία ρούχα": "S",
  "Ανδρικά ρούχα": "S",
  "Παιδικά ρούχα": "S",
  "Παπούτσια": "M",
  "Αξεσουάρ": "S",
};

export const LOW_STOCK_THRESHOLD = 2;

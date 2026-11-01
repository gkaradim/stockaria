import type { ParcelSize } from "../types";
import { PARCEL_BY_CATEGORY } from "./constants";

export const formatEUR = (cents: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(cents / 100);

export const calcCommission = (itemsCents: number, rate: number) => Math.round(itemsCents * rate);

const ORDER: ParcelSize[] = ["S", "M", "L"];

export function parcelFor(categories: string[]): ParcelSize {
  return categories.reduce<ParcelSize>((max, c) => {
    const p = PARCEL_BY_CATEGORY[c] ?? "S";
    return ORDER.indexOf(p) > ORDER.indexOf(max) ? p : max;
  }, "S");
}

export function discountPercent(priceCents: number, originalCents?: number) {
  if (!originalCents || originalCents <= priceCents) return 0;
  return Math.round((1 - priceCents / originalCents) * 100);
}

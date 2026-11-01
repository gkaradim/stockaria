import { describe, it, expect } from "vitest";
import { calcCommission, parcelFor, discountPercent } from "./money";

describe("money", () => {
  it("commission is rate x items total, rounded to cents", () => {
    expect(calcCommission(2500, 0.12)).toBe(300);
    expect(calcCommission(1999, 0.12)).toBe(240); // 239.88 -> 240
  });
  it("parcel size is the largest among items' categories", () => {
    expect(parcelFor(["Γυναικεία ρούχα"])).toBe("S");
    expect(parcelFor(["Γυναικεία ρούχα", "Παπούτσια"])).toBe("M");
  });
  it("discount percent from original price, 0 when none", () => {
    expect(discountPercent(7000, 10000)).toBe(30);
    expect(discountPercent(7000, undefined)).toBe(0);
    expect(discountPercent(9000, 8000)).toBe(0);
  });
});

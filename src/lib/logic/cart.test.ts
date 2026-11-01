import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { addToCart, setQty, removeFromCart, cartTotal } from "./cart";

describe("cart per store", () => {
  it("keeps separate carts per store and caps qty at stock", () => {
    let db = addToCart(testDb(), "p1", "M", 1);
    db = addToCart(db, "p1", "M", 5);
    expect(db.carts.s1).toEqual([{ productId: "p1", size: "M", qty: 2 }]);
    db = setQty(db, "s1", "p1", "M", 0);
    expect(db.carts.s1 ?? []).toHaveLength(0);
  });
  it("totals items in a store cart", () => {
    const db = addToCart(testDb(), "p1", "M", 2);
    expect(cartTotal(db, "s1")).toBe(4000);
  });
  it("removeFromCart drops the line", () => {
    let db = addToCart(testDb(), "p1", "M", 1);
    db = removeFromCart(db, "s1", "p1", "M");
    expect(db.carts.s1 ?? []).toHaveLength(0);
  });
  it("ignores sizes that are not in stock", () => {
    const db = addToCart(testDb(), "p1", "XL", 1);
    expect(db.carts.s1 ?? []).toHaveLength(0);
  });
});

import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, cancelOrder, markShipped, markDelivered, returnOrder } from "./orders";
import { storeBalance } from "./ledger";

const buyer = { name: "Α", email: "a@b.gr", phone: "69" };
const delivery = { type: "locker" as const, text: "Box Now Σύνταγμα" };
const now = "2026-02-01T10:00:00Z";
const place = (qty = 1) =>
  placeOrder(testDb(), { storeId: "s1", lines: [{ productId: "p1", size: "M", qty }], buyer, delivery }, now);

describe("placeOrder", () => {
  it("creates order, decrements stock, books sale and commission", () => {
    const db = place(1);
    const o = db.orders[0];
    expect(o.itemsCents).toBe(2000);
    expect(o.shippingCents).toBe(290);
    expect(o.commissionCents).toBe(200);
    expect(o.status).toBe("new");
    expect(db.products[0].stock[0].quantity).toBe(1);
    expect(storeBalance(db, "s1")).toBe(2000 + 290 - 200);
  });
  it("rejects more than available stock", () => {
    expect(() => place(3)).toThrow();
  });
  it("rejects stores that are not approved", () => {
    const db = testDb();
    db.stores[0].status = "pending";
    expect(() =>
      placeOrder(db, { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery }, now),
    ).toThrow();
  });
  it("clears that store's cart", () => {
    const db = testDb();
    db.carts.s1 = [{ productId: "p1", size: "M", qty: 1 }];
    const out = placeOrder(db, { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery }, now);
    expect(out.carts.s1 ?? []).toHaveLength(0);
  });
});

describe("cancel / return", () => {
  it("cancel restocks and nets ledger to zero", () => {
    const placed = place(1);
    const db = cancelOrder(placed, placed.orders[0].id, "Δεν υπάρχει", now);
    expect(db.orders[0].status).toBe("cancelled");
    expect(db.products[0].stock[0].quantity).toBe(2);
    expect(storeBalance(db, "s1")).toBe(0);
  });
  it("cannot cancel after shipped", () => {
    let db = place(1);
    const id = db.orders[0].id;
    db = markShipped(db, id, "BX123");
    expect(() => cancelOrder(db, id, "x", now)).toThrow();
  });
  it("shipping needs a tracking code", () => {
    const db = place(1);
    expect(() => markShipped(db, db.orders[0].id, "  ")).toThrow();
  });
  it("return after delivery restocks and reverses ledger", () => {
    let db = place(1);
    const id = db.orders[0].id;
    db = markDelivered(markShipped(db, id, "BX1"), id, now);
    expect(db.orders[0].deliveredAt).toBe(now);
    db = returnOrder(db, id, now);
    expect(db.orders[0].status).toBe("returned");
    expect(db.products[0].stock[0].quantity).toBe(2);
    expect(storeBalance(db, "s1")).toBe(0);
  });
});

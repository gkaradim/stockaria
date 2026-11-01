import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, cancelOrder, completeOrder, requestReturn, returnOrder } from "./orders";
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
  it("cannot cancel once completed", () => {
    let db = place(1);
    const id = db.orders[0].id;
    db = completeOrder(db, id, "BX123", now);
    expect(() => cancelOrder(db, id, "x", now)).toThrow();
  });
  it("completing works without a tracking code and leaves none on the order", () => {
    const db = completeOrder(place(1), "o1", "  ", now);
    expect(db.orders[0].status).toBe("completed");
    expect(db.orders[0].trackingCode).toBeUndefined();
  });
  it("keeps the tracking code when there is one", () => {
    const db = completeOrder(place(1), "o1", " BX9 ", now);
    expect(db.orders[0].trackingCode).toBe("BX9");
  });
  it("cannot complete twice", () => {
    const db = completeOrder(place(1), "o1", "", now);
    expect(() => completeOrder(db, "o1", "", now)).toThrow();
  });
  it("only a completed order can be returned or have a return requested", () => {
    const db = place(1);
    expect(() => returnOrder(db, "o1", now)).toThrow();
    expect(() => requestReturn(db, "o1")).toThrow();
  });
  it("return after completion restocks and reverses ledger", () => {
    let db = place(1);
    const id = db.orders[0].id;
    db = completeOrder(db, id, "BX1", now);
    expect(db.orders[0].completedAt).toBe(now);
    db = returnOrder(db, id, now);
    expect(db.orders[0].status).toBe("returned");
    expect(db.products[0].stock[0].quantity).toBe(2);
    expect(storeBalance(db, "s1")).toBe(0);
  });
});

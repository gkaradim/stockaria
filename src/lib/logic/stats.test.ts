import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, cancelOrder } from "./orders";
import { storeStats } from "./stats";

const buyer = { name: "Α", email: "a@b.gr", phone: "69" };
const delivery = { type: "locker" as const, text: "Box Now" };

describe("storeStats", () => {
  it("counts orders and revenue, lists top products and low stock, ignores cancelled", () => {
    let db = placeOrder(
      testDb(),
      { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery },
      "2026-02-01T00:00:00Z",
    );
    const s = storeStats(db, "s1", "2026-01-01T00:00:00Z");
    expect(s.orders).toBe(1);
    expect(s.revenueCents).toBe(2000);
    expect(s.netCents).toBe(2000 + 290 - 200);
    expect(s.topProducts[0]).toMatchObject({ productId: "p1", qty: 1 });
    expect(s.lowStock.map((p) => p.productId)).toContain("p1"); // 1 left, threshold 2
    db = cancelOrder(db, db.orders[0].id, "x", "2026-02-02T00:00:00Z");
    const after = storeStats(db, "s1", "2026-01-01T00:00:00Z");
    expect(after.orders).toBe(0);
    expect(after.revenueCents).toBe(0);
  });
  it("only counts orders since the given date and sums product views", () => {
    const db = placeOrder(
      testDb(),
      { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery },
      "2026-02-01T00:00:00Z",
    );
    db.products[0].views = 7;
    expect(storeStats(db, "s1", "2026-03-01T00:00:00Z").orders).toBe(0);
    expect(storeStats(db, "s1", "2026-01-01T00:00:00Z").views).toBe(7);
  });
});

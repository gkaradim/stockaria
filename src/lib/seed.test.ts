import { describe, it, expect } from "vitest";
import { seedDb } from "./seed";
import { storeBalance } from "./logic/ledger";
import { storeStats } from "./logic/stats";

describe("seedDb", () => {
  const db = seedDb("2026-11-01T10:00:00Z");

  it("has approved stores, one pending store, and 18 active products", () => {
    expect(db.stores.filter((s) => s.status === "approved")).toHaveLength(3);
    expect(db.stores.filter((s) => s.status === "pending")).toHaveLength(1);
    expect(db.products).toHaveLength(18);
  });
  it("gives each approved store delivered history, one fresh order and a positive balance", () => {
    for (const id of ["s1", "s2", "s3"]) {
      const orders = db.orders.filter((o) => o.storeId === id);
      expect(orders.filter((o) => o.status === "delivered")).toHaveLength(3);
      expect(orders.filter((o) => o.status === "new")).toHaveLength(1);
      expect(storeBalance(db, id)).toBeGreaterThan(0);
      expect(storeStats(db, id, "2026-10-01T00:00:00Z").orders).toBe(4);
    }
  });
  it("never has negative stock", () => {
    for (const p of db.products) for (const s of p.stock) expect(s.quantity).toBeGreaterThanOrEqual(0);
  });
});

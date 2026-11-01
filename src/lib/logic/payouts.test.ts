import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, completeOrder, returnOrder } from "./orders";
import { createPayoutBatch, markPayoutPaid } from "./payouts";
import { storeBalance } from "./ledger";

const buyer = { name: "Α", email: "a@b.gr", phone: "69" };
const delivery = { type: "locker" as const, text: "Box Now" };
const order = (db: ReturnType<typeof testDb>) =>
  placeOrder(db, { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery }, "2026-02-01T00:00:00Z");

// one order of 20.00 with 10% commission and 2.90 shipping: store is owed 20.00 + 2.90 - 2.00
const NET = 2000 + 290 - 200;

describe("payout batch", () => {
  it("only includes completed orders up to the cutoff", () => {
    let db = order(order(testDb())); // two orders, stock 2
    const first = db.orders[0];
    db = completeOrder(db, first.id, "BX1", "2026-02-05T00:00:00Z");
    db = createPayoutBatch(db, "s1", "2026-02-15T00:00:00Z", "2026-02-15T00:00:00Z");
    expect(db.payouts).toHaveLength(1);
    expect(db.payouts[0].totalCents).toBe(NET);
    expect(db.payouts[0].status).toBe("pending");
    expect(storeBalance(db, "s1")).toBe(NET); // second order is still owed later
  });
  it("deducts a later return from the next payout", () => {
    let db = order(testDb());
    const id = db.orders[0].id;
    db = completeOrder(db, id, "BX1", "2026-02-05T00:00:00Z");
    db = createPayoutBatch(db, "s1", "2026-02-10T00:00:00Z", "2026-02-10T00:00:00Z");
    db = returnOrder(db, id, "2026-02-12T00:00:00Z");
    // refund -(2000+290) and commission reversal +200 are unpaid
    expect(storeBalance(db, "s1")).toBe(-(2000 + 290) + 200);
  });
  it("creates no payout when the total is not positive", () => {
    const db = createPayoutBatch(testDb(), "s1", "2026-02-15T00:00:00Z", "2026-02-15T00:00:00Z");
    expect(db.payouts).toHaveLength(0);
  });
  it("can be marked as paid", () => {
    let db = order(testDb());
    const id = db.orders[0].id;
    db = completeOrder(db, id, "BX1", "2026-02-05T00:00:00Z");
    db = createPayoutBatch(db, "s1", "2026-02-15T00:00:00Z", "2026-02-15T00:00:00Z");
    db = markPayoutPaid(db, db.payouts[0].id, "2026-02-16T00:00:00Z");
    expect(db.payouts[0].status).toBe("paid");
    expect(db.payouts[0].paidAt).toBe("2026-02-16T00:00:00Z");
  });
});

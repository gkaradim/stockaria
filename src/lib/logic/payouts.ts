import type { Db, LedgerEntry } from "../types";
import { addEntry, nextId } from "./ledger";

function isEligible(db: Db, entry: LedgerEntry, cutoff: string) {
  if (entry.payoutId || entry.type === "payout") return false;
  if (!entry.orderId) return true;
  const order = db.orders.find((o) => o.id === entry.orderId);
  if (!order) return false;
  if (order.status === "cancelled" || order.status === "returned") return true; // sale and reversal settle together
  return order.status === "completed" && !!order.completedAt && order.completedAt <= cutoff;
}

/** Settles completed orders up to `cutoff` plus any refunds. Skips when the total is not positive. */
export function createPayoutBatch(input: Db, storeId: string, cutoff: string, now: string): Db {
  const db = structuredClone(input);
  const eligible = db.ledger.filter((e) => e.storeId === storeId && isEligible(db, e, cutoff));
  const total = eligible.reduce((sum, e) => sum + e.amountCents, 0);
  if (total <= 0) return input;
  const payoutId = nextId(db, "po");
  db.payouts.push({ id: payoutId, storeId, totalCents: total, cutoff, status: "pending", createdAt: now });
  for (const e of eligible) e.payoutId = payoutId;
  addEntry(db, { storeId, type: "payout", amountCents: -total }, now);
  db.ledger[db.ledger.length - 1].payoutId = payoutId;
  return db;
}

export function markPayoutPaid(input: Db, payoutId: string, now: string): Db {
  const db = structuredClone(input);
  const payout = db.payouts.find((p) => p.id === payoutId);
  if (!payout) throw new Error("Η πληρωμή δεν βρέθηκε");
  payout.status = "paid";
  payout.paidAt = now;
  return db;
}

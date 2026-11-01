import type { Db, LedgerType } from "../types";

export const nextId = (db: Db, prefix: string) => `${prefix}${++db.seq}`;

export function addEntry(
  db: Db,
  e: { storeId: string; orderId?: string; type: LedgerType; amountCents: number },
  now: string,
) {
  db.ledger.push({ id: nextId(db, "l"), createdAt: now, ...e });
}

/** Sum of ledger movements not yet settled in a payout. Positive = platform owes the store. */
export function storeBalance(db: Db, storeId: string) {
  return db.ledger
    .filter((e) => e.storeId === storeId && !e.payoutId)
    .reduce((sum, e) => sum + e.amountCents, 0);
}

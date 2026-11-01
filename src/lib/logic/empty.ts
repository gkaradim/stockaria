import type { Db } from "../types";

export const emptyDb = (): Db => ({
  stores: [],
  products: [],
  orders: [],
  ledger: [],
  payouts: [],
  users: [],
  carts: {},
  seq: 0,
});

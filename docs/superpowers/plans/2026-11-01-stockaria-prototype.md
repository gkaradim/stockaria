# stockaria.gr Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A clickable, mobile-first Next.js prototype of stockaria.gr (buyer, store, admin) whose data lives in the browser, so flows and store statistics can be tested with real users before any backend exists.

**Architecture:** Pure business logic in `src/lib/logic/*` (money, shipping, cart, orders, ledger, stats, payouts), fully unit tested. A thin `src/lib/api.ts` exposes async functions (`getProducts`, `createOrder`, ...) backed by `localStorage`; in phase 2 only this file is replaced by Supabase calls. UI reads data through a `useApi` hook that re-runs when the browser store changes. Detail pages use query strings (`/product?id=...`) instead of dynamic segments so the app can be statically exported (GitHub Pages) while data is created at runtime.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Vitest. No backend, no emails, no real payments in this phase.

**Assumptions made for the prototype (change later if needed):**
- Money is integer cents. Commission applies to the items total only. The flat shipping fee paid by the buyer goes to the store (it ships the parcel).
- Seed commission 12% and shipping prices S/M/L are DEMO values, not real rates. Both are configurable in `src/lib/logic/constants.ts`.
- Uploaded photos are downscaled in the browser (max 640px JPEG) and stored as data URLs. localStorage is ~5 MB, so the prototype warns when it is full.

---

## File Structure

```
stockaria/
  package.json, next.config.ts, vitest.config.ts, tsconfig.json
  .github/workflows/pages.yml               # static export to GitHub Pages
  src/lib/types.ts                          # all shared types
  src/lib/logic/constants.ts                # commission, shipping rates, categories, sizes
  src/lib/logic/money.ts                    # formatEUR, calcCommission
  src/lib/logic/cart.ts                     # per-store carts (pure)
  src/lib/logic/orders.ts                   # placeOrder, cancelOrder, markShipped, markDelivered, returnOrder (pure, take Db return Db)
  src/lib/logic/ledger.ts                   # ledger entries + storeBalance
  src/lib/logic/payouts.ts                  # createPayoutBatch (pure)
  src/lib/logic/stats.ts                    # storeStats
  src/lib/logic/*.test.ts                   # unit tests next to each module
  src/lib/seed.ts                           # demo stores/products (SVG placeholder images)
  src/lib/storage.ts                        # load/save Db in localStorage, subscribe
  src/lib/api.ts                            # async functions used by the UI
  src/lib/session.ts                        # simulated email-link login
  src/lib/hooks.ts                          # useApi, useSession
  src/lib/image.ts                          # downscale uploaded photo to data URL
  src/components/                           # Header, ProductCard, SizePicker, PhotoUploader, StatCard, StatusBadge, Money, Guard
  src/app/page.tsx                          # browse + filters
  src/app/product/page.tsx                  # ?id=
  src/app/cart/page.tsx                     # one cart per store
  src/app/checkout/page.tsx                 # ?store=
  src/app/order/page.tsx                    # ?id= tracking
  src/app/login/page.tsx                    # choose customer/store, login or register
  src/app/register/store/page.tsx           # 4-step store signup
  src/app/account/page.tsx                  # customer orders
  src/app/store/{page,products/page,products/new/page,orders/page,order/page,payouts/page,profile/page}.tsx
  src/app/admin/{page,orders/page,payouts/page}.tsx
```

---

### Task 1: Scaffold, git, test runner

**Files:** Create everything under `stockaria/` via create-next-app; modify `package.json`, `next.config.ts`; create `vitest.config.ts`.

- [ ] **Step 1: Scaffold into the existing folder (it already contains `docs/`)**

Run from `/Users/gkaradim/GK stuff/Claude-stuff/stockaria`:
```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
```
Expected: project files appear next to `docs/`. If create-next-app refuses a non-empty folder, scaffold into `../stockaria-tmp` and move the files over (do not overwrite `docs/`).

- [ ] **Step 2: Add Vitest**
```bash
npm i -D vitest
```
Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```
Add script `"test": "vitest run"` to `package.json`.

- [ ] **Step 3: Static export config.** Replace `next.config.ts`:
```ts
import type { NextConfig } from "next";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
```

- [ ] **Step 4: Verify** `npm run build` succeeds and `npm test` reports "No test files found" (acceptable at this point).

- [ ] **Step 5: Commit**
```bash
git init 2>/dev/null; git add -A && git commit -m "chore: scaffold Next.js app with vitest and static export"
```
(create-next-app already runs `git init`; the first command is harmless.)

---

### Task 2: Types and constants

**Files:** Create `src/lib/types.ts`, `src/lib/logic/constants.ts`.

- [ ] **Step 1: `src/lib/types.ts`**
```ts
export type StoreStatus = "pending" | "approved" | "suspended";
export type OrderStatus = "new" | "preparing" | "shipped" | "delivered" | "cancelled" | "returned";
export type ParcelSize = "S" | "M" | "L";
export type LedgerType = "sale" | "commission" | "refund" | "commission_reversal" | "payout";

export interface Store {
  id: string; name: string; afm: string; doy: string; address: string; phone: string;
  iban: string; ownerName: string; ownerEmail: string;
  commissionRate: number; // 0.12 = 12%
  status: StoreStatus; createdAt: string;
}
export interface StockLine { size: string; quantity: number }
export interface Product {
  id: string; storeId: string; title: string; description: string; category: string;
  images: string[]; priceCents: number; originalPriceCents?: number;
  stock: StockLine[]; status: "draft" | "active" | "hidden";
  createdBy: "store" | "platform"; createdAt: string; views: number;
}
export interface CartLine { productId: string; size: string; qty: number }
export type Carts = Record<string, CartLine[]>; // key = storeId
export interface OrderItem { productId: string; title: string; size: string; qty: number; unitPriceCents: number }
export interface Buyer { name: string; email: string; phone: string }
export interface Delivery { type: "locker" | "address"; text: string }
export interface Order {
  id: string; storeId: string; buyer: Buyer; delivery: Delivery;
  items: OrderItem[]; itemsCents: number; shippingCents: number; totalCents: number;
  parcelSize: ParcelSize; commissionCents: number;
  status: OrderStatus; trackingCode?: string; cancelReason?: string;
  createdAt: string; deliveredAt?: string;
}
export interface LedgerEntry {
  id: string; storeId: string; orderId?: string; type: LedgerType;
  amountCents: number; // positive = owed to store, negative = deducted
  createdAt: string; payoutId?: string;
}
export interface Payout { id: string; storeId: string; totalCents: number; cutoff: string; status: "pending" | "paid"; createdAt: string; paidAt?: string }
export interface User { email: string; name?: string; phone?: string; role: "customer" | "store" | "admin"; storeId?: string }
export interface Db {
  stores: Store[]; products: Product[]; orders: Order[]; ledger: LedgerEntry[];
  payouts: Payout[]; users: User[]; carts: Carts; seq: number;
}
```

- [ ] **Step 2: `src/lib/logic/constants.ts`**
```ts
import type { ParcelSize } from "../types";
// DEMO values for the prototype only. Not real carrier prices.
export const DEFAULT_COMMISSION = 0.12;
export const SHIPPING_CENTS: Record<ParcelSize, number> = { S: 290, M: 350, L: 450 };
export const CATEGORIES = ["Γυναικεία ρούχα", "Ανδρικά ρούχα", "Παιδικά ρούχα", "Παπούτσια", "Αξεσουάρ"] as const;
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
export const PARCEL_BY_CATEGORY: Record<string, ParcelSize> = {
  "Γυναικεία ρούχα": "S", "Ανδρικά ρούχα": "S", "Παιδικά ρούχα": "S", "Παπούτσια": "M", "Αξεσουάρ": "S",
};
```

- [ ] **Step 3: Commit** `git add -A && git commit -m "feat: shared types and constants"`

---

### Task 3: Money and shipping logic (TDD)

**Files:** Create `src/lib/logic/money.ts`, `src/lib/logic/money.test.ts`.

- [ ] **Step 1: Failing test `money.test.ts`**
```ts
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
```
- [ ] **Step 2: Run** `npx vitest run src/lib/logic/money.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement `money.ts`**
```ts
import type { ParcelSize } from "../types";
import { PARCEL_BY_CATEGORY } from "./constants";

export const formatEUR = (cents: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(cents / 100);

export const calcCommission = (itemsCents: number, rate: number) => Math.round(itemsCents * rate);

const ORDER: ParcelSize[] = ["S", "M", "L"];
export function parcelFor(categories: string[]): ParcelSize {
  return categories.reduce<ParcelSize>((max, c) => {
    const p = PARCEL_BY_CATEGORY[c] ?? "S";
    return ORDER.indexOf(p) > ORDER.indexOf(max) ? p : max;
  }, "S");
}

export function discountPercent(priceCents: number, originalCents?: number) {
  if (!originalCents || originalCents <= priceCents) return 0;
  return Math.round((1 - priceCents / originalCents) * 100);
}
```
- [ ] **Step 4: Run** the test → PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: money, parcel and discount helpers"`

---

### Task 4: Orders and ledger logic (TDD)

**Files:** Create `src/lib/logic/orders.ts`, `ledger.ts`, `orders.test.ts`, plus a test helper `src/lib/logic/testdb.ts`.

Behavior (all functions are pure: take a `Db`, return a new `Db`, throw `Error` with a Greek message on invalid input):
- `placeOrder(db, { storeId, lines, buyer, delivery }, now)`: reject unapproved store or empty lines; for each line the product must belong to the store, be `active`, and have enough stock for that size; decrement stock; compute `itemsCents`, `shippingCents = SHIPPING_CENTS[parcel]`, `commissionCents = calcCommission(itemsCents, store.commissionRate)`; create order `new`; append ledger `sale` (+items+shipping) and `commission` (−commission); clear that store's cart.
- `cancelOrder(db, orderId, reason, now)`: only `new|preparing`; restock; ledger `refund` (−items−shipping) and `commission_reversal` (+commission); status `cancelled`.
- `setStatus` helpers: `markPreparing`, `markShipped(db, id, trackingCode)` (requires non-empty code), `markDelivered(db, id, now)` (sets `deliveredAt`).
- `returnOrder(db, orderId, now)`: only `delivered`; restock; same ledger reversals as cancel; status `returned`.
- `storeBalance(db, storeId)`: sum of ledger amounts without `payoutId`.

- [ ] **Step 1: `testdb.ts`**
```ts
import type { Db } from "../types";
export const emptyDb = (): Db => ({ stores: [], products: [], orders: [], ledger: [], payouts: [], users: [], carts: {}, seq: 0 });

export function testDb(): Db {
  const db = emptyDb();
  db.stores.push({ id: "s1", name: "Test Store", afm: "000000000", doy: "Α' Αθηνών", address: "Ερμού 1", phone: "2100000000", iban: "GR00", ownerName: "Ιδιοκτήτης", ownerEmail: "o@test.gr", commissionRate: 0.1, status: "approved", createdAt: "2026-01-01T00:00:00Z" });
  db.products.push({ id: "p1", storeId: "s1", title: "Μπλούζα", description: "", category: "Γυναικεία ρούχα", images: [], priceCents: 2000, stock: [{ size: "M", quantity: 2 }], status: "active", createdBy: "store", createdAt: "2026-01-01T00:00:00Z", views: 0 });
  return db;
}
```
- [ ] **Step 2: Failing tests `orders.test.ts`**
```ts
import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, cancelOrder, markShipped, markDelivered, returnOrder } from "./orders";
import { storeBalance } from "./ledger";

const buyer = { name: "Α", email: "a@b.gr", phone: "69" };
const delivery = { type: "locker" as const, text: "Box Now Σύνταγμα" };
const now = "2026-02-01T10:00:00Z";
const place = (qty = 1) => placeOrder(testDb(), { storeId: "s1", lines: [{ productId: "p1", size: "M", qty }], buyer, delivery }, now);

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
    const db = testDb(); db.stores[0].status = "pending";
    expect(() => placeOrder(db, { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery }, now)).toThrow();
  });
});

describe("cancel / return", () => {
  it("cancel restocks and nets ledger to zero", () => {
    const db = cancelOrder(place(1), place(1).orders[0].id, "Δεν υπάρχει", now);
    expect(db.orders[0].status).toBe("cancelled");
    expect(db.products[0].stock[0].quantity).toBe(2);
    expect(storeBalance(db, "s1")).toBe(0);
  });
  it("cannot cancel after shipped", () => {
    let db = place(1); const id = db.orders[0].id;
    db = markShipped(db, id, "BX123");
    expect(() => cancelOrder(db, id, "x", now)).toThrow();
  });
  it("shipping needs a tracking code", () => {
    const db = place(1);
    expect(() => markShipped(db, db.orders[0].id, "  ")).toThrow();
  });
  it("return after delivery restocks and reverses ledger", () => {
    let db = place(1); const id = db.orders[0].id;
    db = markDelivered(markShipped(db, id, "BX1"), id, now);
    expect(db.orders[0].deliveredAt).toBe(now);
    db = returnOrder(db, id, now);
    expect(db.orders[0].status).toBe("returned");
    expect(storeBalance(db, "s1")).toBe(0);
  });
});
```
(Note: `cancel restocks` test calls `place(1)` twice; both produce the same ids because `seq` starts at 0 in each fresh `testDb`. Order ids are `o${++seq}`.)

- [ ] **Step 3: Run** `npx vitest run src/lib/logic/orders.test.ts` → FAIL.
- [ ] **Step 4: Implement `ledger.ts` and `orders.ts`.** Use `structuredClone(db)` at the start of each function. IDs: `const id = (db: Db, p: string) => \`${p}${++db.seq}\``. Ledger helper `addEntry(db, {storeId, orderId, type, amountCents}, now)`.
- [ ] **Step 5: Run** all tests → PASS.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: order lifecycle and ledger logic"`

---

### Task 5: Cart, payouts, stats logic (TDD)

**Files:** Create `cart.ts`, `payouts.ts`, `stats.ts` and their `.test.ts` in `src/lib/logic/`.

- [ ] **Step 1: Failing tests**

`cart.test.ts`:
```ts
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
});
```
`payouts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, markShipped, markDelivered, returnOrder } from "./orders";
import { createPayoutBatch } from "./payouts";
import { storeBalance } from "./ledger";

const buyer = { name: "Α", email: "a@b.gr", phone: "69" };
const delivery = { type: "locker" as const, text: "Box Now" };
const order = (db: ReturnType<typeof testDb>) =>
  placeOrder(db, { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery }, "2026-02-01T00:00:00Z");

describe("payout batch", () => {
  it("only includes delivered orders up to cutoff", () => {
    let db = order(testDb());
    db = order(db); // second order stays undelivered
    const [o1] = db.orders;
    db = markDelivered(markShipped(db, o1.id, "BX1"), o1.id, "2026-02-05T00:00:00Z");
    db = createPayoutBatch(db, "s1", "2026-02-15T00:00:00Z", "2026-02-15T00:00:00Z");
    expect(db.payouts).toHaveLength(1);
    expect(db.payouts[0].totalCents).toBe(2000 + 290 - 200);
    expect(storeBalance(db, "s1")).toBe(2000 + 290 - 200); // second order still owed later
  });
  it("deducts returns from the next payout", () => {
    let db = order(testDb()); const id = db.orders[0].id;
    db = markDelivered(markShipped(db, id, "BX1"), id, "2026-02-05T00:00:00Z");
    db = createPayoutBatch(db, "s1", "2026-02-10T00:00:00Z", "2026-02-10T00:00:00Z");
    db = returnOrder(db, id, "2026-02-12T00:00:00Z");
    expect(storeBalance(db, "s1")).toBe(-(2000 + 290 - 200) + 0 - 0 + (-0)); // placeholder replaced below
  });
  it("creates no payout when total is not positive", () => {
    const db = createPayoutBatch(testDb(), "s1", "2026-02-15T00:00:00Z", "2026-02-15T00:00:00Z");
    expect(db.payouts).toHaveLength(0);
  });
});
```
Replace the second test's last expectation with the real value when writing the file: after the first payout the ledger has the payout entry (−2090) and the sale/commission entries marked with `payoutId`; the return adds refund (−2290) and reversal (+200), so unpaid balance is `-2290 + 200 = -2090`. The assertion is `expect(storeBalance(db, "s1")).toBe(-2090);`.

`stats.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { testDb } from "./testdb";
import { placeOrder, cancelOrder } from "./orders";
import { storeStats } from "./stats";

const buyer = { name: "Α", email: "a@b.gr", phone: "69" };
const delivery = { type: "locker" as const, text: "Box Now" };

describe("storeStats", () => {
  it("counts orders and revenue excluding cancelled, lists top products and low stock", () => {
    let db = placeOrder(testDb(), { storeId: "s1", lines: [{ productId: "p1", size: "M", qty: 1 }], buyer, delivery }, "2026-02-01T00:00:00Z");
    const s = storeStats(db, "s1", "2026-01-01T00:00:00Z");
    expect(s.orders).toBe(1);
    expect(s.revenueCents).toBe(2000);
    expect(s.netCents).toBe(2000 + 290 - 200);
    expect(s.topProducts[0]).toMatchObject({ productId: "p1", qty: 1 });
    expect(s.lowStock.map((p) => p.productId)).toContain("p1"); // 1 left, threshold 2
    db = cancelOrder(db, db.orders[0].id, "x", "2026-02-02T00:00:00Z");
    expect(storeStats(db, "s1", "2026-01-01T00:00:00Z").orders).toBe(0);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run` → new tests FAIL.
- [ ] **Step 3: Implement.**
  - `cart.ts`: `addToCart(db, productId, size, qty)` (find product, key by `product.storeId`, cap total qty at that size's stock, ignore <=0), `setQty(db, storeId, productId, size, qty)` (0 removes; caps), `removeFromCart`, `cartTotal(db, storeId)` (sum of qty × price).
  - `payouts.ts`: `createPayoutBatch(db, storeId, cutoffISO, now)`: eligible entries = no `payoutId` and (type is `refund` or `commission_reversal`, or its order is `delivered` with `deliveredAt <= cutoff`); also entries of cancelled/returned orders must be included in pairs, so include `sale`/`commission` entries of orders in status `cancelled|returned` too. Total = sum. If total <= 0 return db unchanged. Otherwise create payout `po${++seq}` status `pending`, mark eligible entries with `payoutId`, and append a `payout` entry of `-total` also marked with that payoutId. Add `markPayoutPaid(db, payoutId, now)`.
  - `stats.ts`: `storeStats(db, storeId, sinceISO)` returns `{ orders, revenueCents, netCents, topProducts: {productId,title,qty}[] (top 5 by qty), lowStock: {productId,title,size,quantity}[] (quantity <= 2 and > 0, or 0), views }`. Orders considered: `createdAt >= since` and status not `cancelled|returned`. `netCents` = revenue + shipping − commission for those orders.
- [ ] **Step 4: Run** `npx vitest run` → all PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: cart, payout and stats logic"`

---

### Task 6: Storage, seed, API, session, hooks

**Files:** Create `seed.ts`, `storage.ts`, `api.ts`, `session.ts`, `hooks.ts`, `image.ts`.

- [ ] **Step 1: `storage.ts`**: `loadDb()` reads `localStorage["stockaria.v1"]`, falls back to `seedDb()`; `saveDb(db)` writes (catch quota errors and `window.dispatchEvent(new Event("stockaria:quota"))`) then dispatches `stockaria:change`; `subscribe(cb)` listens to `stockaria:change` and the `storage` event; `resetDb()` restores the seed. All functions guard `typeof window === "undefined"`.
- [ ] **Step 2: `seed.ts`**: `seedDb()` returns 3 approved stores (e.g. a women's boutique, a shoe store, a menswear store in different cities), 1 pending store, 18 active products with `priceCents`, `originalPriceCents`, stock and `images: [placeholderSvg(color, label)]` where `placeholderSvg` returns a `data:image/svg+xml` URL (colored rectangle with the category initial); 3 historical delivered orders per approved store with matching ledger entries so dashboards show data on first load; one admin user `admin@stockaria.gr`.
- [ ] **Step 3: `api.ts`**: async functions, each loading the Db, calling the pure logic, saving, and returning the result: `getProducts(filter)`, `getProduct(id)`, `bumpView(id)`, `getStore(id)`, `listStores()`, `addToCart`, `setCartQty`, `removeFromCart`, `getCarts()`, `createOrder(...)`, `getOrder(id)`, `listOrders({storeId?, email?})`, `setOrderStatus` wrappers (`markShipped`, `markDelivered`, `cancelOrder`, `returnOrder`), `saveProduct(product)`, `deleteProduct(id)`, `duplicateProduct(id)`, `getStoreStats(storeId, rangeDays)`, `getStoreLedger(storeId)`, `listPayouts(storeId?)`, `createPayout(storeId, cutoff)`, `markPayoutPaid(id)`, `registerStore(data)`, `approveStore(id)`, `suspendStore(id)`, `inviteStore(data)`, `updateStore(id, data)`, `resetDemo()`.
- [ ] **Step 4: `session.ts`**: session `{ email, role, storeId? }` in `localStorage["stockaria.session"]`; `requestLink(email, role)` returns a fake token (no email is sent) and `consumeLink(email, role)` resolves the user (creating a customer if new; for `store` role requires an existing store whose `ownerEmail` matches, else throws "Δεν βρέθηκε κατάστημα με αυτό το email"); `logout()`; `getSession()`; admin login only at `/admin` for `admin@stockaria.gr`.
- [ ] **Step 5: `hooks.ts`**: `useApi<T>(fn: () => Promise<T>, deps)` returns `{ data, loading }`, re-runs on `stockaria:change`; `useSession()`.
- [ ] **Step 6: `image.ts`**: `fileToDataUrl(file, maxSide=640, quality=0.7)` using `createImageBitmap` + canvas.
- [ ] **Step 7: Verify** `npm run build` passes and `npx vitest run` passes.
- [ ] **Step 8: Commit** `git add -A && git commit -m "feat: browser data layer, seed data, session and hooks"`

---

### Task 7: Shell, theme and login/registration

**Files:** Modify `src/app/layout.tsx`, `src/app/globals.css`; create `src/components/*`, `src/app/login/page.tsx`, `src/app/register/store/page.tsx`.

Design rules: mobile-first (design at 375px, then `md:` and `lg:` upgrades), minimum 44px touch targets, 16px+ body text (older store owners), one accent color, high contrast. Greek UI text throughout. `<html lang="el">`.

- [ ] **Step 1:** `layout.tsx` with sticky `Header` (logo "stockaria", search icon, cart icon with total count across stores, login/account menu), a demo banner "Δοκιμαστική έκδοση: τα δεδομένα αποθηκεύονται στον browser σου" with a "Επαναφορά" button calling `resetDemo()`.
- [ ] **Step 2:** `/login`: step 1 choose "Είμαι πελάτης" / "Έχω κατάστημα"; step 2 tabs "Σύνδεση" / "Δημιουργία λογαριασμού"; email field then "Στείλε μου σύνδεσμο"; confirmation screen "Στάλθηκε σύνδεσμος στο email σου (προσομοίωση)" with a button "Άνοιγμα συνδέσμου" that logs in and redirects (`/account` for customers, `/store/` for stores). Customer registration optionally asks name and phone. Store "Δημιουργία λογαριασμού" links to `/register/store`.
- [ ] **Step 3:** `/register/store`: 4 steps with a progress bar and large fields: (1) owner name + email, (2) business: επωνυμία, ΑΦΜ (9 digits validation), ΔΟΥ, διεύθυνση, τηλέφωνο, (3) IBAN (basic format check: starts with GR + 25 digits ignoring spaces), (4) terms checkboxes (commission %, returns policy, platform access to products) → creates store with status `pending` and shows "Σε αναμονή έγκρισης".
- [ ] **Step 4:** Create `Guard` component that redirects to `/login` if the required role is missing; stores with `pending` status see a waiting screen instead of the dashboard.
- [ ] **Step 5: Verify** in the browser at 375px and 1280px (see Task 11 checklist).
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: shell, login and store registration"`

---

### Task 8: Buyer flow

**Files:** `src/app/page.tsx`, `product/page.tsx`, `cart/page.tsx`, `checkout/page.tsx`, `order/page.tsx`, `account/page.tsx`, components `ProductCard`, `SizePicker`.

- [ ] **Step 1: Home:** hero line "Καινούρια ρούχα και παπούτσια από καταστήματα, σε τιμές outlet", search box, filter chips (κατηγορία, μέγεθος, κατάστημα, ελάχιστη έκπτωση), sort (νεότερα, χαμηλότερη τιμή, μεγαλύτερη έκπτωση), 2-column grid on mobile, 3-4 on desktop. Cards show image, title, store name, price, struck original price and `-X%` badge. Only products of approved stores with `status === "active"` and some stock.
- [ ] **Step 2: Product (`?id=`):** image gallery (swipeable on mobile), price + discount, store name, `SizePicker` (sold-out sizes disabled), "Προσθήκη στο καλάθι", bumps views once per load. Never show commission anywhere on buyer pages.
- [ ] **Step 3: Cart:** one section per store with its lines, qty steppers, items total, shipping (flat by parcel size), and a "Ολοκλήρωση παραγγελίας" button per store → `/checkout/?store=ID`.
- [ ] **Step 4: Checkout (`?store=`):** guest form (name, email, phone), delivery choice (Box Now locker text field / address), summary with shipping, a clearly marked "Δοκιμαστική πληρωμή" button that calls `createOrder`, then redirects to `/order/?id=`.
- [ ] **Step 5: Order tracking (`?id=`):** timeline (new → preparing → shipped → delivered), tracking code when present, items, totals. If delivered and within 14 days show "Αίτημα επιστροφής" which sets the order to a `returnRequested` flag shown to the store (prototype: button calls `returnOrder` only when the store confirms in its panel; the buyer button shows a confirmation text and the policy: buyer pays return shipping for change of mind).
- [ ] **Step 6: Account:** list of the customer's orders by email.
- [ ] **Step 7: Commit** `git add -A && git commit -m "feat: buyer browse, product, cart, checkout, tracking"`

---

### Task 9: Store panel

**Files:** `src/app/store/**`, components `PhotoUploader`, `StatCard`, `StatusBadge`.

- [ ] **Step 1: Dashboard (`/store/`):** range tabs 7 days / 30 days / all; `StatCard`s: παραγγελίες, τζίρος, ποσό προς πληρωμή (net), προβολές; "Κορυφαία προϊόντα" list; "Χαμηλό απόθεμα" list; "Νέες παραγγελίες" shortcut. Updates live after each test order (via `useApi`).
- [ ] **Step 2: New product (`/store/products/new/`)**, one-handed mobile form in this order: photos (`PhotoUploader` using camera/gallery, up to 5, `accept="image/*" capture` option), τίτλος, κατηγορία, τιμή, αρχική τιμή (προαιρετικά, shows live `-X%`), μεγέθη: tap size chips, each selected size shows a +/- quantity stepper, περιγραφή (optional), sticky bottom "Δημοσίευση" button. Photos are optional. Validation messages in Greek, inline.
- [ ] **Step 3: Products list:** thumbnail, title, price, stock summary, status toggle (ενεργό/κρυφό), "Αντιγραφή" (duplicate then edit), "Διαγραφή" with confirm.
- [ ] **Step 4: Orders list and detail (`/store/orders/`, `/store/order/?id=`):** filter by status, big action buttons: "Ετοιμάζεται", "Στάλθηκε" (requires tracking code input), "Παραδόθηκε", "Δεν υπάρχει" (cancel with automatic refund note), and for delivered orders "Επιβεβαίωση επιστροφής". Detail shows buyer, delivery, items, totals and the net amount for the store; the commission appears as one labeled line here and in payouts.
- [ ] **Step 5: Payouts (`/store/payouts/`):** current balance owed, next payout date (1st and 15th), list of payouts with status, and a table of ledger movements, plus a "Τιμολόγια προμήθειας" section (list of commission totals per payout, no PDF yet).
- [ ] **Step 6: Profile:** edit business details and IBAN.
- [ ] **Step 7: Commit** `git add -A && git commit -m "feat: store panel with dashboard, product upload, orders, payouts"`

---

### Task 10: Admin panel

**Files:** `src/app/admin/page.tsx`, `admin/orders/page.tsx`, `admin/payouts/page.tsx`.

- [ ] **Step 1: Stores (`/admin/`):** tabs by status; each row shows επωνυμία, ΑΦΜ, ΔΟΥ, IBAN, ημερομηνία, buttons "Έγκριση", "Αναστολή"; "Νέο κατάστημα" form (name, ΑΦΜ, owner email) that creates an approved-pending store and shows a copyable fake invitation link; per-store "Διαχείριση ως κατάστημα" which sets a session `storeId` override and opens `/store/` with a banner "Διαχειρίζεσαι ως πλατφόρμα: <store>" and a button to exit. Products created in this mode get `createdBy: "platform"`.
- [ ] **Step 2: Orders (`/admin/orders/`):** all orders with store, status, totals, commission.
- [ ] **Step 3: Payouts (`/admin/payouts/`):** choose cutoff date (default today), button "Δημιουργία πληρωμών" which runs `createPayoutBatch` for every approved store, a table of pending payouts with IBAN and amount (copy IBAN button), "Σημείωση ως πληρωμένο".
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat: admin panel for approvals, orders, payouts"`

---

### Task 11: Verify in the browser

- [ ] **Step 1:** `npm run dev`, open the app with the preview tools.
- [ ] **Step 2:** At 375px width walk through: browse → product → add to cart → checkout (guest) → order page → switch to a store account → see the new order and updated dashboard numbers → mark shipped with a code → mark delivered → admin creates a payout.
- [ ] **Step 3:** Add a product as a store on a 375px viewport and confirm it appears on the home page.
- [ ] **Step 4:** Check 768px and 1280px layouts for horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
- [ ] **Step 5:** Check the console for errors, run `npx vitest run`, `npm run lint` and `npm run build`. Fix everything found.
- [ ] **Step 6: Commit** `git add -A && git commit -m "fix: issues found in browser verification"`

---

### Task 12: GitHub Pages workflow (publishing needs explicit user OK)

**Files:** Create `.github/workflows/pages.yml`.

- [ ] **Step 1:** Workflow that on push to `main` runs `npm ci`, `npm run build` with `NEXT_PUBLIC_BASE_PATH=/<repo-name>`, uploads `out/` with `actions/upload-pages-artifact` and deploys with `actions/deploy-pages` (pin each action to an exact released major version verified at write time).
- [ ] **Step 2:** Commit the workflow locally. Do **not** create a remote or push until the user confirms: repository name, visibility (GitHub Pages on a free account needs a public repository), and that the prototype (fake data only) may be published.
- [ ] **Step 3:** After the user creates the repo on github.com (the `gh` CLI is not installed here) and gives the URL: `git remote add origin <url> && git push -u origin main`, then the user enables Pages with source "GitHub Actions" in the repo settings. The link will be `https://<user>.github.io/<repo-name>/`.

---

## Self-Review (spec coverage)

- Mobile-first, Greek, responsive: Tasks 7-9, verified in Task 11.
- Per-store carts and one order per store: Tasks 5, 8.
- Guest checkout + optional email-link account for customers and stores: Tasks 6, 7, 8.
- Fast mobile product upload, optional photos, duplicate product: Task 9.
- Store dashboard with live stats, no emails: Tasks 5, 9.
- Commission never shown to buyers, shown to stores (orders, payouts): Tasks 8, 9.
- Immediate purchase, "δεν υπάρχει" with refund: Tasks 4, 9.
- Tracking code entry, flat shipping per parcel size: Tasks 3, 4, 9.
- Returns policy (buyer pays for change of mind, commission reversed): Tasks 4, 8, 9.
- 15-day payouts, returns deducted from next payout: Tasks 5, 10.
- Admin approval, invite, manage-as, platform-created products: Task 10.
- Out of scope per spec (Excel import, Box Now API, VIES, SMS) not planned.
- Known gap: customer-initiated return request in the prototype is a simple flag shown to the store; full dispute handling is phase 2.

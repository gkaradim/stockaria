import type { Buyer, Db, Delivery, LedgerEntry, Order, OrderStatus, Payout, Product, Store, User } from "./types";
import { loadDb, resetDb, saveDb } from "./storage";
import { addToCart as addToCartLogic, removeFromCart as removeFromCartLogic, setQty as setQtyLogic } from "./logic/cart";
import { SHIPPING_CENTS, DEFAULT_COMMISSION } from "./logic/constants";
import { storeBalance } from "./logic/ledger";
import { discountPercent, parcelFor } from "./logic/money";
import {
  cancelOrder as cancelOrderLogic,
  completeOrder as completeOrderLogic,
  placeOrder,
  requestReturn as requestReturnLogic,
  returnOrder as returnOrderLogic,
} from "./logic/orders";
import { createPayoutBatch, markPayoutPaid as markPayoutPaidLogic } from "./logic/payouts";
import { storeStats } from "./logic/stats";
import { nextId } from "./logic/ledger";

// Every function here is async and only talks to the browser store. In phase 2 this file is
// replaced by Supabase calls with the same signatures.

const now = () => new Date().toISOString();

function mutate(fn: (db: Db) => Db): Db {
  const next = fn(loadDb());
  saveDb(next);
  return next;
}

export interface ProductView extends Product {
  storeName: string;
  discount: number;
  totalStock: number;
}

function toView(db: Db, p: Product): ProductView {
  return {
    ...p,
    storeName: db.stores.find((s) => s.id === p.storeId)?.name ?? "",
    discount: discountPercent(p.priceCents, p.originalPriceCents),
    totalStock: p.stock.reduce((sum, s) => sum + s.quantity, 0),
  };
}

export interface ProductFilter {
  q?: string;
  category?: string;
  size?: string;
  storeId?: string;
  minDiscount?: number;
  sort?: "new" | "price" | "discount";
}

/** Public catalogue: active products of approved stores that still have stock. */
export async function getProducts(f: ProductFilter = {}): Promise<ProductView[]> {
  const db = loadDb();
  const approved = new Set(db.stores.filter((s) => s.status === "approved").map((s) => s.id));
  let list = db.products
    .filter((p) => p.status === "active" && approved.has(p.storeId))
    .map((p) => toView(db, p))
    .filter((p) => p.totalStock > 0);
  if (f.q) {
    const q = f.q.toLowerCase();
    list = list.filter((p) => `${p.title} ${p.storeName} ${p.category}`.toLowerCase().includes(q));
  }
  if (f.category) list = list.filter((p) => p.category === f.category);
  if (f.storeId) list = list.filter((p) => p.storeId === f.storeId);
  if (f.size) list = list.filter((p) => p.stock.some((s) => s.size === f.size && s.quantity > 0));
  if (f.minDiscount) list = list.filter((p) => p.discount >= f.minDiscount!);
  const sort = f.sort ?? "new";
  list.sort((a, b) =>
    sort === "price" ? a.priceCents - b.priceCents : sort === "discount" ? b.discount - a.discount : b.createdAt.localeCompare(a.createdAt),
  );
  return list;
}

export async function getProduct(id: string): Promise<ProductView | null> {
  const db = loadDb();
  const p = db.products.find((x) => x.id === id);
  return p ? toView(db, p) : null;
}

export async function bumpView(id: string) {
  mutate((db) => {
    const next = structuredClone(db);
    const p = next.products.find((x) => x.id === id);
    if (p) p.views += 1;
    return next;
  });
}

export async function listStores(): Promise<Store[]> {
  return loadDb().stores;
}
export async function getStore(id: string): Promise<Store | null> {
  return loadDb().stores.find((s) => s.id === id) ?? null;
}

// ---------- cart ----------

export interface CartView {
  store: Store;
  lines: { product: Product; size: string; qty: number }[];
  itemsCents: number;
  shippingCents: number;
  totalCents: number;
}

export async function getCarts(): Promise<CartView[]> {
  const db = loadDb();
  const views: CartView[] = [];
  for (const [storeId, cart] of Object.entries(db.carts)) {
    const store = db.stores.find((s) => s.id === storeId);
    if (!store || cart.length === 0) continue;
    const lines = cart.flatMap((l) => {
      const product = db.products.find((p) => p.id === l.productId);
      return product ? [{ product, size: l.size, qty: l.qty }] : [];
    });
    const itemsCents = lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0);
    const shippingCents = SHIPPING_CENTS[parcelFor(lines.map((l) => l.product.category))];
    views.push({ store, lines, itemsCents, shippingCents, totalCents: itemsCents + shippingCents });
  }
  return views;
}

export async function addToCart(productId: string, size: string, qty = 1) {
  mutate((db) => addToCartLogic(db, productId, size, qty));
}
export async function setCartQty(storeId: string, productId: string, size: string, qty: number) {
  mutate((db) => setQtyLogic(db, storeId, productId, size, qty));
}
export async function removeFromCart(storeId: string, productId: string, size: string) {
  mutate((db) => removeFromCartLogic(db, storeId, productId, size));
}

// ---------- orders ----------

export async function createOrder(storeId: string, buyer: Buyer, delivery: Delivery): Promise<Order> {
  const lines = loadDb().carts[storeId] ?? [];
  const db = mutate((cur) => placeOrder(cur, { storeId, lines, buyer, delivery }, now()));
  return db.orders[db.orders.length - 1];
}

export async function getOrder(id: string): Promise<Order | null> {
  return loadDb().orders.find((o) => o.id === id) ?? null;
}

export async function listOrders(f: { storeId?: string; email?: string; status?: OrderStatus } = {}): Promise<Order[]> {
  return loadDb()
    .orders.filter(
      (o) =>
        (!f.storeId || o.storeId === f.storeId) &&
        (!f.email || o.buyer.email.toLowerCase() === f.email.toLowerCase()) &&
        (!f.status || o.status === f.status),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function completeOrder(id: string, trackingCode: string) {
  mutate((db) => completeOrderLogic(db, id, trackingCode, now()));
}
export async function cancelOrder(id: string, reason: string) {
  mutate((db) => cancelOrderLogic(db, id, reason, now()));
}
export async function requestReturn(id: string) {
  mutate((db) => requestReturnLogic(db, id));
}
export async function returnOrder(id: string) {
  mutate((db) => returnOrderLogic(db, id, now()));
}

// ---------- customer profile ----------

export async function getCustomer(email: string): Promise<User | null> {
  return loadDb().users.find((u) => u.role === "customer" && u.email === email) ?? null;
}

export async function updateCustomer(email: string, patch: { name: string; phone: string }) {
  mutate((db) => {
    const user = db.users.find((u) => u.role === "customer" && u.email === email);
    if (!user) throw new Error("Δεν βρέθηκε ο λογαριασμός");
    user.name = patch.name.trim() || undefined;
    user.phone = patch.phone.trim() || undefined;
    return db;
  });
}

// ---------- store panel ----------

export type ProductInput = Omit<Product, "id" | "createdAt" | "views" | "createdBy"> & { id?: string };

export async function getStoreProducts(storeId: string): Promise<ProductView[]> {
  const db = loadDb();
  return db.products
    .filter((p) => p.storeId === storeId)
    .map((p) => toView(db, p))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveProduct(input: ProductInput, createdBy: Product["createdBy"] = "store"): Promise<string> {
  let id = input.id ?? "";
  mutate((db) => {
    const next = structuredClone(db);
    const existing = input.id ? next.products.find((p) => p.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input);
    } else {
      id = nextId(next, "p");
      next.products.push({ ...input, id, createdAt: now(), views: 0, createdBy });
    }
    return next;
  });
  return id;
}

export async function setProductStatus(id: string, status: Product["status"]) {
  mutate((db) => {
    const next = structuredClone(db);
    const p = next.products.find((x) => x.id === id);
    if (p) p.status = status;
    return next;
  });
}

export async function deleteProduct(id: string) {
  mutate((db) => ({ ...db, products: db.products.filter((p) => p.id !== id) }));
}

export async function duplicateProduct(id: string): Promise<string> {
  let newId = "";
  mutate((db) => {
    const next = structuredClone(db);
    const src = next.products.find((p) => p.id === id);
    if (!src) return db;
    newId = nextId(next, "p");
    next.products.push({ ...structuredClone(src), id: newId, title: `${src.title} (αντίγραφο)`, status: "draft", createdAt: now(), views: 0 });
    return next;
  });
  return newId;
}

export async function getStoreStats(storeId: string, rangeDays: number | null) {
  const since = rangeDays === null ? "0000" : new Date(Date.now() - rangeDays * 86400000).toISOString();
  const db = loadDb();
  return { ...storeStats(db, storeId, since), balanceCents: storeBalance(db, storeId) };
}

export async function getStoreLedger(storeId: string): Promise<{ entries: LedgerEntry[]; balanceCents: number }> {
  const db = loadDb();
  return {
    entries: db.ledger.filter((e) => e.storeId === storeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    balanceCents: storeBalance(db, storeId),
  };
}

export async function listPayouts(storeId?: string): Promise<Payout[]> {
  return loadDb()
    .payouts.filter((p) => !storeId || p.storeId === storeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateStore(id: string, patch: Partial<Omit<Store, "id" | "createdAt">>) {
  mutate((db) => {
    const next = structuredClone(db);
    const s = next.stores.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
    return next;
  });
}

// ---------- registration and admin ----------

export interface StoreRegistration {
  ownerName: string;
  ownerEmail: string;
  name: string;
  afm: string;
  doy: string;
  address: string;
  phone: string;
  iban: string;
}

export async function registerStore(data: StoreRegistration): Promise<Store> {
  const email = data.ownerEmail.trim().toLowerCase();
  let created!: Store;
  mutate((db) => {
    const next = structuredClone(db);
    if (next.stores.some((s) => s.ownerEmail.toLowerCase() === email)) {
      throw new Error("Υπάρχει ήδη κατάστημα με αυτό το email");
    }
    created = { ...data, ownerEmail: email, id: nextId(next, "s"), commissionRate: DEFAULT_COMMISSION, status: "pending", createdAt: now() };
    next.stores.push(created);
    next.users.push({ email, name: data.ownerName, role: "store", storeId: created.id });
    return next;
  });
  return created;
}

/** Admin creates a store shell and invites the owner; the owner completes the details after login. */
export async function inviteStore(data: { name: string; afm: string; ownerEmail: string }): Promise<Store> {
  return registerStore({ ownerName: "", doy: "", address: "", phone: "", iban: "", ...data });
}

export async function approveStore(id: string) {
  await updateStore(id, { status: "approved" });
}
export async function suspendStore(id: string) {
  await updateStore(id, { status: "suspended" });
}

export async function createPayouts(cutoffISO: string): Promise<number> {
  const before = loadDb().payouts.length;
  const db = mutate((cur) =>
    cur.stores.filter((s) => s.status === "approved").reduce((acc, s) => createPayoutBatch(acc, s.id, cutoffISO, now()), cur),
  );
  return db.payouts.length - before;
}

export async function markPayoutPaid(id: string) {
  mutate((db) => markPayoutPaidLogic(db, id, now()));
}

export async function resetDemo() {
  resetDb();
}

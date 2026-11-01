import type { Buyer, CartLine, Db, Delivery, Order, OrderItem } from "../types";
import { SHIPPING_CENTS } from "./constants";
import { addEntry, nextId } from "./ledger";
import { calcCommission, parcelFor } from "./money";

export interface PlaceOrderInput {
  storeId: string;
  lines: CartLine[];
  buyer: Buyer;
  delivery: Delivery;
}

function findOrder(db: Db, orderId: string): Order {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Η παραγγελία δεν βρέθηκε");
  return order;
}

function restock(db: Db, order: Order) {
  for (const item of order.items) {
    const line = db.products.find((p) => p.id === item.productId)?.stock.find((s) => s.size === item.size);
    if (line) line.quantity += item.qty;
  }
}

function reverseLedger(db: Db, order: Order, now: string) {
  addEntry(db, { storeId: order.storeId, orderId: order.id, type: "refund", amountCents: -(order.itemsCents + order.shippingCents) }, now);
  addEntry(db, { storeId: order.storeId, orderId: order.id, type: "commission_reversal", amountCents: order.commissionCents }, now);
}

export function placeOrder(input: Db, { storeId, lines, buyer, delivery }: PlaceOrderInput, now: string): Db {
  const db = structuredClone(input);
  const store = db.stores.find((s) => s.id === storeId);
  if (!store || store.status !== "approved") throw new Error("Το κατάστημα δεν είναι διαθέσιμο");
  if (lines.length === 0) throw new Error("Το καλάθι είναι άδειο");

  const items: OrderItem[] = [];
  const categories: string[] = [];
  for (const line of lines) {
    const product = db.products.find((p) => p.id === line.productId);
    if (!product || product.storeId !== storeId || product.status !== "active") {
      throw new Error("Το προϊόν δεν είναι διαθέσιμο");
    }
    const stock = product.stock.find((s) => s.size === line.size);
    if (!stock || stock.quantity < line.qty || line.qty < 1) {
      throw new Error(`Δεν υπάρχει αρκετό απόθεμα για: ${product.title} (${line.size})`);
    }
    stock.quantity -= line.qty;
    items.push({ productId: product.id, title: product.title, size: line.size, qty: line.qty, unitPriceCents: product.priceCents });
    categories.push(product.category);
  }

  const itemsCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.qty, 0);
  const parcelSize = parcelFor(categories);
  const shippingCents = SHIPPING_CENTS[parcelSize];
  const commissionCents = calcCommission(itemsCents, store.commissionRate);
  const order: Order = {
    id: nextId(db, "o"),
    storeId,
    buyer,
    delivery,
    items,
    itemsCents,
    shippingCents,
    totalCents: itemsCents + shippingCents,
    parcelSize,
    commissionCents,
    status: "new",
    createdAt: now,
  };
  db.orders.push(order);
  addEntry(db, { storeId, orderId: order.id, type: "sale", amountCents: itemsCents + shippingCents }, now);
  addEntry(db, { storeId, orderId: order.id, type: "commission", amountCents: -commissionCents }, now);
  delete db.carts[storeId];
  return db;
}

export function cancelOrder(input: Db, orderId: string, reason: string, now: string): Db {
  const db = structuredClone(input);
  const order = findOrder(db, orderId);
  if (order.status !== "new" && order.status !== "preparing") {
    throw new Error("Η παραγγελία δεν μπορεί να ακυρωθεί σε αυτό το στάδιο");
  }
  restock(db, order);
  reverseLedger(db, order, now);
  order.status = "cancelled";
  order.cancelReason = reason;
  return db;
}

export function markPreparing(input: Db, orderId: string): Db {
  const db = structuredClone(input);
  const order = findOrder(db, orderId);
  if (order.status !== "new") throw new Error("Η παραγγελία δεν είναι νέα");
  order.status = "preparing";
  return db;
}

export function markShipped(input: Db, orderId: string, trackingCode: string): Db {
  const db = structuredClone(input);
  const order = findOrder(db, orderId);
  if (order.status !== "new" && order.status !== "preparing") throw new Error("Η παραγγελία δεν μπορεί να σταλεί");
  if (!trackingCode.trim()) throw new Error("Βάλε τον κωδικό παρακολούθησης");
  order.status = "shipped";
  order.trackingCode = trackingCode.trim();
  return db;
}

export function markDelivered(input: Db, orderId: string, now: string): Db {
  const db = structuredClone(input);
  const order = findOrder(db, orderId);
  if (order.status !== "shipped") throw new Error("Η παραγγελία δεν έχει σταλεί");
  order.status = "delivered";
  order.deliveredAt = now;
  return db;
}

export function requestReturn(input: Db, orderId: string): Db {
  const db = structuredClone(input);
  const order = findOrder(db, orderId);
  if (order.status !== "delivered") throw new Error("Η παραγγελία δεν έχει παραδοθεί");
  order.returnRequested = true;
  return db;
}

export function returnOrder(input: Db, orderId: string, now: string): Db {
  const db = structuredClone(input);
  const order = findOrder(db, orderId);
  if (order.status !== "delivered") throw new Error("Επιστροφή γίνεται μόνο σε παραδομένη παραγγελία");
  restock(db, order);
  reverseLedger(db, order, now);
  order.status = "returned";
  return db;
}

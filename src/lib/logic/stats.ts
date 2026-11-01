import type { Db } from "../types";
import { LOW_STOCK_THRESHOLD } from "./constants";

export interface StoreStats {
  orders: number;
  revenueCents: number; // items only
  netCents: number; // items + shipping - commission
  views: number;
  topProducts: { productId: string; title: string; qty: number }[];
  lowStock: { productId: string; title: string; size: string; quantity: number }[];
}

export function storeStats(db: Db, storeId: string, sinceISO: string): StoreStats {
  const orders = db.orders.filter(
    (o) => o.storeId === storeId && o.createdAt >= sinceISO && o.status !== "cancelled" && o.status !== "returned",
  );
  const qtyByProduct = new Map<string, { title: string; qty: number }>();
  for (const o of orders) {
    for (const i of o.items) {
      const cur = qtyByProduct.get(i.productId) ?? { title: i.title, qty: 0 };
      cur.qty += i.qty;
      qtyByProduct.set(i.productId, cur);
    }
  }
  const products = db.products.filter((p) => p.storeId === storeId);
  return {
    orders: orders.length,
    revenueCents: orders.reduce((s, o) => s + o.itemsCents, 0),
    netCents: orders.reduce((s, o) => s + o.itemsCents + o.shippingCents - o.commissionCents, 0),
    views: products.reduce((s, p) => s + p.views, 0),
    topProducts: [...qtyByProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5),
    lowStock: products
      .filter((p) => p.status !== "hidden")
      .flatMap((p) =>
        p.stock
          .filter((s) => s.quantity <= LOW_STOCK_THRESHOLD)
          .map((s) => ({ productId: p.id, title: p.title, size: s.size, quantity: s.quantity })),
      ),
  };
}

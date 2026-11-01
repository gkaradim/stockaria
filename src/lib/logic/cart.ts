import type { Db } from "../types";

function available(db: Db, productId: string, size: string) {
  const product = db.products.find((p) => p.id === productId);
  const quantity = product?.stock.find((s) => s.size === size)?.quantity ?? 0;
  return { product, quantity };
}

export function addToCart(input: Db, productId: string, size: string, qty: number): Db {
  const db = structuredClone(input);
  const { product, quantity } = available(db, productId, size);
  if (!product || quantity <= 0 || qty <= 0) return db;
  const cart = (db.carts[product.storeId] ??= []);
  const line = cart.find((l) => l.productId === productId && l.size === size);
  if (line) line.qty = Math.min(quantity, line.qty + qty);
  else cart.push({ productId, size, qty: Math.min(quantity, qty) });
  return db;
}

export function setQty(input: Db, storeId: string, productId: string, size: string, qty: number): Db {
  const db = structuredClone(input);
  const cart = db.carts[storeId] ?? [];
  const { quantity } = available(db, productId, size);
  const line = cart.find((l) => l.productId === productId && l.size === size);
  if (!line) return db;
  if (qty <= 0) db.carts[storeId] = cart.filter((l) => l !== line);
  else line.qty = Math.min(quantity, qty);
  if (db.carts[storeId]?.length === 0) delete db.carts[storeId];
  return db;
}

export function removeFromCart(db: Db, storeId: string, productId: string, size: string): Db {
  return setQty(db, storeId, productId, size, 0);
}

export function cartTotal(db: Db, storeId: string) {
  return (db.carts[storeId] ?? []).reduce((sum, l) => {
    const price = db.products.find((p) => p.id === l.productId)?.priceCents ?? 0;
    return sum + price * l.qty;
  }, 0);
}

export type StoreStatus = "pending" | "approved" | "suspended";
export type OrderStatus = "new" | "preparing" | "shipped" | "delivered" | "cancelled" | "returned";
export type ParcelSize = "S" | "M" | "L";
export type LedgerType = "sale" | "commission" | "refund" | "commission_reversal" | "payout";

export interface Store {
  id: string;
  name: string;
  afm: string;
  doy: string;
  address: string;
  phone: string;
  iban: string;
  ownerName: string;
  ownerEmail: string;
  commissionRate: number; // 0.12 = 12%
  status: StoreStatus;
  createdAt: string;
}

export interface StockLine {
  size: string;
  quantity: number;
}

export interface Product {
  id: string;
  storeId: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  priceCents: number;
  originalPriceCents?: number;
  stock: StockLine[];
  status: "draft" | "active" | "hidden";
  createdBy: "store" | "platform";
  createdAt: string;
  views: number;
}

export interface CartLine {
  productId: string;
  size: string;
  qty: number;
}
export type Carts = Record<string, CartLine[]>; // key = storeId

export interface OrderItem {
  productId: string;
  title: string;
  size: string;
  qty: number;
  unitPriceCents: number;
}
export interface Buyer {
  name: string;
  email: string;
  phone: string;
}
export interface Delivery {
  type: "locker" | "address";
  text: string;
}

export interface Order {
  id: string;
  storeId: string;
  buyer: Buyer;
  delivery: Delivery;
  items: OrderItem[];
  itemsCents: number;
  shippingCents: number;
  totalCents: number;
  parcelSize: ParcelSize;
  commissionCents: number;
  status: OrderStatus;
  trackingCode?: string;
  cancelReason?: string;
  returnRequested?: boolean;
  createdAt: string;
  deliveredAt?: string;
}

export interface LedgerEntry {
  id: string;
  storeId: string;
  orderId?: string;
  type: LedgerType;
  amountCents: number; // positive = owed to the store, negative = deducted
  createdAt: string;
  payoutId?: string;
}

export interface Payout {
  id: string;
  storeId: string;
  totalCents: number;
  cutoff: string;
  status: "pending" | "paid";
  createdAt: string;
  paidAt?: string;
}

export interface User {
  email: string;
  name?: string;
  phone?: string;
  role: "customer" | "store" | "admin";
  storeId?: string;
}

export interface Db {
  stores: Store[];
  products: Product[];
  orders: Order[];
  ledger: LedgerEntry[];
  payouts: Payout[];
  users: User[];
  carts: Carts;
  seq: number;
}

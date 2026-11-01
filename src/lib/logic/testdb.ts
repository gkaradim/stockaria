import type { Db } from "../types";
import { emptyDb } from "./empty";

export function testDb(): Db {
  const db = emptyDb();
  db.stores.push({
    id: "s1",
    name: "Test Store",
    afm: "000000000",
    doy: "Α' Αθηνών",
    address: "Ερμού 1",
    phone: "2100000000",
    iban: "GR00",
    ownerName: "Ιδιοκτήτης",
    ownerEmail: "o@test.gr",
    commissionRate: 0.1,
    status: "approved",
    createdAt: "2026-01-01T00:00:00Z",
  });
  db.products.push({
    id: "p1",
    storeId: "s1",
    title: "Μπλούζα",
    description: "",
    category: "Γυναικεία ρούχα",
    images: [],
    priceCents: 2000,
    stock: [{ size: "M", quantity: 2 }],
    status: "active",
    createdBy: "store",
    createdAt: "2026-01-01T00:00:00Z",
    views: 0,
  });
  return db;
}

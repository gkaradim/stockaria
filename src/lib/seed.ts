import type { Db, Product, Store } from "./types";
import { DEFAULT_COMMISSION } from "./logic/constants";
import { emptyDb } from "./logic/empty";
import { markDelivered, markShipped, placeOrder } from "./logic/orders";

const COLORS = ["#c9d6df", "#e8d5c4", "#d4e0c7", "#e5cfd8", "#d9d4ec", "#f0e2b6", "#bfd8d5", "#e9c9c0"];

/** Plain colored placeholder so the prototype needs no external images. */
export function placeholderSvg(index: number, label: string) {
  const bg = COLORS[index % COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/><circle cx="200" cy="210" r="90" fill="rgba(255,255,255,0.45)"/><text x="200" y="240" font-family="Arial,sans-serif" font-size="96" text-anchor="middle" fill="rgba(0,0,0,0.35)">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const store = (id: string, name: string, afm: string, address: string, owner: string, email: string, status: Store["status"], createdAt: string): Store => ({
  id, name, afm, doy: "Δ.Ο.Υ. Δοκιμαστική", address, phone: "2310000000", iban: "GR1601101250000000012300695",
  ownerName: owner, ownerEmail: email, commissionRate: DEFAULT_COMMISSION, status, createdAt,
});

type P = [string, string, string, number, number | undefined, [string, number][]];
// title, description, category, price, original price (cents), stock [size, qty]
const WOMEN: P[] = [
  ["Φόρεμα μίντι λουλουδάτο", "Ελαφρύ φόρεμα με λουλουδάτο μοτίβο.", "Γυναικεία ρούχα", 4900, 8900, [["S", 2], ["M", 3], ["L", 1]]],
  ["Πουκάμισο λινό", "Λινό πουκάμισο, άνετη γραμμή.", "Γυναικεία ρούχα", 3200, 5500, [["S", 1], ["M", 2], ["L", 2]]],
  ["Τζιν ψηλόμεσο", "Ψηλόμεσο τζιν, ίσια γραμμή.", "Γυναικεία ρούχα", 3900, 6900, [["S", 3], ["M", 4]]],
  ["Μπλούζα βαμβακερή", "Βασική μπλούζα από οργανικό βαμβάκι.", "Γυναικεία ρούχα", 1500, 2900, [["XS", 2], ["S", 2], ["M", 2], ["L", 1]]],
  ["Πλεκτό πουλόβερ", "Μαλακό πλεκτό για τον χειμώνα.", "Γυναικεία ρούχα", 3500, 6500, [["S", 2], ["M", 1]]],
  ["Σακάκι ταγιέρ", "Κλασικό σακάκι με φόδρα.", "Γυναικεία ρούχα", 5900, 11900, [["S", 1], ["M", 1], ["L", 1]]],
];
const SHOES: P[] = [
  ["Sneakers λευκά", "Δερμάτινα sneakers, λευκή σόλα.", "Παπούτσια", 5500, 9500, [["38", 2], ["39", 3], ["40", 2], ["41", 1]]],
  ["Μποτάκια δερμάτινα", "Χειροποίητα μποτάκια από δέρμα.", "Παπούτσια", 7900, 14900, [["37", 1], ["38", 2], ["39", 1]]],
  ["Μοκασίνια", "Άνετα μοκασίνια καθημερινής χρήσης.", "Παπούτσια", 4500, 7900, [["41", 2], ["42", 3], ["43", 2]]],
  ["Σανδάλια", "Δερμάτινα σανδάλια με ανατομικό πάτο.", "Παπούτσια", 2900, 5500, [["36", 1], ["37", 2], ["38", 2], ["39", 1]]],
  ["Αθλητικά running", "Ελαφριά αθλητικά για τρέξιμο.", "Παπούτσια", 6500, 11900, [["40", 2], ["41", 2], ["42", 2], ["43", 1]]],
  ["Loafers καφέ", "Δερμάτινα loafers σε ζεστό καφέ.", "Παπούτσια", 5900, 9900, [["42", 1], ["43", 2], ["44", 1]]],
];
const MEN: P[] = [
  ["Πουκάμισο oxford", "Βαμβακερό oxford, κανονική γραμμή.", "Ανδρικά ρούχα", 2900, 4900, [["M", 3], ["L", 3], ["XL", 1]]],
  ["Chinos", "Chinos από ελαστικό βαμβάκι.", "Ανδρικά ρούχα", 3500, 5900, [["M", 2], ["L", 2], ["XL", 2]]],
  ["Μπουφάν bomber", "Ελαφρύ bomber για την εποχή.", "Ανδρικά ρούχα", 6900, 12900, [["M", 1], ["L", 2]]],
  ["Polo", "Κλασικό polo piqué.", "Ανδρικά ρούχα", 1900, 3500, [["S", 2], ["M", 3], ["L", 3], ["XL", 1]]],
  ["Παλτό μάλλινο", "Μάλλινο παλτό με διπλό κούμπωμα.", "Ανδρικά ρούχα", 11900, 22900, [["M", 1], ["L", 1]]],
  ["Τζιν slim", "Τζιν slim fit, σκούρο μπλε.", "Ανδρικά ρούχα", 3900, 6900, [["M", 2], ["L", 3], ["XL", 1]]],
];

const LETTER: Record<string, string> = { "Γυναικεία ρούχα": "Γ", "Ανδρικά ρούχα": "Α", "Παιδικά ρούχα": "Π", "Παπούτσια": "Π", "Αξεσουάρ": "Α" };

/** `nowISO` makes the seed deterministic for tests. Historical orders go through the real order logic. */
export function seedDb(nowISO = new Date().toISOString()): Db {
  const db = emptyDb();
  const day = 86400000;
  const ago = (d: number) => new Date(new Date(nowISO).getTime() - d * day).toISOString();

  db.stores.push(
    store("s1", "Boutique Ελένη", "100000001", "Τσιμισκή 10, Θεσσαλονίκη", "Ελένη Δ.", "eleni@example.gr", "approved", ago(60)),
    store("s2", "Παπούτσια Νίκος", "100000002", "Κορίνθου 5, Πάτρα", "Νίκος Π.", "nikos@example.gr", "approved", ago(55)),
    store("s3", "Menswear Κώστας", "100000003", "Ερμού 22, Αθήνα", "Κώστας Μ.", "kostas@example.gr", "approved", ago(40)),
    store("s4", "Παιδικά Μαρία", "100000004", "Μιαούλη 3, Βόλος", "Μαρία Κ.", "maria@example.gr", "pending", ago(2)),
  );

  let n = 0;
  const addProducts = (storeId: string, list: P[]) => {
    for (const [title, description, category, priceCents, originalPriceCents, stock] of list) {
      n += 1;
      const product: Product = {
        id: `p${n}`, storeId, title, description, category,
        images: [placeholderSvg(n, LETTER[category] ?? "S")],
        priceCents, originalPriceCents,
        stock: stock.map(([size, quantity]) => ({ size, quantity })),
        status: "active", createdBy: "store", createdAt: ago(30 - n), views: 10 + ((n * 7) % 40),
      };
      db.products.push(product);
    }
  };
  addProducts("s1", WOMEN);
  addProducts("s2", SHOES);
  addProducts("s3", MEN);

  db.users.push({ email: "admin@stockaria.gr", name: "Διαχειριστής", role: "admin" });
  for (const s of db.stores) db.users.push({ email: s.ownerEmail, name: s.ownerName, role: "store", storeId: s.id });

  // Past delivered orders so dashboards have data on first load, then one fresh order per store.
  let working = db;
  const buyer = (i: number) => ({ name: `Πελάτης ${i}`, email: `pelatis${i}@example.gr`, phone: "6900000000" });
  // One demo customer who bought from every store, so the customer account has orders to show.
  const maria = { name: "Μαρία Παπαδοπούλου", email: "maria@example.gr", phone: "6900000000" };
  const delivery = { type: "locker" as const, text: "Box Now, Σύνταγμα" };
  let b = 0;
  for (const storeId of ["s1", "s2", "s3"]) {
    const products = working.products.filter((p) => p.storeId === storeId);
    [22, 15, 9].forEach((d, k) => {
      const product = products[k];
      const size = product.stock[0].size;
      b += 1;
      working = placeOrder(working, { storeId, lines: [{ productId: product.id, size, qty: 1 }], buyer: k === 0 ? maria : buyer(b), delivery }, ago(d));
      const id = working.orders[working.orders.length - 1].id;
      working = markDelivered(markShipped(working, id, `BX${1000 + b}`), id, ago(d - 3));
    });
    const fresh = products[3];
    b += 1;
    working = placeOrder(working, { storeId, lines: [{ productId: fresh.id, size: fresh.stock[0].size, qty: 1 }], buyer: storeId === "s3" ? buyer(b) : maria, delivery }, ago(0.05));
  }
  return working;
}

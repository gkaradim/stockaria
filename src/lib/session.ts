import { loadDb, saveDb } from "./storage";
import type { User } from "./types";

// Simulated email-link login for the prototype: no email is sent, the link is "opened" by a button.

export interface Session {
  email: string;
  role: User["role"];
  storeId?: string;
  /** Set when the admin is managing a store on its behalf. */
  actingStoreId?: string;
}

const KEY = "stockaria.session";
export const SESSION_EVENT = "stockaria:session";
export const ADMIN_EMAIL = "admin@stockaria.gr";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function consumeLink(rawEmail: string, role: User["role"]): Session {
  const email = rawEmail.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Βάλε ένα έγκυρο email");
  const db = loadDb();
  let session: Session;
  if (role === "admin") {
    if (email !== ADMIN_EMAIL) throw new Error("Αυτό το email δεν έχει πρόσβαση διαχειριστή");
    session = { email, role };
  } else if (role === "store") {
    const store = db.stores.find((s) => s.ownerEmail.toLowerCase() === email);
    if (!store) throw new Error("Δεν βρέθηκε κατάστημα με αυτό το email");
    session = { email, role, storeId: store.id };
  } else {
    if (!db.users.some((u) => u.email === email && u.role === "customer")) {
      db.users.push({ email, role: "customer" });
      saveDb(db);
    }
    session = { email, role };
  }
  setSession(session);
  return session;
}

export function logout() {
  setSession(null);
}

export function actAsStore(storeId: string | null) {
  const cur = getSession();
  if (!cur || cur.role !== "admin") return;
  setSession({ ...cur, actingStoreId: storeId ?? undefined });
}

export const effectiveStoreId = (s: Session | null) => s?.actingStoreId ?? s?.storeId;

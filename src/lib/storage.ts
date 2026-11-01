import type { Db } from "./types";
import { seedDb } from "./seed";

const KEY = "stockaria.v1";
export const CHANGE_EVENT = "stockaria:change";
export const QUOTA_EVENT = "stockaria:quota";

const hasWindow = () => typeof window !== "undefined";

/** Older saved data used the steps preparing/shipped/delivered, which no longer exist. */
function migrate(db: Db): Db {
  for (const o of db.orders as (Db["orders"][number] & { deliveredAt?: string })[]) {
    const status = o.status as string;
    if (status === "preparing") o.status = "new";
    else if (status === "shipped" || status === "delivered") {
      o.status = "completed";
      o.completedAt = o.completedAt ?? o.deliveredAt ?? o.createdAt;
    }
    delete o.deliveredAt;
  }
  return db;
}

export function loadDb(): Db {
  if (!hasWindow()) return seedDb();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw) as Db);
  } catch {
    /* fall through to a fresh seed */
  }
  const seeded = seedDb();
  saveDb(seeded);
  return seeded;
}

export function saveDb(db: Db) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    window.dispatchEvent(new Event(QUOTA_EVENT));
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resetDb() {
  saveDb(seedDb());
}

export function subscribe(cb: () => void) {
  if (!hasWindow()) return () => {};
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { getStore, getStoreStats, listOrders } from "@/lib/api";
import { useApi, useStoreId } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { Empty, Loading, StatCard, StatusBadge } from "@/components/ui";

const RANGES: { label: string; days: number | null }[] = [
  { label: "7 ημέρες", days: 7 },
  { label: "30 ημέρες", days: 30 },
  { label: "Όλες", days: null },
];

export default function Dashboard() {
  const { storeId } = useStoreId();
  const [range, setRange] = useState<number | null>(30);
  const { data: store } = useApi(() => getStore(storeId), [storeId]);
  const { data: stats, loading } = useApi(() => getStoreStats(storeId, range), [storeId, range]);
  const { data: fresh } = useApi(() => listOrders({ storeId, status: "new" }), [storeId]);

  return (
    <div className="page">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{store?.name ?? "Πίνακας"}</h1>
          <p className="text-sm text-muted">Πωλήσεις και απόθεμα του καταστήματός σου</p>
        </div>
        <Link href="/store/products/new/" className="btn btn-primary">+ Νέο προϊόν</Link>
      </div>

      {fresh && fresh.length > 0 && (
        <Link href="/store/orders/" className="mb-5 flex items-center justify-between rounded-2xl bg-warn-soft p-4 font-semibold text-amber-950">
          <span>Έχεις {fresh.length} {fresh.length === 1 ? "νέα παραγγελία" : "νέες παραγγελίες"} που περιμένουν</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <div className="mb-4 flex gap-2">
        {RANGES.map((r) => (
          <button key={r.label} className="chip" aria-pressed={range === r.days} onClick={() => setRange(r.days)}>{r.label}</button>
        ))}
      </div>

      {loading || !stats ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Παραγγελίες" value={String(stats.orders)} />
            <StatCard label="Τζίρος προϊόντων" value={formatEUR(stats.revenueCents)} />
            <StatCard label="Καθαρά έσοδα" value={formatEUR(stats.netCents)} hint="μετά την προμήθεια, με τα μεταφορικά" />
            <StatCard label="Προβολές προϊόντων" value={String(stats.views)} />
          </div>

          <div className="mt-3 card flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <div className="text-sm text-muted">Ποσό που σου οφείλεται (δεν έχει πληρωθεί ακόμα)</div>
              <div className="text-2xl font-bold">{formatEUR(stats.balanceCents)}</div>
            </div>
            <Link href="/store/payouts/" className="btn btn-outline btn-sm">Δες πληρωμές</Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="h2 mb-2">Προϊόντα που πουλάνε περισσότερο</h2>
              {stats.topProducts.length === 0 ? (
                <Empty>Δεν υπάρχουν πωλήσεις σε αυτή την περίοδο.</Empty>
              ) : (
                <ul className="card divide-y divide-line">
                  {stats.topProducts.map((p) => (
                    <li key={p.productId} className="flex justify-between gap-3 p-3 text-sm">
                      <span className="min-w-0 truncate">{p.title}</span>
                      <span className="shrink-0 font-semibold">{p.qty} τεμ.</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="h2 mb-2">Χαμηλό απόθεμα</h2>
              {stats.lowStock.length === 0 ? (
                <Empty>Όλα τα μεγέθη έχουν επαρκές απόθεμα.</Empty>
              ) : (
                <ul className="card divide-y divide-line">
                  {stats.lowStock.slice(0, 8).map((p) => (
                    <li key={`${p.productId}-${p.size}`} className="flex justify-between gap-3 p-3 text-sm">
                      <span className="min-w-0 truncate">{p.title} ({p.size})</span>
                      <span className={`shrink-0 font-semibold ${p.quantity === 0 ? "text-danger" : ""}`}>{p.quantity === 0 ? "Εξαντλήθηκε" : `${p.quantity} τεμ.`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <RecentOrders storeId={storeId} />
        </>
      )}
    </div>
  );
}

function RecentOrders({ storeId }: { storeId: string }) {
  const { data: orders } = useApi(() => listOrders({ storeId }), [storeId]);
  if (!orders || orders.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="h2 mb-2">Πρόσφατες παραγγελίες</h2>
      <ul className="card divide-y divide-line">
        {orders.slice(0, 5).map((o) => (
          <li key={o.id}>
            <Link href={`/store/order/?id=${o.id}`} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span>{o.id} · {o.buyer.name}</span>
              <span className="flex items-center gap-3"><span className="font-semibold">{formatEUR(o.totalCents)}</span><StatusBadge status={o.status} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

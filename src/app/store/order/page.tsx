"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cancelOrder, completeOrder, getOrder, returnOrder } from "@/lib/api";
import { useApi, useStoreId } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { Empty, ErrorNote, Loading, StatusBadge } from "@/components/ui";

function OrderDetail() {
  const id = useSearchParams().get("id") ?? "";
  const { storeId } = useStoreId();
  const { data: order, loading } = useApi(() => getOrder(id), [id]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (loading) return <Loading />;
  if (!order || order.storeId !== storeId) return <div className="page"><Empty>Δεν βρέθηκε η παραγγελία.</Empty></div>;

  const run = async (fn: () => Promise<void>) => {
    setError("");
    try { await fn(); } catch (e) { setError((e as Error).message); }
  };
  const net = order.itemsCents + order.shippingCents - order.commissionCents;

  return (
    <div className="page max-w-2xl">
      <Link href="/store/orders/" className="text-sm text-muted underline">← Παραγγελίες</Link>
      <div className="mb-1 mt-2 flex items-center gap-3">
        <h1 className="h1">Παραγγελία {order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mb-5 text-sm text-muted">{new Date(order.createdAt).toLocaleString("el-GR")}</p>

      <section className="mb-5 card space-y-3 p-4">
        {order.status === "new" && (
          <div>
            <label className="label" htmlFor="code">Κωδικός παρακολούθησης (προαιρετικός)</label>
            <input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="π.χ. BX123456" />
            <p className="mt-1 text-xs text-muted">Αν βάλεις κωδικό, θα εμφανιστεί στον πελάτη στο email ολοκλήρωσης. Αλλιώς δεν θα φαίνεται.</p>
          </div>
        )}
        {order.trackingCode && order.status !== "new" && <div className="text-sm">Κωδικός παρακολούθησης: <strong>{order.trackingCode}</strong></div>}
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="btn btn-primary"
            disabled={order.status !== "new"}
            onClick={() => run(() => completeOrder(order.id, code))}
          >
            {order.status === "completed" || order.status === "returned" ? "Ολοκληρωμένη" : "Ολοκλήρωση"}
          </button>
          <button
            className="btn btn-danger"
            disabled={order.status !== "new"}
            onClick={() => { if (confirm("Η παραγγελία θα ακυρωθεί και ο πελάτης θα πάρει πίσω τα χρήματα. Να συνεχίσω;")) run(() => cancelOrder(order.id, "Ακυρώθηκε από το κατάστημα")); }}
          >
            {order.status === "cancelled" ? "Ακυρώθηκε" : "Ακύρωση"}
          </button>
        </div>
        {(order.status === "completed" || order.status === "returned") && (
          <button
            className="btn btn-outline w-full"
            disabled={order.status === "returned"}
            onClick={() => { if (confirm("Το προϊόν επέστρεψε; Η παραγγελία θα σημειωθεί ως επιστραφείσα και ο πελάτης θα πάρει πίσω τα χρήματα.")) run(() => returnOrder(order.id)); }}
          >
            {order.status === "returned" ? "Επιστράφηκε" : "Επιστράφηκε το προϊόν"}
          </button>
        )}
        {order.status === "completed" && order.returnRequested && <p className="rounded-xl bg-warn-soft p-3 text-sm font-semibold">Ο πελάτης ζήτησε επιστροφή.</p>}
      </section>
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      <section className="card divide-y divide-line">
        {order.items.map((i) => (
          <div key={`${i.productId}-${i.size}`} className="flex justify-between gap-3 p-4 text-sm"><span>{i.qty} × {i.title} ({i.size})</span><span className="font-semibold">{formatEUR(i.unitPriceCents * i.qty)}</span></div>
        ))}
        <div className="flex justify-between p-4 text-sm"><span>Μεταφορικά που πλήρωσε ο πελάτης</span><span>{formatEUR(order.shippingCents)}</span></div>
        <div className="flex justify-between p-4 text-sm"><span>Προμήθεια πλατφόρμας</span><span>−{formatEUR(order.commissionCents)}</span></div>
        <div className="flex justify-between p-4 text-base font-bold"><span>Ποσό για σένα</span><span>{formatEUR(net)}</span></div>
      </section>

      <section className="mt-5 card p-4 text-sm">
        <div className="font-semibold">Πελάτης και παράδοση</div>
        <div>{order.buyer.name} · {order.buyer.phone} · {order.buyer.email}</div>
        <div className="text-muted">{order.delivery.type === "locker" ? "Θυρίδα Box Now" : "Διεύθυνση"}: {order.delivery.text}</div>
        <div className="text-muted">Μέγεθος δέματος: {order.parcelSize}</div>
      </section>
      <p className="mt-4 text-xs text-muted">Το παραστατικό προς τον πελάτη το εκδίδεις εσύ από το δικό σου σύστημα.</p>
    </div>
  );
}

export default function StoreOrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderDetail />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cancelOrder, getOrder, markDelivered, markPreparing, markShipped, returnOrder } from "@/lib/api";
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

      {(order.status === "new" || order.status === "preparing") && (
        <section className="mb-5 card space-y-3 p-4">
          <div className="font-bold">Τι να κάνεις</div>
          {order.status === "new" && (
            <button className="btn btn-outline w-full" onClick={() => run(() => markPreparing(order.id))}>Το ετοιμάζω</button>
          )}
          <div>
            <label className="label" htmlFor="code">Κωδικός παρακολούθησης (Box Now ή courier)</label>
            <div className="flex gap-2">
              <input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="π.χ. BX123456" />
              <button className="btn btn-primary shrink-0" onClick={() => run(() => markShipped(order.id, code))}>Στάλθηκε</button>
            </div>
          </div>
          <button
            className="btn btn-sm text-danger"
            onClick={() => { if (confirm("Δεν υπάρχει το προϊόν; Η παραγγελία θα ακυρωθεί και ο πελάτης θα πάρει πίσω τα χρήματα.")) run(() => cancelOrder(order.id, "Το προϊόν δεν είναι πλέον διαθέσιμο")); }}
          >
            Δεν υπάρχει το προϊόν (ακύρωση και επιστροφή χρημάτων)
          </button>
        </section>
      )}
      {order.status === "shipped" && (
        <section className="mb-5 card space-y-2 p-4">
          <div>Κωδικός: <strong>{order.trackingCode}</strong></div>
          <button className="btn btn-primary w-full" onClick={() => run(() => markDelivered(order.id))}>Σημείωση ως παραδομένο</button>
        </section>
      )}
      {order.status === "delivered" && order.returnRequested && (
        <section className="mb-5 card space-y-2 bg-warn-soft p-4">
          <div className="font-semibold">Ο πελάτης ζήτησε επιστροφή</div>
          <button className="btn btn-primary w-full" onClick={() => run(() => returnOrder(order.id))}>Επιβεβαίωση επιστροφής (το προϊόν επέστρεψε)</button>
        </section>
      )}
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

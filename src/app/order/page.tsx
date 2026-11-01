"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getOrder, getStore, requestReturn } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { Empty, ErrorNote, Loading, StatusBadge } from "@/components/ui";

function OrderTracking() {
  const id = useSearchParams().get("id") ?? "";
  const { data: order, loading } = useApi(() => getOrder(id), [id]);
  const { data: store } = useApi(() => (order ? getStore(order.storeId) : Promise.resolve(null)), [order?.storeId]);
  const [error, setError] = useState("");
  const [nowMs] = useState(() => Date.now());

  if (loading) return <Loading />;
  if (!order) return <div className="page"><Empty>Δεν βρέθηκε η παραγγελία.</Empty></div>;

  const daysSince = order.completedAt ? (nowMs - new Date(order.completedAt).getTime()) / 86400000 : 0;
  const canReturn = order.status === "completed" && daysSince <= 14 && !order.returnRequested;

  return (
    <div className="page max-w-2xl">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="h1">Παραγγελία {order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mb-5 text-sm text-muted">Από {store?.name ?? "..."} · {new Date(order.createdAt).toLocaleDateString("el-GR")}</p>

      {order.status === "cancelled" ? (
        <p className="mb-5 rounded-xl bg-danger-soft p-3 text-sm text-danger">Η παραγγελία ακυρώθηκε{order.cancelReason ? `: ${order.cancelReason}` : ""}. Θα γίνει επιστροφή των χρημάτων.</p>
      ) : order.status === "returned" ? (
        <p className="mb-5 rounded-xl bg-stone-100 p-3 text-sm">Η επιστροφή ολοκληρώθηκε. Τα χρήματα επιστρέφονται.</p>
      ) : null}

      {order.trackingCode && (
        <div className="mb-5 card p-4 text-sm">
          Κωδικός παρακολούθησης: <strong className="text-base">{order.trackingCode}</strong>
        </div>
      )}

      <section className="card divide-y divide-line">
        {order.items.map((i) => (
          <div key={`${i.productId}-${i.size}`} className="flex justify-between gap-3 p-4 text-sm">
            <span>{i.qty} × {i.title} ({i.size})</span>
            <span className="font-semibold">{formatEUR(i.unitPriceCents * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between p-4 text-sm"><span>Μεταφορικά (δέμα {order.parcelSize})</span><span>{formatEUR(order.shippingCents)}</span></div>
        <div className="flex justify-between p-4 text-base font-bold"><span>Σύνολο</span><span>{formatEUR(order.totalCents)}</span></div>
      </section>

      <section className="mt-5 card p-4 text-sm">
        <div className="font-semibold">Παράδοση</div>
        <div className="text-muted">{order.delivery.type === "locker" ? "Θυρίδα Box Now" : "Διεύθυνση"}: {order.delivery.text}</div>
        <div className="mt-2 text-muted">{order.buyer.name} · {order.buyer.email}</div>
      </section>

      <div className="mt-5 space-y-2">
        {order.returnRequested && <p className="rounded-xl bg-warn-soft p-3 text-sm">Το αίτημα επιστροφής στάλθηκε στο κατάστημα. Επέστρεψε το προϊόν αχρησιμοποίητο, με τις ετικέτες. Σε αλλαγή γνώμης τα έξοδα επιστροφής επιβαρύνουν τον αγοραστή.</p>}
        {canReturn && (
          <button className="btn btn-outline" onClick={async () => { try { await requestReturn(order.id); } catch (e) { setError((e as Error).message); } }}>
            Αίτημα επιστροφής
          </button>
        )}
        {error && <ErrorNote message={error} />}
        <div><Link href="/" className="btn btn-outline">Συνέχεια αγορών</Link></div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderTracking />
    </Suspense>
  );
}

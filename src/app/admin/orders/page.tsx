"use client";

import { listOrders, listStores } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { Empty, Loading, StatusBadge } from "@/components/ui";

export default function AdminOrders() {
  const { data: orders, loading } = useApi(() => listOrders());
  const { data: stores } = useApi(listStores);
  if (loading || !orders) return <Loading />;
  const name = (id: string) => stores?.find((s) => s.id === id)?.name ?? id;
  const gmv = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");

  return (
    <div className="page">
      <h1 className="h1 mb-1">Παραγγελίες</h1>
      <p className="mb-5 text-sm text-muted">
        {gmv.length} ενεργές παραγγελίες · προμήθεια πλατφόρμας {formatEUR(gmv.reduce((s, o) => s + o.commissionCents, 0))}
      </p>
      {orders.length === 0 ? (
        <Empty>Δεν υπάρχουν παραγγελίες.</Empty>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div>
                <div className="font-semibold">{o.id} · {name(o.storeId)}</div>
                <div className="text-muted">{new Date(o.createdAt).toLocaleDateString("el-GR")} · {o.buyer.name}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatEUR(o.totalCents)} <span className="font-normal text-muted">(προμήθεια {formatEUR(o.commissionCents)})</span></div>
                <StatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

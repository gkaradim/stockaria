"use client";

import { useState } from "react";
import Link from "next/link";
import { listOrders } from "@/lib/api";
import { useApi, useStoreId } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import type { OrderStatus } from "@/lib/types";
import { Empty, Loading, StatusBadge, statusLabel } from "@/components/ui";

const FILTERS: (OrderStatus | "")[] = ["", "new", "preparing", "shipped", "delivered", "cancelled", "returned"];

export default function StoreOrders() {
  const { storeId } = useStoreId();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const { data: orders, loading } = useApi(() => listOrders({ storeId, status: status || undefined }), [storeId, status]);

  return (
    <div className="page">
      <h1 className="h1 mb-4">Παραγγελίες</h1>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {FILTERS.map((f) => (
          <button key={f || "all"} className="chip shrink-0" aria-pressed={status === f} onClick={() => setStatus(f)}>{f ? statusLabel(f) : "Όλες"}</button>
        ))}
      </div>
      {loading ? (
        <Loading />
      ) : !orders || orders.length === 0 ? (
        <Empty>Δεν υπάρχουν παραγγελίες.</Empty>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/store/order/?id=${o.id}`} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-semibold">{o.id} · {o.buyer.name}</div>
                  <div className="truncate text-sm text-muted">{new Date(o.createdAt).toLocaleDateString("el-GR")} · {o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold">{formatEUR(o.totalCents)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

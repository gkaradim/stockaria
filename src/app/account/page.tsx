"use client";

import Link from "next/link";
import { listOrders } from "@/lib/api";
import { useApi, useSession } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { CustomerGate } from "@/components/Gates";
import { Empty, Loading, StatusBadge } from "@/components/ui";

function Orders() {
  const session = useSession();
  const email = session?.email ?? "";
  const { data: orders, loading } = useApi(() => listOrders({ email }), [email]);

  return (
    <div className="page max-w-2xl">
      <h1 className="h1 mb-1">Οι παραγγελίες μου</h1>
      <p className="mb-5 text-sm text-muted">{email}</p>
      {loading ? (
        <Loading />
      ) : orders && orders.length > 0 ? (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/order/?id=${o.id}`} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold">Παραγγελία {o.id}</div>
                  <div className="text-sm text-muted">{new Date(o.createdAt).toLocaleDateString("el-GR")} · {o.items.length} προϊόντα · {formatEUR(o.totalCents)}</div>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Δεν έχεις παραγγελίες ακόμα με αυτό το email.</Empty>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <CustomerGate>
      <Orders />
    </CustomerGate>
  );
}

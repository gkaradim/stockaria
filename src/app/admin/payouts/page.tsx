"use client";

import { useState } from "react";
import { createPayouts, listPayouts, listStores, markPayoutPaid } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import ScrollRows from "@/components/ScrollRows";
import { Empty, Loading } from "@/components/ui";

export default function AdminPayouts() {
  const { data: payouts, loading } = useApi(() => listPayouts());
  const { data: stores } = useApi(listStores);
  const [cutoff, setCutoff] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");

  if (loading || !payouts) return <Loading />;
  const store = (id: string) => stores?.find((s) => s.id === id);

  return (
    <div className="page">
      <h1 className="h1 mb-1">Πληρωμές καταστημάτων</h1>
      <p className="mb-5 text-sm text-muted">Κάθε 15 ημέρες: διάλεξε ημερομηνία κοπής, δημιούργησε τις πληρωμές, κάνε τις μεταφορές στα IBAN και σημείωσέ τις ως πληρωμένες.</p>

      <div className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label" htmlFor="cutoff">Παραδόσεις έως</label>
          <input id="cutoff" type="date" className="input" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
        </div>
        <button
          className="btn btn-primary"
          onClick={async () => {
            const created = await createPayouts(`${cutoff}T23:59:59.999Z`);
            setMessage(created > 0 ? `Δημιουργήθηκαν ${created} πληρωμές.` : "Δεν υπάρχει κάτι προς πληρωμή με αυτή την ημερομηνία.");
          }}
        >
          Δημιουργία πληρωμών
        </button>
        {message && <span className="text-sm font-semibold text-accent">{message}</span>}
      </div>

      {payouts.length === 0 ? (
        <Empty>Δεν έχουν δημιουργηθεί πληρωμές.</Empty>
      ) : (
        <ScrollRows className="space-y-3">
          {payouts.map((p) => (
            <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <div className="text-base font-bold">{store(p.storeId)?.name ?? p.storeId} · {formatEUR(p.totalCents)}</div>
                <div className="text-muted">IBAN {store(p.storeId)?.iban || "λείπει"} · {new Date(p.createdAt).toLocaleDateString("el-GR")}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(store(p.storeId)?.iban ?? "")}>Αντιγραφή IBAN</button>
                {p.status === "paid" ? (
                  <span className="font-semibold text-accent">Πληρώθηκε</span>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => markPayoutPaid(p.id)}>Σημείωση ως πληρωμένο</button>
                )}
              </div>
            </li>
          ))}
        </ScrollRows>
      )}
    </div>
  );
}

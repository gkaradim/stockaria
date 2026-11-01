"use client";

import { getStoreLedger, listPayouts } from "@/lib/api";
import { useApi, useStoreId } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import ScrollRows from "@/components/ScrollRows";
import { Empty, Loading, StatCard } from "@/components/ui";
import type { LedgerType } from "@/lib/types";

const TYPE_LABEL: Record<LedgerType, string> = {
  sale: "Πώληση",
  commission: "Προμήθεια",
  refund: "Επιστροφή χρημάτων",
  commission_reversal: "Επιστροφή προμήθειας",
  payout: "Πληρωμή",
};

/** Payouts are made on the 1st and 15th of each month. */
function nextPayoutDate(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (d.getDate() < 15) d.setDate(15);
  else {
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  }
  return d.toLocaleDateString("el-GR", { day: "numeric", month: "long" });
}

export default function StorePayouts() {
  const { storeId } = useStoreId();
  const { data: ledger, loading } = useApi(() => getStoreLedger(storeId), [storeId]);
  const { data: payouts } = useApi(() => listPayouts(storeId), [storeId]);

  if (loading || !ledger) return <Loading />;

  const commissionFor = (payoutId: string) =>
    -ledger.entries.filter((e) => e.payoutId === payoutId && (e.type === "commission" || e.type === "commission_reversal")).reduce((s, e) => s + e.amountCents, 0);

  return (
    <div className="page">
      <h1 className="h1 mb-1">Πληρωμές</h1>
      <p className="mb-5 text-sm text-muted">Πληρώνεσαι με τραπεζική μεταφορά στο IBAN σου κάθε 15 ημέρες, για παραγγελίες που έχουν παραδοθεί. Οι επιστροφές αφαιρούνται από την επόμενη πληρωμή.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Ποσό που σου οφείλεται" value={formatEUR(ledger.balanceCents)} hint="περιλαμβάνει και παραγγελίες που δεν έχουν παραδοθεί ακόμα" />
        <StatCard label="Επόμενη πληρωμή" value={nextPayoutDate()} />
      </div>

      <section className="mt-6">
        <h2 className="h2 mb-2">Ιστορικό πληρωμών και τιμολόγια προμήθειας</h2>
        {!payouts || payouts.length === 0 ? (
          <Empty>Δεν έχει γίνει πληρωμή ακόμα.</Empty>
        ) : (
          <ScrollRows className="card divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div>
                  <div className="font-semibold">Πληρωμή {p.id} · {new Date(p.createdAt).toLocaleDateString("el-GR")}</div>
                  <div className="text-muted">Προμήθεια για τιμολόγηση: {formatEUR(commissionFor(p.id))}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold">{formatEUR(p.totalCents)}</div>
                  <div className={p.status === "paid" ? "font-semibold text-accent" : "text-muted"}>{p.status === "paid" ? "Πληρώθηκε" : "Σε εκκρεμότητα"}</div>
                </div>
              </li>
            ))}
          </ScrollRows>
        )}
      </section>

      <section className="mt-6">
        <h2 className="h2 mb-2">Κινήσεις</h2>
        <ScrollRows className="card divide-y divide-line text-sm">
          {ledger.entries.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 p-3">
              <span>{TYPE_LABEL[e.type]}{e.orderId ? ` · ${e.orderId}` : ""}<span className="ml-2 text-muted">{new Date(e.createdAt).toLocaleDateString("el-GR")}</span></span>
              <span className={`shrink-0 font-semibold ${e.amountCents < 0 ? "text-danger" : ""}`}>{formatEUR(e.amountCents)}</span>
            </li>
          ))}
        </ScrollRows>
      </section>
    </div>
  );
}

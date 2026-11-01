"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProduct, duplicateProduct, getStoreProducts, setProductStatus } from "@/lib/api";
import { useApi, useStoreId } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import ScrollRows from "@/components/ScrollRows";
import { Empty, Img, Loading } from "@/components/ui";

const STATUS_LABEL = { active: "Ενεργό", draft: "Πρόχειρο", hidden: "Κρυφό" } as const;

export default function StoreProducts() {
  const { storeId } = useStoreId();
  const router = useRouter();
  const { data: products, loading } = useApi(() => getStoreProducts(storeId), [storeId]);

  return (
    <div className="page">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="h1">Προϊόντα</h1>
        <Link href="/store/products/new/" className="btn btn-primary">+ Νέο προϊόν</Link>
      </div>

      {loading ? (
        <Loading />
      ) : !products || products.length === 0 ? (
        <Empty>Δεν έχεις προϊόντα ακόμα. Πάτα «Νέο προϊόν» για να ανεβάσεις το πρώτο.</Empty>
      ) : (
        <ScrollRows className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="card flex gap-3 p-3">
              <Img src={p.images[0]} alt={p.title} className="size-20 shrink-0 rounded-xl bg-stone-100 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{p.title}</span>
                  {p.createdBy === "platform" && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-900">από πλατφόρμα</span>}
                </div>
                <div className="text-sm text-muted">{formatEUR(p.priceCents)} · {p.totalStock} τεμ. · {p.stock.filter((s) => s.quantity > 0).map((s) => s.size).join(", ") || "χωρίς απόθεμα"}</div>
                <div className="mt-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-accent-soft text-accent-strong" : "bg-stone-200 text-stone-700"}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setProductStatus(p.id, p.status === "active" ? "hidden" : "active")}>
                    {p.status === "active" ? "Απόκρυψη" : "Ενεργοποίηση"}
                  </button>
                  <Link className="btn btn-outline btn-sm" href={`/store/products/new/?id=${p.id}`}>Επεξεργασία</Link>
                  <button className="btn btn-outline btn-sm" onClick={async () => { const id = await duplicateProduct(p.id); router.push(`/store/products/new/?id=${id}`); }}>Αντιγραφή</button>
                  <button className="btn btn-sm text-danger" onClick={() => { if (confirm(`Να διαγραφεί το «${p.title}»;`)) deleteProduct(p.id); }}>Διαγραφή</button>
                </div>
              </div>
            </li>
          ))}
        </ScrollRows>
      )}
    </div>
  );
}

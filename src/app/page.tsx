"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts, listStores, type ProductFilter } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { CATEGORIES } from "@/lib/logic/constants";
import ProductCard from "@/components/ProductCard";
import { Empty, Img, Loading } from "@/components/ui";

function Browse() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [storeId, setStoreId] = useState(params.get("store") ?? "");
  const [minDiscount, setMinDiscount] = useState(0);
  const [sort, setSort] = useState<NonNullable<ProductFilter["sort"]>>("new");

  const { data: products, loading } = useApi(
    () => getProducts({ q, category, size, storeId, minDiscount, sort }),
    [q, category, size, storeId, minDiscount, sort],
  );
  const { data: all } = useApi(() => getProducts());
  const { data: stores } = useApi(listStores);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    (all ?? []).forEach((p) => p.stock.forEach((s) => s.quantity > 0 && set.add(s.size)));
    return [...set].sort((a, b) => (isNaN(+a) || isNaN(+b) ? a.localeCompare(b) : +a - +b));
  }, [all]);
  const tiles = useMemo(
    () =>
      CATEGORIES.map((name) => {
        const items = (all ?? []).filter((p) => p.category === name);
        return { name, count: items.length, image: items.find((p) => p.images[0])?.images[0] };
      })
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count),
    [all],
  );
  const approvedStores = (stores ?? []).filter((s) => s.status === "approved");

  return (
    <div className="page">
      <section className="mb-5 rounded-3xl bg-accent-soft px-5 py-6 md:px-10 md:py-10">
        <h1 className="h1 max-w-xl text-accent-strong">Καινούρια ρούχα και παπούτσια από καταστήματα, σε τιμές outlet</h1>
        <p className="mt-2 max-w-xl text-accent-strong/80">Ό,τι περίσσεψε από τη σεζόν, από πραγματικά καταστήματα με ΑΦΜ.</p>
      </section>

      {category === "" ? (
        tiles.length > 0 && (
          <section className="mb-6" aria-label="Κατηγορίες">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {tiles.map((t) => (
                <button key={t.name} className="card group overflow-hidden text-left transition hover:border-accent" onClick={() => setCategory(t.name)}>
                  <Img src={t.image} alt="" className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
                  <div className="p-3">
                    <div className="font-bold leading-snug">{t.name}</div>
                    <div className="text-sm text-muted">{t.count} {t.count === 1 ? "προϊόν" : "προϊόντα"}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button className="btn btn-outline btn-sm" onClick={() => setCategory("")}>← Όλες οι κατηγορίες</button>
          <h2 className="h2">{category}</h2>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <select className="input" value={size} onChange={(e) => setSize(e.target.value)} aria-label="Μέγεθος">
          <option value="">Όλα τα μεγέθη</option>
          {sizes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Κατάστημα">
          <option value="">Όλα τα καταστήματα</option>
          {approvedStores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="input" value={minDiscount} onChange={(e) => setMinDiscount(+e.target.value)} aria-label="Έκπτωση">
          <option value={0}>Κάθε έκπτωση</option>
          <option value={30}>Από -30%</option>
          <option value={40}>Από -40%</option>
          <option value={50}>Από -50%</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Ταξινόμηση">
          <option value="new">Νεότερα</option>
          <option value="price">Χαμηλότερη τιμή</option>
          <option value="discount">Μεγαλύτερη έκπτωση</option>
        </select>
      </div>

      {q && <p className="mb-3 text-sm text-muted">Αποτελέσματα για «{q}»</p>}

      {loading ? (
        <Loading />
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <Empty>Δεν βρέθηκαν προϊόντα με αυτά τα φίλτρα.</Empty>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <Browse />
    </Suspense>
  );
}

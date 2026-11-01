"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProduct, saveProduct } from "@/lib/api";
import { useSession } from "@/lib/hooks";
import { CATEGORIES, CLOTHING_SIZES, SHOE_SIZES } from "@/lib/logic/constants";
import { discountPercent } from "@/lib/logic/money";
import PhotoUploader from "@/components/PhotoUploader";
import { ErrorNote, Loading } from "@/components/ui";
import { effectiveStoreId } from "@/lib/session";
import type { Product } from "@/lib/types";

const toCents = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);
const fromCents = (c?: number) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

function ProductForm() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const session = useSession();
  const storeId = effectiveStoreId(session ?? null) ?? "";

  const [loaded, setLoaded] = useState(!id);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [original, setOriginal] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProduct(id).then((p) => {
      if (p) {
        setImages(p.images);
        setTitle(p.title.replace(/ \(αντίγραφο\)$/, ""));
        setCategory(p.category);
        setPrice(fromCents(p.priceCents));
        setOriginal(fromCents(p.originalPriceCents));
        setDescription(p.description);
        setStock(Object.fromEntries(p.stock.map((s) => [s.size, s.quantity])));
      }
      setLoaded(true);
    });
  }, [id]);

  if (!loaded || session === undefined) return <Loading />;

  const sizeList = category === "Παπούτσια" ? SHOE_SIZES : CLOTHING_SIZES;
  const extraSizes = Object.keys(stock).filter((s) => !sizeList.includes(s));
  const priceCents = toCents(price);
  const originalCents = original ? toCents(original) : undefined;
  const pct = discountPercent(priceCents || 0, originalCents);

  function toggle(size: string) {
    setStock((cur) => {
      const next = { ...cur };
      if (size in next) delete next[size];
      else next[size] = 1;
      return next;
    });
  }

  async function save(status: Product["status"]) {
    setError("");
    if (!title.trim()) return setError("Βάλε τίτλο");
    if (!(priceCents > 0)) return setError("Βάλε τιμή, π.χ. 24,90");
    if (original && !(originalCents && originalCents > 0)) return setError("Η αρχική τιμή δεν είναι έγκυρη");
    const lines = Object.entries(stock).map(([size, quantity]) => ({ size, quantity }));
    if (status === "active" && lines.length === 0) return setError("Διάλεξε τουλάχιστον ένα μέγεθος");
    setBusy(true);
    try {
      await saveProduct(
        { id: id || undefined, storeId, title: title.trim(), description: description.trim(), category, images, priceCents, originalPriceCents: originalCents, stock: lines, status },
        session?.role === "admin" ? "platform" : "store",
      );
      router.push("/store/products/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="page max-w-2xl pb-32">
      <h1 className="h1 mb-5">{id ? "Επεξεργασία προϊόντος" : "Νέο προϊόν"}</h1>
      <div className="space-y-6">
        <section><div className="label">Φωτογραφίες</div><PhotoUploader value={images} onChange={setImages} /></section>

        <section>
          <label className="label" htmlFor="title">Τίτλος</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="π.χ. Δερμάτινα sneakers λευκά" />
        </section>

        <section>
          <label className="label" htmlFor="category">Κατηγορία</label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="price">Τιμή (€)</label>
            <input id="price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="24,90" />
          </div>
          <div>
            <label className="label" htmlFor="orig">Αρχική τιμή (€)</label>
            <input id="orig" className="input" inputMode="decimal" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="προαιρετικό" />
          </div>
          {pct > 0 && <p className="col-span-2 text-sm font-semibold text-accent">Θα εμφανίζεται έκπτωση -{pct}%</p>}
        </section>

        <section>
          <div className="label">Μεγέθη και ποσότητες</div>
          <div className="flex flex-wrap gap-2">
            {[...sizeList, ...extraSizes].map((s) => (
              <button key={s} type="button" className="chip min-w-12" aria-pressed={s in stock} onClick={() => toggle(s)}>{s}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Άλλο μέγεθος (π.χ. 3XL)" aria-label="Άλλο μέγεθος" />
            <button type="button" className="btn btn-outline" onClick={() => { const s = custom.trim(); if (s) { setStock((c) => ({ ...c, [s]: c[s] ?? 1 })); setCustom(""); } }}>Προσθήκη</button>
          </div>
          {Object.keys(stock).length > 0 && (
            <ul className="mt-3 card divide-y divide-line">
              {Object.entries(stock).map(([size, qty]) => (
                <li key={size} className="flex items-center justify-between p-3">
                  <span className="font-semibold">Μέγεθος {size}</span>
                  <div className="inline-flex items-center rounded-xl border border-line">
                    <button type="button" className="size-11 text-lg" aria-label={`Λιγότερα ${size}`} onClick={() => setStock((c) => ({ ...c, [size]: Math.max(0, qty - 1) }))}>−</button>
                    <span className="min-w-10 text-center font-semibold">{qty}</span>
                    <button type="button" className="size-11 text-lg" aria-label={`Περισσότερα ${size}`} onClick={() => setStock((c) => ({ ...c, [size]: qty + 1 }))}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <label className="label" htmlFor="desc">Περιγραφή (προαιρετικά)</label>
          <textarea id="desc" className="input min-h-28 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </section>

        {error && <ErrorNote message={error} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-background/95 p-3 backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-2xl gap-2">
          <button className="btn btn-outline" disabled={busy} onClick={() => save("draft")}>Πρόχειρο</button>
          <button className="btn btn-primary flex-1" disabled={busy} onClick={() => save("active")}>{busy ? "Αποθήκευση..." : "Δημοσίευση"}</button>
        </div>
      </div>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductForm />
    </Suspense>
  );
}

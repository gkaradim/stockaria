"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { addToCart, bumpView, getProduct } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import SizePicker from "@/components/SizePicker";
import { Empty, Img, Loading } from "@/components/ui";

function ProductDetail() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { data: product, loading } = useApi(() => getProduct(id), [id]);
  const [size, setSize] = useState<string>();
  const [image, setImage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) bumpView(id);
  }, [id]);

  if (loading) return <Loading />;
  if (!product || product.status !== "active") return <div className="page"><Empty>Το προϊόν δεν είναι διαθέσιμο.</Empty></div>;

  const available = product.stock.filter((s) => s.quantity > 0);

  return (
    <div className="page grid gap-6 md:grid-cols-2 md:gap-10">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-stone-100">
          <Img src={product.images[image]} alt={product.title} className="size-full object-cover" />
          {product.discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-sm font-bold text-white">-{product.discount}%</span>}
        </div>
        {product.images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setImage(i)} className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === image ? "border-accent" : "border-transparent"}`} aria-label={`Φωτογραφία ${i + 1}`}>
                <Img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-muted">{product.category}</p>
        <h1 className="h1 mt-1">{product.title}</h1>
        <p className="mt-1 text-sm">
          Από το κατάστημα{" "}
          <Link href={`/shop/?id=${product.storeId}`} className="font-semibold text-accent underline">
            {product.storeName}
          </Link>
        </p>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold">{formatEUR(product.priceCents)}</span>
          {product.discount > 0 && product.originalPriceCents && <span className="text-lg text-muted line-through">{formatEUR(product.originalPriceCents)}</span>}
        </div>

        <div className="mt-5">
          <div className="label">Μέγεθος</div>
          <SizePicker stock={product.stock} value={size} onChange={(s) => { setSize(s); setError(""); }} />
          {available.length <= 2 && available.length > 0 && <p className="mt-2 text-sm font-semibold text-danger">Τελευταία κομμάτια</p>}
          {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            className="btn btn-primary flex-1"
            onClick={async () => {
              if (!size) return setError("Διάλεξε μέγεθος");
              await addToCart(product.id, size, 1);
              router.push("/cart/");
            }}
          >
            Προσθήκη στο καλάθι
          </button>
        </div>

        {product.description && <p className="mt-6 whitespace-pre-line text-muted">{product.description}</p>}
        <ul className="mt-6 space-y-1 rounded-xl bg-accent-soft p-4 text-sm text-accent-strong">
          <li>Καινούριο, από κατάστημα με ΑΦΜ.</li>
          <li>Αποστολή με Box Now ή courier, με σταθερά μεταφορικά ανά δέμα.</li>
          <li>Επιστροφή εντός 14 ημερών. Σε αλλαγή γνώμης τα έξοδα επιστροφής επιβαρύνουν τον αγοραστή.</li>
        </ul>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductDetail />
    </Suspense>
  );
}

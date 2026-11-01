"use client";

import { Suspense } from "react";
import { getProducts, getStore } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import ProductCard from "@/components/ProductCard";
import { Empty, Loading } from "@/components/ui";
import { useSearchParams } from "next/navigation";

function Shop() {
  const id = useSearchParams().get("id") ?? "";
  const { data: store, loading } = useApi(() => getStore(id), [id]);
  const { data: products } = useApi(() => getProducts({ storeId: id }), [id]);

  if (loading) return <Loading />;
  if (!store || store.status !== "approved") return <div className="page"><Empty>Το κατάστημα δεν είναι διαθέσιμο.</Empty></div>;

  return (
    <div className="page">
      <section className="mb-6 card p-5">
        <h1 className="h1">{store.name}</h1>
        <dl className="mt-3 space-y-1 text-sm">
          {store.address && <div><dt className="inline text-muted">Διεύθυνση: </dt><dd className="inline">{store.address}</dd></div>}
          {store.phone && (
            <div>
              <dt className="inline text-muted">Τηλέφωνο: </dt>
              <dd className="inline"><a href={`tel:${store.phone.replace(/\s/g, "")}`} className="font-semibold text-accent underline">{store.phone}</a></dd>
            </div>
          )}
        </dl>
      </section>

      <h2 className="h2 mb-3">Προϊόντα του καταστήματος</h2>
      {!products ? (
        <Loading />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <Empty>Το κατάστημα δεν έχει διαθέσιμα προϊόντα αυτή τη στιγμή.</Empty>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Shop />
    </Suspense>
  );
}

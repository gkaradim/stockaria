"use client";

import Link from "next/link";
import { getCarts, removeFromCart, setCartQty } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { Empty, Img, Loading } from "@/components/ui";

export default function CartPage() {
  const { data: carts, loading } = useApi(getCarts);
  if (loading) return <Loading />;

  return (
    <div className="page max-w-3xl">
      <h1 className="h1 mb-1">Καλάθια</h1>
      <p className="mb-5 text-sm text-muted">Κάθε κατάστημα έχει δικό του καλάθι και δικό του δέμα, με ξεχωριστή παραγγελία και μεταφορικά.</p>

      {!carts || carts.length === 0 ? (
        <Empty>
          Τα καλάθια σου είναι άδεια.
          <div className="mt-4">
            <Link href="/" className="btn btn-primary">
              Δες προϊόντα
            </Link>
          </div>
        </Empty>
      ) : (
        <div className="space-y-5">
          {carts.map((cart) => (
            <section key={cart.store.id} className="card overflow-hidden">
              <header className="border-b border-line bg-stone-50 px-4 py-3 font-bold"><Link href={`/shop/?id=${cart.store.id}`} className="hover:underline">{cart.store.name}</Link></header>
              <ul className="divide-y divide-line">
                {cart.lines.map((l) => {
                  const max = l.product.stock.find((s) => s.size === l.size)?.quantity ?? 0;
                  return (
                    <li key={`${l.product.id}-${l.size}`} className="flex gap-3 p-4">
                      <Img src={l.product.images[0]} alt={l.product.title} className="size-20 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/?id=${l.product.id}`} className="line-clamp-2 font-semibold">
                          {l.product.title}
                        </Link>
                        <div className="text-sm text-muted">Μέγεθος {l.size}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-xl border border-line">
                            <button className="size-11 text-lg" aria-label="Λιγότερα" onClick={() => setCartQty(cart.store.id, l.product.id, l.size, l.qty - 1)}>−</button>
                            <span className="min-w-8 text-center font-semibold">{l.qty}</span>
                            <button className="size-11 text-lg disabled:opacity-30" aria-label="Περισσότερα" disabled={l.qty >= max} onClick={() => setCartQty(cart.store.id, l.product.id, l.size, l.qty + 1)}>+</button>
                          </div>
                          <div className="font-bold">{formatEUR(l.product.priceCents * l.qty)}</div>
                        </div>
                      </div>
                      <button className="self-start text-sm text-muted underline" onClick={() => removeFromCart(cart.store.id, l.product.id, l.size)}>
                        Αφαίρεση
                      </button>
                    </li>
                  );
                })}
              </ul>
              <footer className="space-y-1 border-t border-line bg-stone-50 p-4 text-sm">
                <div className="flex justify-between"><span>Προϊόντα</span><span>{formatEUR(cart.itemsCents)}</span></div>
                <div className="flex justify-between"><span>Μεταφορικά</span><span>{formatEUR(cart.shippingCents)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Σύνολο</span><span>{formatEUR(cart.totalCents)}</span></div>
                <Link href={`/checkout/?store=${cart.store.id}`} className="btn btn-primary mt-3 w-full">
                  Ολοκλήρωση παραγγελίας από {cart.store.name}
                </Link>
              </footer>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

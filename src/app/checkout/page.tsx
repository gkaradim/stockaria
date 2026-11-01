"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrder, getCarts } from "@/lib/api";
import { useApi, useSession } from "@/lib/hooks";
import { formatEUR } from "@/lib/logic/money";
import { Empty, ErrorNote, Loading } from "@/components/ui";

function Checkout() {
  const storeId = useSearchParams().get("store") ?? "";
  const router = useRouter();
  const session = useSession();
  const { data: carts, loading } = useApi(getCarts);
  const cart = carts?.find((c) => c.store.id === storeId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"locker" | "address">("locker");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || session === undefined) return <Loading />;
  if (!cart) {
    return (
      <div className="page max-w-xl">
        <Empty>
          Δεν υπάρχει καλάθι για αυτό το κατάστημα.
          <div className="mt-4"><Link href="/cart/" className="btn btn-outline">Πίσω στα καλάθια</Link></div>
        </Empty>
      </div>
    );
  }

  const prefillEmail = email || (session?.role === "customer" ? session.email : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !prefillEmail.trim() || !phone.trim() || !text.trim()) return setError("Συμπλήρωσε όλα τα πεδία");
    if (!/^\S+@\S+\.\S+$/.test(prefillEmail)) return setError("Βάλε ένα έγκυρο email");
    setBusy(true);
    try {
      const order = await createOrder(storeId, { name: name.trim(), email: prefillEmail.trim(), phone: phone.trim() }, { type, text: text.trim() });
      router.push(`/order/?id=${order.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="page grid max-w-5xl gap-8 md:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="space-y-6">
        <h1 className="h1">Ολοκλήρωση παραγγελίας</h1>
        <section className="space-y-3">
          <h2 className="h2">Στοιχεία επικοινωνίας</h2>
          <div><label className="label" htmlFor="name">Ονοματεπώνυμο</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" value={prefillEmail} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <div><label className="label" htmlFor="phone">Κινητό τηλέφωνο</label><input id="phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></div>
        </section>

        <section className="space-y-3">
          <h2 className="h2">Παράδοση</h2>
          <div className="flex gap-2">
            <button type="button" className="chip" aria-pressed={type === "locker"} onClick={() => setType("locker")}>Θυρίδα Box Now</button>
            <button type="button" className="chip" aria-pressed={type === "address"} onClick={() => setType("address")}>Διεύθυνση</button>
          </div>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={type === "locker" ? "Σημείο Box Now (π.χ. Σύνταγμα, Αθήνα)" : "Οδός, αριθμός, ΤΚ, πόλη"} aria-label="Στοιχεία παράδοσης" />
        </section>

        <section className="space-y-2">
          <h2 className="h2">Πληρωμή</h2>
          <p className="rounded-xl bg-warn-soft p-3 text-sm">Δοκιμαστική έκδοση: δεν γίνεται πραγματική χρέωση. Στην κανονική εφαρμογή εδώ θα πληρώνεις με κάρτα.</p>
        </section>

        {error && <ErrorNote message={error} />}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Γίνεται η παραγγελία..." : `Πληρωμή ${formatEUR(cart.totalCents)} (δοκιμαστική)`}</button>
        <p className="text-xs text-muted">Αγοράζεις χωρίς λογαριασμό. Θα δεις την παραγγελία σου με τον σύνδεσμο της επόμενης σελίδας.</p>
      </form>

      <aside className="card h-fit p-4 md:sticky md:top-28">
        <div className="mb-2 font-bold">{cart.store.name}</div>
        <ul className="space-y-1 text-sm">
          {cart.lines.map((l) => (
            <li key={`${l.product.id}-${l.size}`} className="flex justify-between gap-2">
              <span>{l.qty} × {l.product.title} ({l.size})</span>
              <span>{formatEUR(l.product.priceCents * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Μεταφορικά</span><span>{formatEUR(cart.shippingCents)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Σύνολο</span><span>{formatEUR(cart.totalCents)}</span></div>
        </div>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Checkout />
    </Suspense>
  );
}

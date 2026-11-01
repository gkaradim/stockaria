"use client";

import { useState } from "react";
import { getStore, updateStore } from "@/lib/api";
import { useApi, useStoreId } from "@/lib/hooks";
import type { Store } from "@/lib/types";
import { Loading } from "@/components/ui";

function ProfileForm({ store }: { store: Store }) {
  const [form, setForm] = useState({ name: store.name, doy: store.doy, address: store.address, phone: store.phone, iban: store.iban });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  return (
    <div className="page max-w-lg">
      <h1 className="h1 mb-5">Προφίλ καταστήματος</h1>
      <form
        className="card space-y-3 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await updateStore(store.id, { ...form, iban: form.iban.replace(/\s/g, "").toUpperCase() });
          setSaved(true);
        }}
      >
        <div><label className="label">ΑΦΜ</label><input className="input bg-stone-100" value={store.afm} readOnly /></div>
        <div><label className="label" htmlFor="n">Επωνυμία</label><input id="n" className="input" value={form.name} onChange={set("name")} /></div>
        <div><label className="label" htmlFor="d">ΔΟΥ</label><input id="d" className="input" value={form.doy} onChange={set("doy")} /></div>
        <div><label className="label" htmlFor="a">Διεύθυνση</label><input id="a" className="input" value={form.address} onChange={set("address")} /></div>
        <div><label className="label" htmlFor="p">Τηλέφωνο</label><input id="p" type="tel" className="input" value={form.phone} onChange={set("phone")} /></div>
        <div><label className="label" htmlFor="i">IBAN</label><input id="i" className="input" value={form.iban} onChange={set("iban")} /></div>
        <p className="text-sm text-muted">Προμήθεια πλατφόρμας: <strong>{Math.round(store.commissionRate * 1000) / 10}%</strong> στην αξία των προϊόντων κάθε πώλησης.</p>
        <button className="btn btn-primary w-full">Αποθήκευση</button>
        {saved && <p className="text-center text-sm font-semibold text-accent">Αποθηκεύτηκε</p>}
      </form>
    </div>
  );
}

export default function StoreProfile() {
  const { storeId } = useStoreId();
  const { data: store } = useApi(() => getStore(storeId), [storeId]);
  if (!store) return <Loading />;
  return <ProfileForm key={store.id} store={store} />;
}

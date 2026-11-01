"use client";

import { useState } from "react";
import Link from "next/link";
import { getCustomer, updateCustomer } from "@/lib/api";
import { useApi, useSession } from "@/lib/hooks";
import { CustomerGate } from "@/components/Gates";
import { Loading } from "@/components/ui";

function ProfileForm({ email, name, phone }: { email: string; name: string; phone: string }) {
  const [form, setForm] = useState({ name, phone });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  return (
    <div className="page max-w-lg">
      <Link href="/account/" className="text-sm text-muted underline">← Παραγγελίες</Link>
      <h1 className="h1 mb-5 mt-2">Προφίλ</h1>
      <form
        className="card space-y-3 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await updateCustomer(email, form);
          setSaved(true);
        }}
      >
        <div><label className="label">Email</label><input className="input bg-stone-100" value={email} readOnly /></div>
        <div><label className="label" htmlFor="pn">Όνομα</label><input id="pn" className="input" value={form.name} onChange={set("name")} autoComplete="name" /></div>
        <div><label className="label" htmlFor="pp">Κινητό</label><input id="pp" type="tel" className="input" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
        <button className="btn btn-primary w-full">Αποθήκευση</button>
        {saved && <p className="text-center text-sm font-semibold text-accent">Αποθηκεύτηκε</p>}
      </form>
    </div>
  );
}

function Profile() {
  const session = useSession();
  const email = session?.email ?? "";
  const { data: user, loading } = useApi(() => getCustomer(email), [email]);
  if (loading || !user) return <Loading />;
  return <ProfileForm key={email} email={email} name={user.name ?? ""} phone={user.phone ?? ""} />;
}

export default function CustomerProfilePage() {
  return (
    <CustomerGate>
      <Profile />
    </CustomerGate>
  );
}

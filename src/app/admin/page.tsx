"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveStore, inviteStore, listStores, suspendStore } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { actAsStore } from "@/lib/session";
import type { Store, StoreStatus } from "@/lib/types";
import { Empty, ErrorNote, Loading } from "@/components/ui";

const TABS: { status: StoreStatus; label: string }[] = [
  { status: "pending", label: "Σε αναμονή" },
  { status: "approved", label: "Εγκεκριμένα" },
  { status: "suspended", label: "Ανεσταλμένα" },
];

export default function AdminStores() {
  const router = useRouter();
  const { data: stores, loading } = useApi(listStores);
  const [tab, setTab] = useState<StoreStatus>("pending");
  const [invite, setInvite] = useState({ name: "", afm: "", ownerEmail: "" });
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  if (loading || !stores) return <Loading />;
  const list = stores.filter((s) => s.status === tab);

  function manage(s: Store) {
    actAsStore(s.id);
    router.push("/store/");
  }

  return (
    <div className="page">
      <h1 className="h1 mb-4">Καταστήματα</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.status} className="chip shrink-0" aria-pressed={tab === t.status} onClick={() => setTab(t.status)}>
            {t.label} ({stores.filter((s) => s.status === t.status).length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty>Δεν υπάρχουν καταστήματα σε αυτή την κατηγορία.</Empty>
      ) : (
        <ul className="space-y-3">
          {list.map((s) => (
            <li key={s.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <div className="text-base font-bold">{s.name}</div>
                  <div>ΑΦΜ {s.afm} · {s.doy || "ΔΟΥ δεν έχει συμπληρωθεί"}</div>
                  <div className="text-muted">{s.ownerName || "Δεν έχει συμπληρωθεί όνομα"} · {s.ownerEmail} · {s.phone || "χωρίς τηλέφωνο"}</div>
                  <div className="text-muted">{s.address || "χωρίς διεύθυνση"} · IBAN {s.iban || "δεν έχει συμπληρωθεί"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status !== "approved" && <button className="btn btn-primary btn-sm" onClick={() => approveStore(s.id)}>Έγκριση</button>}
                  {s.status === "approved" && <button className="btn btn-outline btn-sm" onClick={() => suspendStore(s.id)}>Αναστολή</button>}
                  <button className="btn btn-outline btn-sm" onClick={() => manage(s)}>Διαχείριση ως κατάστημα</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8 card max-w-lg p-5">
        <h2 className="h2 mb-3">Νέο κατάστημα με πρόσκληση</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(""); setLink("");
            if (!invite.name.trim() || !/^\d{9}$/.test(invite.afm.trim()) || !/^\S+@\S+\.\S+$/.test(invite.ownerEmail.trim())) return setError("Συμπλήρωσε επωνυμία, ΑΦΜ 9 ψηφίων και έγκυρο email");
            try {
              const s = await inviteStore({ name: invite.name.trim(), afm: invite.afm.trim(), ownerEmail: invite.ownerEmail.trim() });
              setLink(`${window.location.origin}${window.location.pathname.replace(/admin\/?$/, "")}login/?role=store (email: ${s.ownerEmail})`);
              setInvite({ name: "", afm: "", ownerEmail: "" });
            } catch (err) { setError((err as Error).message); }
          }}
        >
          <div><label className="label" htmlFor="in">Επωνυμία</label><input id="in" className="input" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="ia">ΑΦΜ</label><input id="ia" className="input" inputMode="numeric" maxLength={9} value={invite.afm} onChange={(e) => setInvite({ ...invite, afm: e.target.value })} /></div>
          <div><label className="label" htmlFor="ie">Email ιδιοκτήτη</label><input id="ie" type="email" className="input" value={invite.ownerEmail} onChange={(e) => setInvite({ ...invite, ownerEmail: e.target.value })} /></div>
          {error && <ErrorNote message={error} />}
          <button className="btn btn-primary w-full">Δημιουργία και πρόσκληση</button>
        </form>
        {link && <p className="mt-3 break-words rounded-xl bg-accent-soft p-3 text-sm text-accent-strong">Το κατάστημα δημιουργήθηκε (σε αναμονή). Στο πραγματικό σύστημα θα στέλνεται email πρόσκλησης. Σύνδεσμος για δοκιμή: {link}</p>}
      </section>
    </div>
  );
}

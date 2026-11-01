"use client";

import Link from "next/link";
import { getStore, updateStore } from "@/lib/api";
import { useApi, useSession } from "@/lib/hooks";
import { actAsStore, effectiveStoreId } from "@/lib/session";
import { Loading } from "./ui";

function Denied({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="page text-center">
      <p className="mb-4 text-muted">{message}</p>
      <Link className="btn btn-primary" href={href}>
        {cta}
      </Link>
    </div>
  );
}

/** Wraps /store/*: store owners (or the admin acting as a store) only; pending stores wait for approval. */
export function StoreGate({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const storeId = effectiveStoreId(session ?? null);
  const { data: store, loading } = useApi(() => (storeId ? getStore(storeId) : Promise.resolve(null)), [storeId]);

  if (session === undefined || (storeId && loading)) return <Loading />;
  if (!session || !storeId || (session.role !== "store" && session.role !== "admin")) {
    return <Denied message="Χρειάζεται σύνδεση με λογαριασμό καταστήματος." href="/login/" cta="Σύνδεση" />;
  }
  if (!store) return <Denied message="Δεν βρέθηκε το κατάστημα." href="/" cta="Αρχική" />;

  return (
    <>
      {session.role === "admin" && (
        <div className="bg-indigo-100 px-4 py-2 text-center text-sm text-indigo-950">
          Διαχειρίζεσαι ως πλατφόρμα το κατάστημα <strong>{store.name}</strong>.{" "}
          <Link href="/admin/" className="font-semibold underline" onClick={() => actAsStore(null)}>
            Έξοδος από το κατάστημα
          </Link>
        </div>
      )}
      {store.status === "pending" && session.role !== "admin" ? (
        <div className="page max-w-xl text-center">
          <h1 className="h1 mb-3">Σε αναμονή έγκρισης</h1>
          <p className="text-muted">
            Ελέγχουμε τα στοιχεία του καταστήματος <strong>{store.name}</strong> (ΑΦΜ {store.afm}). Μόλις εγκριθεί, θα μπορείς να ανεβάζεις προϊόντα.
          </p>
          {(!store.iban || !store.address) && (
            <p className="mt-4 rounded-xl bg-warn-soft p-3 text-sm">Λείπουν στοιχεία επιχείρησης ή IBAN. Συμπλήρωσέ τα από το προφίλ, μόλις εγκριθείς.</p>
          )}
          <button className="btn btn-outline mt-6 btn-sm" onClick={() => updateStore(store.id, {})}>
            Ανανέωση
          </button>
        </div>
      ) : store.status === "suspended" && session.role !== "admin" ? (
        <div className="page max-w-xl text-center">
          <h1 className="h1 mb-3">Το κατάστημα έχει ανασταλεί</h1>
          <p className="text-muted">Επικοινώνησε με την πλατφόρμα για περισσότερες πληροφορίες.</p>
        </div>
      ) : (
        children
      )}
    </>
  );
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (session === undefined) return <Loading />;
  if (!session || session.role !== "admin") {
    return <Denied message="Η σελίδα αυτή είναι μόνο για τον διαχειριστή." href="/admin/login/" cta="Σύνδεση διαχειριστή" />;
  }
  return <>{children}</>;
}

export function CustomerGate({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (session === undefined) return <Loading />;
  if (!session || session.role !== "customer") {
    return <Denied message="Σύνδεσε τον λογαριασμό σου για να δεις τις παραγγελίες σου." href="/login/" cta="Σύνδεση" />;
  }
  return <>{children}</>;
}

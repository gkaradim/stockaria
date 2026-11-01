"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import EmailLinkForm from "@/components/EmailLinkForm";
import { Loading } from "@/components/ui";
import { consumeLink } from "@/lib/session";

type Role = "customer" | "store";
type Mode = "login" | "register";

const DEMO = [
  { label: "Διαχειριστής", note: "Έγκριση καταστημάτων, παραγγελίες, πληρωμές", email: "admin@stockaria.gr", role: "admin", to: "/admin/" },
  { label: "Κατάστημα (Ελένη)", note: "Dashboard, προϊόντα, παραγγελίες, πληρωμές", email: "eleni@example.gr", role: "store", to: "/store/" },
  { label: "Πελάτης (Μαρία)", note: "Παραγγελίες από τρία καταστήματα", email: "maria@example.gr", role: "customer", to: "/account/" },
] as const;

function DemoAccounts() {
  const router = useRouter();
  return (
    <div className="mt-8">
      <h2 className="h2 mb-1">Δοκιμαστικοί λογαριασμοί</h2>
      <p className="mb-3 text-sm text-muted">Είσοδος με ένα κλικ, με έτοιμα δεδομένα.</p>
      <div className="space-y-2">
        {DEMO.map((d) => (
          <button
            key={d.email}
            className="card w-full p-4 text-left transition hover:border-accent"
            onClick={() => { consumeLink(d.email, d.role); router.push(d.to); }}
          >
            <div className="font-bold">{d.label}</div>
            <div className="text-sm text-muted">{d.note}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Login() {
  const initial = useSearchParams().get("role");
  const [role, setRole] = useState<Role | null>(initial === "store" || initial === "customer" ? initial : null);
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="page max-w-md">
      <h1 className="h1 mb-1">Σύνδεση</h1>
      <p className="mb-5 text-muted">Μπαίνεις με σύνδεσμο στο email σου, χωρίς κωδικούς.</p>

      {role === null ? (
        <div className="space-y-3">
          <button className="card w-full p-5 text-left transition hover:border-accent" onClick={() => setRole("customer")}>
            <div className="text-lg font-bold">Είμαι πελάτης</div>
            <div className="text-sm text-muted">Θέλω να δω τις παραγγελίες μου. Μπορείς να αγοράσεις και χωρίς λογαριασμό.</div>
          </button>
          <button className="card w-full p-5 text-left transition hover:border-accent" onClick={() => setRole("store")}>
            <div className="text-lg font-bold">Έχω κατάστημα</div>
            <div className="text-sm text-muted">Θέλω να ανεβάσω προϊόντα και να δω πωλήσεις.</div>
          </button>
        </div>
      ) : (
        <div className="card p-5">
          <button className="mb-4 text-sm text-muted underline" onClick={() => setRole(null)}>← Αλλαγή</button>
          <h2 className="h2 mb-3">{role === "customer" ? "Πελάτης" : "Κατάστημα"}</h2>

          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button key={m} className={`min-h-10 rounded-lg text-sm font-semibold ${mode === m ? "bg-surface shadow-sm" : "text-muted"}`} onClick={() => setMode(m)}>
                {m === "login" ? "Σύνδεση" : "Δημιουργία λογαριασμού"}
              </button>
            ))}
          </div>

          {role === "customer" && (
            <EmailLinkForm key={mode} role="customer" redirectTo="/account/" withProfile={mode === "register"} />
          )}
          {role === "store" && mode === "login" && (
            <EmailLinkForm
              role="store"
              redirectTo="/store/"
              hint="Δοκιμή: eleni@example.gr, nikos@example.gr ή kostas@example.gr"
            />
          )}
          {role === "store" && mode === "register" && (
            <div className="space-y-3">
              <p className="text-sm text-muted">Η εγγραφή καταστήματος έχει 4 σύντομα βήματα: στοιχεία, επιχείρηση, IBAN και όροι. Μετά περιμένεις έγκριση.</p>
              <Link href="/register/store/" className="btn btn-primary w-full">Ξεκίνα την εγγραφή</Link>
            </div>
          )}
        </div>
      )}
      <DemoAccounts />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Login />
    </Suspense>
  );
}

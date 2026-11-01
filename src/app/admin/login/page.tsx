"use client";

import EmailLinkForm from "@/components/EmailLinkForm";
import { ADMIN_EMAIL } from "@/lib/session";

export default function AdminLogin() {
  return (
    <div className="page max-w-md">
      <h1 className="h1 mb-1">Είσοδος διαχειριστή</h1>
      <p className="mb-5 text-muted">Μόνο για την πλατφόρμα.</p>
      <div className="card p-5">
        <EmailLinkForm role="admin" redirectTo="/admin/" defaultEmail={ADMIN_EMAIL} hint="Δοκιμαστική έκδοση: το email διαχειριστή είναι ήδη συμπληρωμένο." />
      </div>
    </div>
  );
}

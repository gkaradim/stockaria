"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { consumeLink } from "@/lib/session";
import type { User } from "@/lib/types";
import { ErrorNote } from "./ui";

/** Email-link login. In the prototype no email is sent: the "link" is opened with a button. */
export default function EmailLinkForm({
  role,
  redirectTo,
  hint,
  withProfile = false,
  defaultEmail = "",
}: {
  role: User["role"];
  redirectTo: string;
  hint?: string;
  withProfile?: boolean;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function open() {
    try {
      consumeLink(email, role, { name: name.trim() || undefined, phone: phone.trim() || undefined });
      router.push(redirectTo);
    } catch (e) {
      setSent(false);
      setError((e as Error).message);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-accent-soft p-4 text-accent-strong">
          <div className="font-bold">Έλεγξε το email σου</div>
          <p className="text-sm">Στείλαμε σύνδεσμο εισόδου στο {email}. Δεν χρειάζεσαι κωδικό.</p>
        </div>
        <p className="rounded-xl bg-warn-soft p-3 text-sm">Δοκιμαστική έκδοση: δεν στέλνεται πραγματικό email.</p>
        <button className="btn btn-primary w-full" onClick={open}>Άνοιγμα συνδέσμου</button>
        <button className="btn btn-outline w-full" onClick={() => setSent(false)}>Άλλο email</button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Βάλε ένα έγκυρο email");
        setSent(true);
      }}
    >
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {withProfile && (
        <>
          <div><label className="label" htmlFor="pname">Όνομα (προαιρετικό)</label><input id="pname" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
          <div><label className="label" htmlFor="pphone">Κινητό (προαιρετικό)</label><input id="pphone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></div>
        </>
      )}
      {error && <ErrorNote message={error} />}
      <button className="btn btn-primary w-full">Στείλε μου σύνδεσμο</button>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </form>
  );
}

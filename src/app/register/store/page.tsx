"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerStore } from "@/lib/api";
import { consumeLink } from "@/lib/session";
import { DEFAULT_COMMISSION } from "@/lib/logic/constants";
import { ErrorNote } from "@/components/ui";

const STEPS = ["Στοιχεία", "Επιχείρηση", "IBAN", "Όροι"];

const field = (label: string, id: string, value: string, set: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <input id={id} className="input" value={value} onChange={(e) => set(e.target.value)} {...props} />
  </div>
);

export default function RegisterStore() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState({ ownerName: "", ownerEmail: "", name: "", afm: "", doy: "", address: "", phone: "", iban: "" });
  const [terms, setTerms] = useState({ commission: false, returns: false, access: false });
  const set = (k: keyof typeof d) => (v: string) => setD((p) => ({ ...p, [k]: v }));

  function validate(): string {
    if (step === 0) {
      if (!d.ownerName.trim()) return "Βάλε το όνομά σου";
      if (!/^\S+@\S+\.\S+$/.test(d.ownerEmail.trim())) return "Βάλε ένα έγκυρο email";
    }
    if (step === 1) {
      if (!d.name.trim()) return "Βάλε την επωνυμία του καταστήματος";
      if (!/^\d{9}$/.test(d.afm.trim())) return "Ο ΑΦΜ πρέπει να έχει 9 ψηφία";
      if (!d.doy.trim() || !d.address.trim() || !d.phone.trim()) return "Συμπλήρωσε ΔΟΥ, διεύθυνση και τηλέφωνο";
    }
    if (step === 2 && !/^GR\d{25}$/i.test(d.iban.replace(/\s/g, ""))) return "Το IBAN πρέπει να ξεκινά με GR και να έχει 27 χαρακτήρες";
    if (step === 3 && !(terms.commission && terms.returns && terms.access)) return "Πρέπει να αποδεχτείς και τους τρεις όρους";
    return "";
  }

  async function next() {
    const problem = validate();
    setError(problem);
    if (problem) return;
    if (step < 3) return setStep(step + 1);
    setBusy(true);
    try {
      await registerStore({ ...d, iban: d.iban.replace(/\s/g, "").toUpperCase() });
      consumeLink(d.ownerEmail, "store");
      router.push("/store/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="page max-w-lg">
      <h1 className="h1 mb-1">Εγγραφή καταστήματος</h1>
      <p className="mb-5 text-sm text-muted">Ήδη έχεις λογαριασμό; <Link className="underline" href="/login/?role=store">Σύνδεση</Link></p>

      <ol className="mb-6 grid grid-cols-4 gap-1 text-center text-xs">
        {STEPS.map((s, i) => (
          <li key={s}>
            <div className={`mb-1 h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
            <span className={i === step ? "font-bold" : "text-muted"}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>

      <div className="card space-y-3 p-5">
        {step === 0 && (
          <>
            {field("Ονοματεπώνυμο ιδιοκτήτη", "ownerName", d.ownerName, set("ownerName"), { autoComplete: "name" })}
            {field("Email", "ownerEmail", d.ownerEmail, set("ownerEmail"), { type: "email", autoComplete: "email" })}
            <p className="text-xs text-muted">Θα μπαίνεις με σύνδεσμο στο email, χωρίς κωδικό.</p>
          </>
        )}
        {step === 1 && (
          <>
            {field("Επωνυμία καταστήματος", "name", d.name, set("name"))}
            {field("ΑΦΜ", "afm", d.afm, set("afm"), { inputMode: "numeric", maxLength: 9 })}
            {field("ΔΟΥ", "doy", d.doy, set("doy"))}
            {field("Διεύθυνση", "address", d.address, set("address"), { autoComplete: "street-address" })}
            {field("Τηλέφωνο", "phone", d.phone, set("phone"), { type: "tel", autoComplete: "tel" })}
          </>
        )}
        {step === 2 && (
          <>
            {field("IBAN για τις πληρωμές σου", "iban", d.iban, set("iban"), { placeholder: "GR..." })}
            <p className="text-xs text-muted">Σε αυτό το IBAN μεταφέρουμε τα χρήματα των πωλήσεων κάθε 15 ημέρες.</p>
          </>
        )}
        {step === 3 && (
          <div className="space-y-3 text-sm">
            {([
              ["commission", `Αποδέχομαι προμήθεια πλατφόρμας ${Math.round(DEFAULT_COMMISSION * 100)}% στην αξία των προϊόντων κάθε πώλησης (δοκιμαστικό ποσοστό).`],
              ["returns", "Αποδέχομαι την πολιτική επιστροφών: επιστροφή εντός 14 ημερών, σε αλλαγή γνώμης τα έξοδα επιστροφής επιβαρύνουν τον αγοραστή, σε ελαττωματικό ή λάθος προϊόν επιβαρύνομαι εγώ."],
              ["access", "Επιτρέπω στην πλατφόρμα να διαχειρίζεται τα προϊόντα και τις παραγγελίες του καταστήματός μου όταν της το ζητήσω."],
            ] as const).map(([k, text]) => (
              <label key={k} className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={terms[k]} onChange={(e) => setTerms((p) => ({ ...p, [k]: e.target.checked }))} />
                <span>{text}</span>
              </label>
            ))}
          </div>
        )}
        {error && <ErrorNote message={error} />}
        <div className="flex gap-2 pt-1">
          {step > 0 && <button type="button" className="btn btn-outline" onClick={() => { setError(""); setStep(step - 1); }}>Πίσω</button>}
          <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={next}>
            {step < 3 ? "Συνέχεια" : busy ? "Αποστολή..." : "Υποβολή για έγκριση"}
          </button>
        </div>
      </div>
    </div>
  );
}

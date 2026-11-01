"use client";

import { useEffect, useState } from "react";
import { resetDemo } from "@/lib/api";
import { logout } from "@/lib/session";
import { QUOTA_EVENT } from "@/lib/storage";

export default function DemoBanner() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(true);
    window.addEventListener(QUOTA_EVENT, on);
    return () => window.removeEventListener(QUOTA_EVENT, on);
  }, []);

  return (
    <div className="bg-warn-soft px-4 py-1.5 text-center text-xs text-amber-950 md:text-sm">
      Δοκιμαστική έκδοση: τα δεδομένα αποθηκεύονται μόνο στον browser σου.{" "}
      <button
        className="font-semibold underline"
        onClick={async () => {
          if (confirm("Να επανέλθουν τα δοκιμαστικά δεδομένα και να σβηστούν οι αλλαγές σου;")) {
            logout();
            await resetDemo();
            setFull(false);
          }
        }}
      >
        Επαναφορά
      </button>
      {full && <span className="ml-2 font-semibold text-danger">Η μνήμη του browser γέμισε, δοκίμασε λιγότερες ή μικρότερες φωτογραφίες.</span>}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCarts } from "@/lib/api";
import { useApi, useSession } from "@/lib/hooks";
import { logout } from "@/lib/session";

function CartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 7h13l-1.5 8.5H8L6 3H3" />
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const session = useSession();
  const { data: carts } = useApi(getCarts);
  const [q, setQ] = useState("");
  const count = (carts ?? []).reduce((n, c) => n + c.lines.reduce((m, l) => m + l.qty, 0), 0);

  const account =
    session?.role === "admin"
      ? { href: "/admin/", label: "Διαχείριση" }
      : session?.role === "store"
        ? { href: "/store/", label: "Κατάστημα" }
        : session?.role === "customer"
          ? { href: "/account/", label: "Παραγγελίες" }
          : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:flex-nowrap md:px-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-accent">
          stockaria
        </Link>

        <form
          className="order-3 w-full md:order-2 md:max-w-md md:flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
          }}
        >
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Αναζήτηση προϊόντων ή καταστημάτων" aria-label="Αναζήτηση" />
        </form>

        <nav className="order-2 ml-auto flex items-center gap-2 md:order-3">
          {session !== undefined &&
            (account ? (
              <>
                <Link href={account.href} className="btn btn-outline btn-sm">
                  {account.label}
                </Link>
                <button className="btn btn-sm text-muted hover:underline" onClick={() => { logout(); router.push("/"); }}>
                  Έξοδος
                </button>
              </>
            ) : (
              <Link href="/login/" className="btn btn-outline btn-sm">
                Σύνδεση
              </Link>
            ))}
          <Link href="/cart/" className="relative inline-flex size-11 items-center justify-center rounded-xl hover:bg-black/5" aria-label={`Καλάθια, ${count} προϊόντα`}>
            <CartIcon />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

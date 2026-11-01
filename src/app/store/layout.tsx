"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StoreGate } from "@/components/Gates";
import SubNav from "@/components/SubNav";
import { useSession } from "@/lib/hooks";

const ITEMS = [
  { href: "/store/", label: "Πίνακας" },
  { href: "/store/products/", label: "Προϊόντα" },
  { href: "/store/orders/", label: "Παραγγελίες" },
  { href: "/store/payouts/", label: "Πληρωμές" },
  { href: "/store/profile/", label: "Προφίλ" },
];

// The platform admin only edits store details and products on a store's behalf.
const ADMIN_ITEMS = [
  { href: "/store/products/", label: "Προϊόντα" },
  { href: "/store/profile/", label: "Στοιχεία καταστήματος" },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const path = (usePathname() ?? "").replace(/\/$/, "");
  const isAdmin = session?.role === "admin";
  const allowed = !isAdmin || path.startsWith("/store/products") || path.startsWith("/store/profile");

  useEffect(() => {
    if (!allowed) router.replace("/store/products/");
  }, [allowed, router]);

  return (
    <StoreGate>
      <SubNav items={isAdmin ? ADMIN_ITEMS : ITEMS} />
      {allowed ? children : null}
    </StoreGate>
  );
}

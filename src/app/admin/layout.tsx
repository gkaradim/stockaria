"use client";

import { usePathname } from "next/navigation";
import { AdminGate } from "@/components/Gates";
import SubNav from "@/components/SubNav";

const ITEMS = [
  { href: "/admin/", label: "Καταστήματα" },
  { href: "/admin/orders/", label: "Παραγγελίες" },
  { href: "/admin/payouts/", label: "Πληρωμές" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = (usePathname() ?? "").replace(/\/$/, "");
  if (path === "/admin/login") return <>{children}</>;
  return (
    <AdminGate>
      <SubNav items={ITEMS} />
      {children}
    </AdminGate>
  );
}

import { StoreGate } from "@/components/Gates";
import SubNav from "@/components/SubNav";

const ITEMS = [
  { href: "/store/", label: "Πίνακας" },
  { href: "/store/products/", label: "Προϊόντα" },
  { href: "/store/orders/", label: "Παραγγελίες" },
  { href: "/store/payouts/", label: "Πληρωμές" },
  { href: "/store/profile/", label: "Προφίλ" },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreGate>
      <SubNav items={ITEMS} />
      {children}
    </StoreGate>
  );
}

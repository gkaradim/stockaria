import type { OrderStatus } from "@/lib/types";

/* eslint-disable @next/next/no-img-element */
export function Img({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  new: { label: "Νέα", cls: "bg-warn-soft text-amber-900" },
  preparing: { label: "Ετοιμάζεται", cls: "bg-sky-100 text-sky-900" },
  shipped: { label: "Στάλθηκε", cls: "bg-indigo-100 text-indigo-900" },
  delivered: { label: "Παραδόθηκε", cls: "bg-accent-soft text-accent-strong" },
  cancelled: { label: "Ακυρώθηκε", cls: "bg-danger-soft text-danger" },
  returned: { label: "Επιστράφηκε", cls: "bg-stone-200 text-stone-800" },
};

export const statusLabel = (s: OrderStatus) => STATUS[s].label;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, cls } = STATUS[status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card px-4 py-10 text-center text-muted">{children}</div>;
}

export function Loading() {
  return <div className="py-10 text-center text-muted">Φόρτωση...</div>;
}

export function ErrorNote({ message }: { message: string }) {
  return <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{message}</p>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubNav({ items }: { items: { href: string; label: string }[] }) {
  const path = (usePathname() ?? "").replace(/\/$/, "");
  return (
    <nav className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 md:px-6">
        {items.map((i) => {
          const active = path === i.href.replace(/\/$/, "") || (i.href.length > 7 && path.startsWith(i.href.replace(/\/$/, "")));
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${active ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}
            >
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

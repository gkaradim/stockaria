"use client";

import { useEffect, useRef } from "react";

/** A list that shows at most `rows` items and scrolls inside itself when there are more. */
export default function ScrollRows({ rows = 10, className = "", children }: { rows?: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const kids = el.children;
      if (kids.length <= rows) {
        el.style.maxHeight = "";
        return;
      }
      const first = kids[0] as HTMLElement;
      const last = kids[rows - 1] as HTMLElement;
      el.style.maxHeight = `${last.offsetTop + last.offsetHeight - first.offsetTop}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  });

  return (
    <ul ref={ref} className={`relative overflow-y-auto overscroll-contain ${className}`}>
      {children}
    </ul>
  );
}

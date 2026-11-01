"use client";

import type { StockLine } from "@/lib/types";

export default function SizePicker({ stock, value, onChange }: { stock: StockLine[]; value?: string; onChange: (size: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Μέγεθος">
      {stock.map((s) => (
        <button
          key={s.size}
          type="button"
          className="chip min-w-12"
          aria-pressed={value === s.size}
          disabled={s.quantity <= 0}
          onClick={() => onChange(s.size)}
        >
          {s.size}
        </button>
      ))}
    </div>
  );
}

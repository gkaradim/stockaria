"use client";

import { useRef, useState } from "react";
import { fileToDataUrl } from "@/lib/image";
import { Img } from "./ui";

const MAX = 5;

export default function PhotoUploader({ value, onChange }: { value: string[]; onChange: (images: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const room = MAX - value.length;
      const urls = await Promise.all(Array.from(files).slice(0, room).map((f) => fileToDataUrl(f)));
      onChange([...value, ...urls]);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line">
            <Img src={src} alt={`Φωτογραφία ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              aria-label="Αφαίρεση φωτογραφίας"
              className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-full bg-black/65 text-lg leading-none text-white"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        {value.length < MAX && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-surface text-sm font-semibold text-muted hover:border-accent hover:text-accent"
          >
            <span className="text-2xl leading-none">+</span>
            {busy ? "Φόρτωση..." : "Φωτογραφία"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      <p className="mt-1 text-xs text-muted">Μέχρι {MAX} φωτογραφίες. Από το κινητό μπορείς να τραβήξεις ή να διαλέξεις από τη συλλογή.</p>
    </div>
  );
}

import Link from "next/link";
import type { ProductView } from "@/lib/api";
import { formatEUR } from "@/lib/logic/money";
import { Img } from "./ui";

export default function ProductCard({ product }: { product: ProductView }) {
  return (
    <Link href={`/product/?id=${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-stone-100">
        <Img src={product.images[0]} alt={product.title} className="size-full object-cover transition group-hover:scale-[1.02]" />
        {product.discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">-{product.discount}%</span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="line-clamp-2 text-sm font-semibold leading-snug">{product.title}</div>
        <div className="text-xs text-muted">{product.storeName}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold">{formatEUR(product.priceCents)}</span>
          {product.originalPriceCents && product.discount > 0 && (
            <span className="text-sm text-muted line-through">{formatEUR(product.originalPriceCents)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

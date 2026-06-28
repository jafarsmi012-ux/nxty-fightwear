"use client";

import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-[#262626]">
        <p className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
          NO MATCH
        </p>
        <p className="text-xs text-neutral-500 uppercase tracking-[0.25em] font-mono">
          // coba kata kunci lain
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-4 border-2 border-[#262626] [&>*]:border-r-0 [&>*]:border-b-0 [&>*:nth-child(2n)]:sm:border-r-0 [&>*:last-child]:border-b-0">
      {products.map((product, idx) => (
        <ProductCard key={product.id} product={product} index={idx} />
      ))}
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import productsData from "@/data/products.json";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";
import ScrollToTop from "@/components/ScrollToTop";
import type { Product } from "@/types";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = useMemo(() => {
    const q = searchParams?.get("q") || "";
    return decodeURIComponent(q);
  }, [searchParams]);

  // Filter products based on query
  const filteredProducts: Product[] = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const q = query.toLowerCase();
    return productsData.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [query]);

  // Handle search from Navbar
  const handleSearch = useCallback((newQuery: string) => {
    if (newQuery.trim()) {
      window.location.href = `/products/search?q=${encodeURIComponent(newQuery.trim())}`;
    } else {
      window.location.href = "/products/search";
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 md:pb-0">
      <Navbar onSearch={handleSearch} />
      <ScrollToTop />

      {/* Marquee promo strip */}
      <div
        id="categories"
        className="bg-[#dc2626] text-white overflow-hidden border-b-2 border-[#0a0a0a]"
      >
        <div className="flex animate-marquee whitespace-nowrap py-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {[
                "PREMIUM GEAR",
                "FAST SHIPPING",
                "100% AUTHENTIC",
                "FIGHT SPIRIT",
              ].map((t, j) => (
                <span
                  key={j}
                  className="px-6 text-xs sm:text-sm font-black uppercase tracking-[0.25em] flex items-center gap-6"
                >
                  {t}
                  <span className="text-[#0a0a0a] text-base leading-none">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="pb-12">
        <div className="max-w-7xl mx-auto px-4 pt-8 space-y-10">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b-2 border-[#dc2626]">
            <div>
              <p className="text-[10px] font-black text-[#dc2626] uppercase tracking-[0.3em] mb-1 font-mono">
                // HASIL PENCARIAN
              </p>
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">
                {query ? `"${query}"` : "SEMUA PRODUK"}
              </h1>
              <p className="text-xs text-neutral-500 mt-1.5 font-mono uppercase tracking-widest">
                {query ? `${String(filteredProducts.length).padStart(2, "0")} PRODUK DITEMUKAN` : "Silakan masukkan kata kunci untuk mencari produk"}
              </p>
            </div>
            {query && (
              <button
                onClick={() => {
                  window.location.href = "/products/search";
                }}
                className="text-[11px] text-[#dc2626] font-black uppercase tracking-[0.25em] border-2 border-[#dc2626] px-3 py-2 hover:bg-[#dc2626] hover:text-white transition-colors self-start"
              >
                ATUR ULANG
              </button>
            )}
          </div>

          {/* Filter Placeholders */}
          {query && (
            <section>
              <div className="flex flex-wrap gap-2 py-3 border-b-2 border-[#262626]">
                <button className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626] transition-colors min-h-[44px]">
                  KATEGORI
                </button>
                <button className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626] transition-colors min-h-[44px]">
                  HARGA
                </button>
                <button className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626] transition-colors min-h-[44px]">
                  RATING
                </button>
              </div>
            </section>
          )}

          {/* Sort Placeholders */}
          {query && (
            <section>
              <div className="flex items-center justify-between py-3 border-b-2 border-[#262626]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                    URUTKAN:
                  </span>
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-[#262626] text-neutral-400 min-h-[44px]">
                    TERBARU
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest hidden sm:block">
                  {filteredProducts.length} HASIL
                </span>
              </div>
            </section>
          )}

          {/* Product Grid */}
          <ProductGrid products={filteredProducts} />
        </div>
      </main>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Memuat hasil pencarian...</p>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import productsData from "@/data/products.json";
import promotionsData from "@/data/promotions.json";
import type { Product, Promotion } from "@/types";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryPills from "@/components/CategoryPills";
import ProductGrid from "@/components/ProductGrid";
import ScrollToTop from "@/components/ScrollToTop";
import BannerCarousel from "@/components/BannerCarousel";
import FlashSaleSection from "@/components/FlashSaleSection";

const PROMO_MARQUEE = [
  "PREMIUM GEAR",
  "FAST SHIPPING",
  "100% AUTHENTIC",
  "FIGHT SPIRIT",
  "INDONESIAN BRAND",
  "LIMITED DROP",
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(productsData.products.map((p) => p.category));
    return Array.from(set).sort();
  }, []);

  const filteredProducts = useMemo<Product[]>(() => {
    let result = productsData.products;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery, activeCategory]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const banners: Promotion[] = useMemo(
    () =>
      (promotionsData.promotions as Promotion[]).filter((p) => p.type === "banner"),
    []
  );

  const flashSales: Promotion[] = useMemo(
    () =>
      (promotionsData.promotions as Promotion[]).filter((p) => p.type === "flash_sale"),
    []
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 md:pb-0">
      <Navbar onSearch={handleSearch} />
      <ScrollToTop />
      <HeroSection />

      {/* Marquee promo strip */}
      <div
        id="categories"
        className="bg-[#dc2626] text-white overflow-hidden border-b-2 border-[#0a0a0a]"
      >
        <div className="flex animate-marquee whitespace-nowrap py-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {PROMO_MARQUEE.map((t, j) => (
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

      <main id="catalog" className="pb-12">
        <div className="max-w-7xl mx-auto px-4 pt-8 space-y-10">
          {/* Banner carousel */}
          {banners.length > 0 && (
            <BannerCarousel banners={banners} />
          )}

          {/* Flash sales */}
          {flashSales.map((fs) => (
            <FlashSaleSection key={fs.id} promotion={fs} />
          ))}

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b-2 border-[#dc2626]">
            <div>
              <p className="text-[10px] font-black text-[#dc2626] uppercase tracking-[0.3em] mb-1 font-mono">
                // CATALOG / 2024
              </p>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">
                {activeCategory || "SEMUA PRODUK"}
              </h2>
              <p className="text-xs text-neutral-500 mt-1.5 font-mono uppercase tracking-widest">
                {String(filteredProducts.length).padStart(2, "0")} PRODUK DITEMUKAN
              </p>
            </div>
            {(searchQuery || activeCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                }}
                className="text-[11px] text-[#dc2626] font-black uppercase tracking-[0.25em] border-2 border-[#dc2626] px-3 py-2 hover:bg-[#dc2626] hover:text-white transition-colors self-start"
              >
                ATUR ULANG
              </button>
            )}
          </div>

          {/* Category pills */}
          <section>
            <CategoryPills
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
          </section>

          {/* Product grid */}
          <ProductGrid products={filteredProducts} />
        </div>
      </main>

      {/* Brutalist footer */}
      <footer className="border-t-4 border-[#dc2626] bg-[#0a0a0a] mt-8">
        <div className="bg-stripes-red">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#dc2626] italic tracking-tighter">
                NXTY
              </span>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white border-l-2 border-[#dc2626] pl-2">
                FIGHTWEAR
              </span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 font-mono">
                LAHIR UNTUK BERTEMPUR · DIBUAT TAHAN LAMA · ANXIETY FIGHTWEAR
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700 mt-1">
                © 2024 ANXIETY FIGHTWEAR · ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import productsData from "@/data/products.json";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";
import ScrollToTop from "@/components/ScrollToTop";
import type { Product } from "@/types";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = useMemo(() => {
    const q = searchParams?.get("q") || "";
    return decodeURIComponent(q);
  }, [searchParams]);

  // Filter states from URL
  const selectedCategory = useMemo(() => {
    const cat = searchParams?.get("category");
    return cat ? decodeURIComponent(cat) : null;
  }, [searchParams]);
  
  const minPrice = useMemo(() => {
    const min = searchParams?.get("min");
    return min ? parseInt(min, 10) : null;
  }, [searchParams]);
  
  const maxPrice = useMemo(() => {
    const max = searchParams?.get("max");
    return max ? parseInt(max, 10) : null;
  }, [searchParams]);

  // Filter products based on all criteria
  const filteredProducts: Product[] = useMemo(() => {
    let result = productsData.products;
    
    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    
    // Filter by min price
    if (minPrice !== null) {
      result = result.filter((p) => p.price >= minPrice);
    }
    
    // Filter by max price
    if (maxPrice !== null) {
      result = result.filter((p) => p.price <= maxPrice);
    }
    
    return result;
  }, [query, selectedCategory, minPrice, maxPrice]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(productsData.products.map((p) => p.category));
    return Array.from(set).sort();
  }, []);

  // Price buckets
  const priceBuckets = [
    { label: "Rp 0-100k", min: 0, max: 100000 },
    { label: "Rp 100k-300k", min: 100000, max: 300000 },
    { label: "Rp 300k-500k", min: 300000, max: 500000 },
    { label: "Rp 500k+", min: 500000, max: Infinity },
  ];

  // Build URL with filters
  const buildUrl = useCallback((params: Record<string, string | null>) => {
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (params.category) urlParams.set("category", params.category);
    if (params.min) urlParams.set("min", params.min);
    if (params.max) urlParams.set("max", params.max);
    
    const queryString = urlParams.toString();
    return `/products/search${queryString ? `?${queryString}` : ""}`;
  }, [query]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string | null) => {
    const params: Record<string, string | null> = {
      category: category,
      min: null,
      max: null,
    };
    router.push(buildUrl(params));
  }, [router, buildUrl]);

  // Handle price filter
  const handlePriceFilter = useCallback((bucket: typeof priceBuckets[0]) => {
    const params: Record<string, string | null> = {
      category: selectedCategory,
      min: bucket.min.toString(),
      max: bucket.max === Infinity ? null : bucket.max.toString(),
    };
    router.push(buildUrl(params));
  }, [router, buildUrl, selectedCategory]);

  // Handle search from Navbar
  const handleSearch = useCallback((newQuery: string) => {
    if (newQuery.trim()) {
      router.push(`/products/search?q=${encodeURIComponent(newQuery.trim())}`);
    } else {
      router.push("/products/search");
    }
  }, [router]);

  // Handle reset
  const handleReset = useCallback(() => {
    router.push("/products/search");
  }, [router]);

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
                {query || selectedCategory || minPrice !== null || maxPrice !== null
                  ? `${String(filteredProducts.length).padStart(2, "0")} PRODUK DITEMUKAN`
                  : "Silakan masukkan kata kunci untuk mencari produk"}
              </p>
            </div>
            {(query || selectedCategory || minPrice !== null || maxPrice !== null) && (
              <button
                onClick={handleReset}
                className="text-[11px] text-[#dc2626] font-black uppercase tracking-[0.25em] border-2 border-[#dc2626] px-3 py-2 hover:bg-[#dc2626] hover:text-white transition-colors self-start"
              >
                ATUR ULANG
              </button>
            )}
          </div>

          {/* Category Filter */}
          {query && (
            <section>
              <div className="flex flex-wrap gap-2 py-3 border-b-2 border-[#262626]">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`shrink-0 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-l-0 transition-colors min-h-[44px] ${
                    selectedCategory === null
                      ? "bg-[#dc2626] border-[#dc2626] text-white"
                      : "bg-transparent border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626]"
                  }`}
                >
                  ALL
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`shrink-0 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-l-0 transition-colors min-h-[44px] ${
                      selectedCategory === cat
                        ? "bg-[#dc2626] border-[#dc2626] text-white"
                        : "bg-transparent border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Price Filter */}
          {query && (
            <section>
              <div className="flex flex-wrap gap-2 py-3 border-b-2 border-[#262626]">
                {priceBuckets.map((bucket) => {
                  const isActive =
                    minPrice === bucket.min &&
                    (maxPrice === bucket.max || (bucket.max === Infinity && maxPrice === null));
                  
                  return (
                    <button
                      key={`${bucket.min}-${bucket.max}`}
                      onClick={() => handlePriceFilter(bucket)}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-l-0 transition-colors min-h-[44px] ${
                        isActive
                          ? "bg-[#dc2626] border-[#dc2626] text-white"
                          : "bg-transparent border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626]"
                      }`}
                    >
                      {bucket.label}
                    </button>
                  );
                })}
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

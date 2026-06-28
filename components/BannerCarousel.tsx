"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Promotion } from "@/types";

interface BannerCarouselProps {
  banners: Promotion[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const current = banners[index];

  const next = () => setIndex((i) => (i + 1) % banners.length);
  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#161616] border-2 border-[#dc2626] overflow-hidden group">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={b.image || ""}
            alt={b.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/70 to-transparent" />
          {/* Stripes */}
          <div className="absolute inset-0 bg-stripes-red pointer-events-none" />
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className="max-w-md">
                {b.badge && (
                  <div className="inline-block bg-[#dc2626] text-white text-[10px] font-black tracking-[0.3em] px-2.5 py-1 mb-3 border border-[#0a0a0a]">
                    {b.badge}
                  </div>
                )}
                <p className="text-[10px] font-mono text-[#dc2626] tracking-[0.3em] uppercase mb-2">
                  // PROMO / 0{i + 1}
                </p>
                <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter italic mb-2 leading-[0.85]">
                  {b.title}
                </h2>
                {b.subtitle && (
                  <p className="text-sm sm:text-base font-black text-white uppercase tracking-wide mb-2">
                    {b.subtitle}
                  </p>
                )}
                {b.description && (
                  <p className="text-xs sm:text-sm text-neutral-300 mb-4 leading-relaxed line-clamp-2">
                    {b.description}
                  </p>
                )}
                {b.ctaHref && (
                  <Link
                    href={b.ctaHref}
                    className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-white hover:text-[#dc2626] text-white px-5 py-3 text-xs font-black uppercase tracking-[0.25em] transition-colors"
                  >
                    {b.ctaLabel || "LIHAT PROMO"}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-[#0a0a0a]/80 hover:bg-[#dc2626] border border-[#262626] hover:border-[#dc2626] flex items-center justify-center transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-[#0a0a0a]/80 hover:bg-[#dc2626] border border-[#262626] hover:border-[#dc2626] flex items-center justify-center transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1 transition-all ${
                  i === index ? "w-8 bg-[#dc2626]" : "w-3 bg-[#262626] hover:bg-[#404040]"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

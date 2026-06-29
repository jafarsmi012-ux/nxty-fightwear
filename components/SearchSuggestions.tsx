"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface SearchSuggestionsProps {
  suggestions: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    image: string;
  }>;
  onClose: () => void;
  isOpen: boolean;
}

export default function SearchSuggestions({
  suggestions,
  onClose,
  isOpen,
}: SearchSuggestionsProps) {
  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-16 sm:top-[72px] left-0 right-0 z-50 bg-[#0a0a0a] border-2 border-[#dc2626] shadow-[0_4px_0_#dc2626] overflow-hidden"
      role="listbox"
      aria-label="Hasil pencarian"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b-2 border-[#262626] flex items-center justify-between bg-[#161616]">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#dc2626]">
            HASIL PENCARIAN
            <span className="ml-2 font-mono text-white">
              [{suggestions.length}]
            </span>
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-[#262626] flex items-center justify-center hover:bg-[#dc2626] hover:border-[#dc2626] transition-colors"
            aria-label="Tutup pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                className="flex gap-3 px-4 py-4 border-b-2 border-[#262626] last:border-b-0 hover:bg-[#161616] transition-colors group"
                onClick={onClose}
                role="option"
                aria-label={`Lihat ${item.name}`}
              >
                {/* Index */}
                <div className="text-[10px] font-mono font-black text-[#dc2626] pt-1 w-5 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {/* Image */}
                <div className="relative w-16 h-16 bg-[#161616] overflow-hidden shrink-0 border border-[#262626]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="64px"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-black text-white line-clamp-2 uppercase group-hover:text-[#dc2626]">
                    {item.name}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500 mt-1 uppercase tracking-wider">
                    {item.category}
                  </p>
                </div>

                <Search className="w-4 h-4 text-neutral-600 group-hover:text-[#dc2626] shrink-0" />
              </Link>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <Search className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-lg font-black text-white uppercase tracking-tighter mb-1">
                TIDAK DITEMUKAN
              </p>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em]">
                // coba kata kunci lain
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

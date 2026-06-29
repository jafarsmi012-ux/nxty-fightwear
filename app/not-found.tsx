"use client";

import { Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top marquee strip - red */}
      <div className="bg-[#dc2626] text-white overflow-hidden border-b-2 border-[#0a0a0a]">
        <div className="flex animate-marquee whitespace-nowrap py-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {["404 - HALAMAN TIDAK DITEMUKAN", "SIAP TEMPUR", "LAHIR UNTUK BERTEMPUR"].map(
                (t, j) => (
                  <span
                    key={j}
                    className="px-6 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] flex items-center gap-5"
                  >
                    {t}
                    <span className="text-[#0a0a0a] text-base leading-none">★</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNkYzI2MjYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-30"></div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #dc2626 10px, #dc2626 12px)",
            }}
          />
        </div>

        <div className="max-w-md w-full text-center relative z-10 space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#dc2626] font-black text-4xl tracking-tighter italic">
              NXTY
            </span>
            <span className="font-black text-lg uppercase tracking-[0.25em] text-white border-l-2 border-[#dc2626] pl-3">
              FIGHTWEAR
            </span>
          </div>

          {/* Error Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#dc2626] blur-xl opacity-30 rounded-full"></div>
            <div className="relative w-24 h-24 mx-auto bg-[#dc2626] rounded-full flex items-center justify-center border-4 border-[#0a0a0a]">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Error Title */}
          <div>
            <p className="text-[10px] font-black text-[#dc2626] uppercase tracking-[0.3em] mb-2 font-mono">
              ERROR 404
            </p>
            <h1 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter italic">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 font-mono uppercase tracking-widest">
              Maaf, halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#dc2626] text-white text-sm font-black uppercase tracking-[0.2em] border-4 border-[#0a0a0a] hover:bg-[#ef4444] hover:border-[#dc2626] active:translate-x-1 active:translate-y-1 active:border-[#0a0a0a] transition-all min-h-[60px]"
            >
              <Home className="w-5 h-5" />
              <span>Kembali ke Homepage</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-8 py-4 bg-[#262626] text-white text-sm font-black uppercase tracking-[0.2em] border-4 border-[#0a0a0a] hover:bg-[#333333] active:translate-x-1 active:translate-y-1 active:border-[#0a0a0a] transition-all min-h-[60px]"
            >
              Kembali ke Halaman Sebelumnya
            </button>
          </div>

          {/* Extra Info */}
          <div className="pt-8 border-t-4 border-[#dc2626]">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 font-mono">
              Jika masalah berlanjut, silakan hubungi kami di anxietyfightwear@gmail.com
            </p>
          </div>
        </div>
      </main>

      {/* Brutalist footer */}
      <footer className="border-t-4 border-[#dc2626] bg-[#0a0a0a]">
        <div className="bg-stripes-red">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#dc2626] italic tracking-tighter">
                NXTY
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white border-l-2 border-[#dc2626] pl-2">
                FIGHTWEAR
              </span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 font-mono">
                LAHIR UNTUK BERTEMPUR · DIBUAT TAHAN LAMA · ANXIETY FIGHTWEAR
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-800 mt-1">
                © 2024 ANXIETY FIGHTWEAR · ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

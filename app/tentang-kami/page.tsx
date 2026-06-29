"use client";

import Link from "next/link";
import { ChevronLeft, Target, Flame, Shield } from "lucide-react";

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#262626]">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="p-3 -ml-2">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <h1 className="text-sm font-bold text-white">Tentang Kami</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">NXTY Fightwear</h2>
          <p className="text-sm text-red-500 font-medium">Born to Fight. Built to Last.</p>
        </div>

        <p className="text-sm text-neutral-400 leading-relaxed mb-6 text-center">
          Anxiety Fightwear adalah brand peralatan olahraga beladiri asal Bandung yang berdiri sejak tahun 2014. Seluruh produk diproduksi di pabrik milik kami sendiri sehingga kualitas tetap terjaga dengan harga yang kompetitif.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Misi Kami</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Menyediakan peralatan olahraga berkualitas tinggi dengan harga terjangkau, sehingga setiap fighter bisa latihan dengan gear terbaik tanpa harus merogoh kocek dalam.
              </p>
            </div>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Semangat</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Kami percaya bahwa fighter sejati tidak lahir, melainkan dibuat. Dengan latihan yang konsisten dan perlengkapan yang tepat, siapa pun bisa mencapai level terbaiknya.
              </p>
            </div>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Garansi</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Setiap produk kami dijamin kualitasnya. Jika ada cacat produksi, kami siap melakukan penukaran atau pengembalian dana sesuai kebijakan yang berlaku.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Jelajahi Produk
          </Link>
        </div>
      </div>
    </div>
  );
}

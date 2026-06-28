"use client";

import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, MapPin, Clock } from "lucide-react";

export default function KontakPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-[#262626]">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <h1 className="text-sm font-bold text-white">Kontak</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-neutral-400 mb-6 text-center leading-relaxed">
          Ada pertanyaan atau perlu bantuan? Hubungi tim NXTY Fightwear.
        </p>

        <div className="flex flex-col gap-3">
          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">email</p>
              <p className="text-sm font-medium text-white">support@nxtyfightwear.id</p>
            </div>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">WhatsApp</p>
              <p className="text-sm font-medium text-white">+62 895-2484-0900</p>
            </div>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">Alamat</p>
              <p className="text-sm font-medium text-white">
                Jl. Barunagri No. 60, RT 02/RW 11, Desa Sukajaya, Kec. Lembang, Bandung, West Java, Indonesia
              </p>
            </div>
          </div>

          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">Jam Operasional</p>
              <p className="text-sm font-medium text-white">Senin-Sabtu, 09.00 - 18.00 WIB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

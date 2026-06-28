"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Home, HelpCircle } from "lucide-react";

function PendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "-";

  return (
    <div className="text-center max-w-sm w-full">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600/10 rounded-full mb-4">
        <Clock className="w-8 h-8 text-yellow-500" />
      </div>
      <h1 className="text-xl font-black text-white mb-2">Menunggu Pembayaran</h1>
      <p className="text-sm text-neutral-400 mb-1">
        Pembayaran kamu sedang diproses.
      </p>
      <p className="text-xs text-neutral-600 mb-6">Order ID: {orderId}</p>

      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 text-left mb-6">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Apa yang harus dilakukan?</p>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
              Silakan selesaikan pembayaran sesuai instruksi yang dikirimkan. Status akan diupdate secara otomatis.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        <Link
          href="/kontak"
          className="w-full py-3 border border-[#262626] text-neutral-400 font-semibold text-sm rounded-xl hover:bg-[#161616] flex items-center justify-center transition-colors"
        >
          Hubungi Kami
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Memuat...</p>
        </div>
      }>
        <PendingContent />
      </Suspense>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ChevronLeft } from "lucide-react";
import { signInWithEmail, verifyOtp } from "@/lib/supabase/customer";

export default function MasukPage() {
  const [mode, setMode] = useState<"link" | "otp">("link");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "verify" | "sent">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, mode === "otp");
      if (mode === "otp") {
        setStep("verify");
      } else {
        setStep("sent");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim link";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      // Will redirect via auth state listener
      window.location.href = "/akun";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kode OTP salah";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-neutral-400 hover:text-white mb-6 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </Link>

        <div className="bg-[#161616] border-2 border-[#262626] p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-white tracking-tighter">
              <span className="text-[#dc2626]">NXTY</span>{" "}
              <span className="text-white text-xl tracking-[0.2em]">FIGHTWEAR</span>
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Masuk untuk melanjutkan belanja
            </p>
          </div>

          {step === "input" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dc2626]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full bg-[#0a0a0a] text-white pl-10 pr-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600"
                  />
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("link")}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider border-2 transition-colors ${
                    mode === "link"
                      ? "bg-[#dc2626] border-[#dc2626] text-white"
                      : "bg-transparent border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626]"
                  }`}
                >
                  Kirim Link
                </button>
                <button
                  type="button"
                  onClick={() => setMode("otp")}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider border-2 transition-colors ${
                    mode === "otp"
                      ? "bg-[#dc2626] border-[#dc2626] text-white"
                      : "bg-transparent border-[#262626] text-neutral-400 hover:border-[#dc2626] hover:text-[#dc2626]"
                  }`}
                >
                  Kirim OTP
                </button>
              </div>

              {error && (
                <div className="bg-[#dc2626]/10 border border-[#dc2626] text-[#dc2626] text-xs p-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#dc2626] text-white font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:bg-[#262626] disabled:text-neutral-600 disabled:cursor-not-allowed min-h-[48px]"
              >
                {loading ? "Mengirim..." : "Kirim"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-neutral-400 text-center">
                Masukkan 6 digit kode yang dikirim ke <strong>{email}</strong>
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full bg-[#0a0a0a] text-white text-center text-2xl tracking-[0.5em] py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none font-mono"
              />
              {error && (
                <div className="bg-[#dc2626]/10 border border-[#dc2626] text-[#dc2626] text-xs p-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-[#dc2626] text-white font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:bg-[#262626] disabled:text-neutral-600 disabled:cursor-not-allowed min-h-[48px]"
              >
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setOtp("");
                  setError(null);
                }}
                className="w-full text-xs text-neutral-400 hover:text-white"
              >
                Kembali
              </button>
            </form>
          )}

          {step === "sent" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-2 border-[#dc2626] flex items-center justify-center">
                <Mail className="w-7 h-7 text-[#dc2626]" />
              </div>
              <p className="text-sm text-white font-bold">
                Cek email Anda
              </p>
              <p className="text-xs text-neutral-400">
                Kami sudah mengirim link login ke <strong>{email}</strong>.
                Klik link tersebut untuk masuk.
              </p>
              <Link
                href="/"
                className="inline-block text-xs text-[#dc2626] hover:text-white underline"
              >
                Kembali ke beranda
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

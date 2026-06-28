"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data: { success?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok || !data.success) {
        const message = data.error ?? "Login gagal";
        setError(message);
        showToast("info", message);
        setLoading(false);
        return;
      }

      showToast("success", "Login berhasil");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Tidak dapat menghubungi server";
      setError(message);
      showToast("info", message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black tracking-tighter text-white">
            NXTY
          </h1>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626]">
            Admin Panel
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#0a0a0a] border-2 border-white p-6"
        >
          <label
            htmlFor="password"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2"
          >
            Password Admin
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
            className="w-full bg-black border-2 border-white text-white px-3 py-3 text-sm font-bold placeholder:text-neutral-600 focus:outline-none focus:border-[#dc2626] disabled:opacity-50"
          />

          {error && (
            <p
              role="alert"
              className="mt-4 border-2 border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626] text-xs font-bold px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-5 w-full bg-[#dc2626] text-white font-black uppercase tracking-wider text-sm py-3 border-2 border-[#dc2626] hover:bg-white hover:text-[#dc2626] hover:border-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-600">
          Akses terbatas. Hanya untuk staff NXTY.
        </p>
      </div>
    </div>
  );
}

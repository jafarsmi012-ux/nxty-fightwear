"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  userId: string;
  email: string;
  initialName: string;
  initialPhone: string;
}

export default function ProfileForm({
  userId,
  email,
  initialName,
  initialPhone,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("customer_profiles")
        .upsert(
          { id: userId, full_name: name, phone },
          { onConflict: "id" }
        );
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full bg-[#161616] text-neutral-500 px-3 py-3 border-2 border-[#262626]"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Nama Lengkap
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Nomor HP
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxx"
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600"
        />
      </div>

      {success && (
        <div className="border border-green-600 text-green-500 text-xs p-2">
          Profil berhasil disimpan
        </div>
      )}
      {error && (
        <div className="border border-[#dc2626] text-[#dc2626] text-xs p-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 bg-[#dc2626] text-white text-sm font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:bg-[#262626] disabled:text-neutral-600 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Simpan
          </>
        )}
      </button>
    </form>
  );
}

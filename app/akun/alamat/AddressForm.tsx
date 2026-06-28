"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddressData {
  id?: string;
  label: string;
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
}

interface AddressFormProps {
  mode: "create" | "edit";
  addressId?: string;
  initialData?: AddressData;
}

const LABELS = ["Rumah", "Kantor", "Apartemen", "Kos", "Lainnya"];

export function AddressForm({ mode, addressId, initialData }: AddressFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<AddressData>({
    label: initialData?.label || "Rumah",
    recipient_name: initialData?.recipient_name || "",
    phone: initialData?.phone || "",
    street: initialData?.street || "",
    city: initialData?.city || "",
    province: initialData?.province || "",
    postal_code: initialData?.postal_code || "",
    is_default: initialData?.is_default ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof AddressData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak login");

      // If set as default, unset other defaults
      if (form.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", user.id);
      }

      if (mode === "create") {
        const { error } = await supabase.from("customer_addresses").insert({
          customer_id: user.id,
          label: form.label,
          recipient_name: form.recipient_name,
          phone: form.phone,
          street: form.street,
          city: form.city,
          province: form.province,
          postal_code: form.postal_code,
          is_default: form.is_default,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_addresses")
          .update({
            label: form.label,
            recipient_name: form.recipient_name,
            phone: form.phone,
            street: form.street,
            city: form.city,
            province: form.province,
            postal_code: form.postal_code,
            is_default: form.is_default,
          })
          .eq("id", addressId);
        if (error) throw error;
      }

      router.push("/akun/alamat");
      router.refresh();
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
          Label Alamat
        </label>
        <select
          value={form.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
        >
          {LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Nama Penerima
        </label>
        <input
          type="text"
          required
          value={form.recipient_name}
          onChange={(e) => handleChange("recipient_name", e.target.value)}
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Nomor HP
        </label>
        <input
          type="tel"
          required
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Alamat Lengkap
        </label>
        <textarea
          required
          rows={3}
          value={form.street}
          onChange={(e) => handleChange("street", e.target.value)}
          placeholder="Jl. ..., RT/RW, Kelurahan..."
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
            Kota
          </label>
          <input
            type="text"
            required
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
            Provinsi
          </label>
          <input
            type="text"
            required
            value={form.province}
            onChange={(e) => handleChange("province", e.target.value)}
            className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
          Kode Pos
        </label>
        <input
          type="text"
          required
          value={form.postal_code}
          onChange={(e) => handleChange("postal_code", e.target.value)}
          className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => handleChange("is_default", e.target.checked)}
          className="w-4 h-4 accent-[#dc2626]"
        />
        <span className="text-sm text-white">Jadikan alamat utama</span>
      </label>

      {error && (
        <div className="border border-[#dc2626] text-[#dc2626] text-xs p-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
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
        <button
          type="button"
          onClick={() => router.push("/akun/alamat")}
          className="px-5 py-3 border-2 border-[#262626] text-white text-sm font-black uppercase tracking-wider hover:bg-[#161616] min-h-[48px]"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

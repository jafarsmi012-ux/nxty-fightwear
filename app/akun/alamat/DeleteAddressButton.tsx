"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DeleteAddressButtonProps {
  addressId: string;
}

export default function DeleteAddressButton({ addressId }: DeleteAddressButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Hapus alamat ini?")) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", addressId);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus alamat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-9 h-9 border-2 border-[#262626] flex items-center justify-center hover:bg-[#dc2626] hover:border-[#dc2626] disabled:opacity-50"
      aria-label="Hapus"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}

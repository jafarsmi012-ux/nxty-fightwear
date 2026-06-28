import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import PromoForm, { type ProductOption } from "../PromoForm";

export const dynamic = "force-dynamic";

async function loadProducts(): Promise<ProductOption[]> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [] as never;
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    // Form tetap bisa dirender; akan menampilkan pesan "belum ada produk".
    return [];
  }
  return (data ?? []) as ProductOption[];
}

export default async function NewPromoPage() {
  const products = await loadProducts();

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link
        href="/admin/promo"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-[#dc2626] transition-colors mb-6"
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        Kembali ke daftar promo
      </Link>

      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
          Promo Baru
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Tambah Promo
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          Buat banner, flash sale, voucher, bundle, atau add-on baru untuk
          toko NXTY Fightwear.
        </p>
      </div>

      <PromoForm mode="create" products={products} />
    </div>
  );
}

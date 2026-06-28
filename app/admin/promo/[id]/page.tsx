import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { Promotion } from "@/types/database";
import PromoForm, { type ProductOption } from "../PromoForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadPromo(id: string): Promise<Promotion | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [] as never;
  }
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Promotion;
}

async function loadProducts(): Promise<ProductOption[]> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [] as never;
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as ProductOption[];
}

export default async function EditPromoPage({ params }: PageProps) {
  const { id } = await params;
  const [promo, products] = await Promise.all([loadPromo(id), loadProducts()]);

  if (!promo) {
    notFound();
  }

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
          Edit Promo
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white line-clamp-2">
          {promo.title}
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          Tipe:{" "}
          <span className="text-white font-black uppercase tracking-wider">
            {promo.type}
          </span>
          {" · "}
          Prioritas:{" "}
          <span className="text-white font-black">{promo.priority}</span>
        </p>
      </div>

      <PromoForm mode="edit" products={products} initial={promo} />
    </div>
  );
}

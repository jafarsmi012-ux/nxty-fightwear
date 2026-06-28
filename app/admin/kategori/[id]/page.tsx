import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link
        href="/admin/kategori"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-[#dc2626] transition-colors mb-6"
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        Kembali ke daftar kategori
      </Link>

      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
          Edit Kategori
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          {data.name}
        </h1>
        <p className="text-sm text-neutral-400 mt-2 font-mono">{data.slug}</p>
      </div>

      <CategoryForm mode="edit" initial={data} />
    </div>
  );
}

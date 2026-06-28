import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";
import CategoryActions from "./CategoryActions";

export const dynamic = "force-dynamic";

async function loadCategoriesWithCount(): Promise<
  Array<Category & { product_count: number }>
> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [] as never;
  }

  try {
    // Parallel fetch: kategori + semua product (hanya category_id) untuk count.
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase.from("products").select("category_id"),
    ]);

    if (categoriesRes.error) {
      console.warn("[admin/kategori] categories error:", categoriesRes.error.message);
      return [];
    }

  const counts = new Map<string, number>();
  for (const row of productsRes.data ?? []) {
    const catId = (row as { category_id: string | null }).category_id;
    if (!catId) continue;
    counts.set(catId, (counts.get(catId) ?? 0) + 1);
  }

    return (categoriesRes.data ?? []).map((cat) => ({
      ...cat,
      product_count: counts.get(cat.id) ?? 0,
    }));
  } catch (err) {
    console.warn("[admin/kategori] fetch failed:", err);
    return [];
  }
}

export default async function KategoriListPage() {
  const categories = await loadCategoriesWithCount();

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-4 mb-6 flex-col md:flex-row">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
            Manajemen
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Kategori
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Kelola kategori produk NXTY Fightwear.
          </p>
        </div>
        <Link
          href="/admin/kategori/baru"
          className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tambah Kategori
        </Link>
      </div>

      {/* Tabel */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] overflow-x-auto">
        {categories.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
              Belum ada kategori
            </p>
            <p className="text-[11px] text-neutral-600 mb-4">
              Tambahkan kategori pertama untuk mulai mengelompokkan produk.
            </p>
            <Link
              href="/admin/kategori/baru"
              className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              Tambah Kategori
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#dc2626] text-white">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-12">
                  #
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626]">
                  Nama
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626]">
                  Slug
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-32">
                  Jumlah Produk
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-44">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className="border-t-2 border-[#262626] hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-black text-neutral-400 border-r-2 border-[#262626]">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-white border-r-2 border-[#262626]">
                    {cat.name}
                    {cat.description ? (
                      <p className="mt-1 text-[11px] font-normal text-neutral-500 line-clamp-1">
                        {cat.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-300 border-r-2 border-[#262626] font-mono">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-xs font-black text-white border-r-2 border-[#262626]">
                    <span
                      className={
                        cat.product_count > 0
                          ? "inline-block bg-white text-[#0a0a0a] px-2 py-1"
                          : "inline-block bg-[#161616] text-neutral-500 px-2 py-1 border border-[#262626]"
                      }
                    >
                      {cat.product_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryActions id={cat.id} name={cat.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

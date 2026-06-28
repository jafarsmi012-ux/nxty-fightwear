import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product, ProductImage, Category } from "@/types/database";
import ProductForm, {
  type CategoryOption,
  type ProductInitial,
} from "../ProductForm";
import type { ImageItem } from "@/components/admin/ImageUploader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

interface ProductRow extends Product {
  category: Category | Category[] | null;
  images: ProductImage[] | null;
}

function normalizeCategory(c: Category | Category[] | null): Category | null {
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

function toImageItems(images: ProductImage[] | null): ImageItem[] {
  if (!images) return [];
  return [...images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      url: img.url,
      sort_order: img.sort_order,
    }));
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, category:categories(id, name, slug, description, created_at), images:product_images(id, url, sort_order, product_id, created_at)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  if (productRes.error) {
    return (
      <div className="p-4 md:p-8 max-w-4xl">
        <p className="text-sm text-[#dc2626] font-black uppercase tracking-wider">
          Error: {productRes.error.message}
        </p>
      </div>
    );
  }
  if (!productRes.data) {
    notFound();
  }

  const row = productRes.data as ProductRow;
  const category = normalizeCategory(row.category);

  const initial: ProductInitial = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category_id: category?.id ?? null,
    description: row.description,
    price: row.price,
    original_price: row.original_price,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    rating: row.rating,
    reviews_count: row.reviews_count,
    featured: row.featured,
    in_stock: row.in_stock,
    weight_grams: row.weight_grams,
    images: toImageItems(row.images),
  };

  const categories: CategoryOption[] = (categoriesRes.data ??
    []) as CategoryOption[];

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <Link
        href="/admin/produk"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-[#dc2626] transition-colors mb-6"
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        Kembali ke daftar produk
      </Link>

      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
          Edit Produk
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          {row.name}
        </h1>
        <p className="text-sm text-neutral-500 mt-2 font-mono">{row.slug}</p>
      </div>

      <ProductForm mode="edit" categories={categories} initial={initial} />
    </div>
  );
}

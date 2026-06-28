import { createAdminClient } from "@/lib/supabase/server";
import type { ProductImage } from "@/types/database";
import ProductListClient, { type ProductRow } from "./ProductListClient";

export const dynamic = "force-dynamic";

interface RawCategory {
  id: string;
  name: string;
  slug: string;
}

async function loadData(): Promise<{
  products: ProductRow[];
  categories: RawCategory[];
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [] as never;
  }
  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, price, original_price, featured, in_stock, category:categories(id, name, slug), images:product_images(id, url, sort_order)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  if (productsRes.error) {
    console.warn("[admin] productsRes error:", productsRes.error.message);
    return { products: [], categories: (categoriesRes.data ?? []) as RawCategory[] };
  }
  if (categoriesRes.error) {
    console.warn("[admin] categoriesRes error:", categoriesRes.error.message);
    return { products: (productsRes.data ?? []) as any, categories: [] };
  }

  const rows = (productsRes.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    original_price: number | null;
    featured: boolean;
    in_stock: boolean;
    category: RawCategory | RawCategory[] | null;
    images: ProductImage[] | null;
  }>;

  const products: ProductRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    original_price: row.original_price,
    featured: row.featured,
    in_stock: row.in_stock,
    category: Array.isArray(row.category) ? (row.category[0] ?? null) : row.category,
    images: row.images ?? [],
  }));

  return {
    products,
    categories: (categoriesRes.data ?? []) as RawCategory[],
  };
}

export default async function ProdukListPage() {
  const { products, categories } = await loadData();

  return (
    <ProductListClient products={products} categories={categories} />
  );
}

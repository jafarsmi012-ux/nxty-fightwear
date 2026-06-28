import { createAdminClient } from "@/lib/supabase/server";
import type {
  LegacyProduct,
  Product,
  ProductWithRelations,
  Promotion,
} from "@/types/database";
import legacyProductsData from "@/data/products.json";
import legacyPromotionsData from "@/data/promotions.json";

// Legacy JSON shapes (from data/*.json)
interface LegacyJson {
  products: LegacyProduct[];
}
interface LegacyPromoJson {
  promotions: Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    badge?: string;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    minPurchase?: number;
    flashPrice?: number;
    flashStock?: number;
    productIds?: string[];
    endTime?: string;
    ctaLabel?: string;
    ctaHref?: string;
    priority?: number;
  }>;
}

/**
 * Cek apakah Supabase sudah dikonfigurasi (env vars tersedia).
 * Kalau tidak, fallback ke JSON lokal.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Helper untuk membaca slug kategori dari JSON legacy ke nama kategori.
 * Di data lama, product.category = string nama kategori.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetch semua produk + relasi (kategori, images) dari Supabase.
 * Falls back ke data JSON lokal jika Supabase belum disetup.
 */
export async function getProducts(): Promise<ProductWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return mapLegacyProducts();
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) return mapLegacyProducts();    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("in_stock", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(
        "[storefront] Gagal fetch dari Supabase, fallback ke JSON:",
        error.message,
      );
      return mapLegacyProducts();
    }
    return (data ?? []) as ProductWithRelations[];
  } catch (err) {
    console.warn(
      "[storefront] Error fetch dari Supabase, fallback ke JSON:",
      err,
    );
    return mapLegacyProducts();
  }
}

/**
 * Fetch satu produk by slug.
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  if (!isSupabaseConfigured()) {
    const all = mapLegacyProducts();
    return all.find((p) => p.slug === slug) ?? null;
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.warn("[storefront] getProductBySlug error:", error.message);
      return null;
    }
    return (data as ProductWithRelations | null) ?? null;
  } catch (err) {
    console.warn("[storefront] getProductBySlug exception:", err);
    return null;
  }
}

/**
 * Fetch semua promotions aktif dari Supabase.
 */
export async function getPromotions(): Promise<Promotion[]> {
  if (!isSupabaseConfigured()) {
    return mapLegacyPromotions();
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      console.warn(
        "[storefront] Gagal fetch promotions, fallback ke JSON:",
        error.message,
      );
      return mapLegacyPromotions();
    }
    return (data ?? []) as Promotion[];
  } catch (err) {
    console.warn("[storefront] promotions fallback:", err);
    return mapLegacyPromotions();
  }
}

/**
 * Admin: count statistik untuk dashboard.
 */
export async function getAdminStats(): Promise<{
  totalProducts: number;
  totalCategories: number;
  activePromotions: number;
  ordersToday: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      totalProducts: (legacyProductsData as LegacyJson).products.length,
      totalCategories: new Set(
        (legacyProductsData as LegacyJson).products.map((p) => p.category),
      ).size,
      activePromotions: (legacyPromotionsData as LegacyPromoJson).promotions.length,
      ordersToday: 0,
    };
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return {
        totalProducts: 0,
        totalCategories: 0,
        activePromotions: 0,
        ordersToday: 0,
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [productsRes, categoriesRes, promosRes, ordersRes] =
      await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("categories")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("promotions")
          .select("id", { count: "exact", head: true })
          .gt("end_time", new Date().toISOString()),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
      ]);

    return {
      totalProducts: productsRes.count ?? 0,
      totalCategories: categoriesRes.count ?? 0,
      activePromotions: promosRes.count ?? 0,
      ordersToday: ordersRes.count ?? 0,
    };
  } catch (err) {
    console.warn("[storefront] getAdminStats fallback:", err);
    return {
      totalProducts: 0,
      totalCategories: 0,
      activePromotions: 0,
      ordersToday: 0,
    };
  }
}

// ============================================================
// Legacy mappers (JSON → shape baru)
// ============================================================

function mapLegacyProducts(): ProductWithRelations[] {
  const json = legacyProductsData as LegacyJson;
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  json.products.forEach((p) => {
    const slug = slugify(p.category);
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        id: `legacy-cat-${slug}`,
        name: p.category,
        slug,
      });
    }
  });

  return json.products.map((p, idx): ProductWithRelations => {
    const slug = slugify(p.category);
    const cat = categoryMap.get(slug)!;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category_id: cat.id,
      description: p.description,
      price: p.price,
      original_price: p.originalPrice ?? null,
      sizes: p.sizes,
      colors: p.colors,
      rating: p.rating,
      reviews_count: p.reviewsCount,
      featured: p.featured ?? false,
      in_stock: p.inStock,
      weight_grams: 500,
      created_at: new Date(2026, 0, idx + 1).toISOString(),
      updated_at: new Date(2026, 0, idx + 1).toISOString(),
      category: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: null,
        created_at: new Date(2026, 0, 1).toISOString(),
      },
      images: p.images.map((url, i) => ({
        id: `legacy-img-${p.id}-${i}`,
        product_id: p.id,
        url,
        sort_order: i,
        created_at: new Date(2026, 0, 1).toISOString(),
      })),
    };
  });
}

function mapLegacyPromotions(): Promotion[] {
  const json = legacyPromotionsData as LegacyPromoJson;
  return json.promotions.map((p, idx) => ({
    id: p.id,
    type: (p.type as Promotion["type"]) ?? "banner",
    title: p.title,
    subtitle: p.subtitle ?? null,
    description: p.description ?? null,
    image: p.image ?? null,
    badge: p.badge ?? null,
    discount_type: p.discountType ?? null,
    discount_value: p.discountValue ?? null,
    min_purchase: p.minPurchase ?? null,
    flash_price: p.flashPrice ?? null,
    flash_stock: p.flashStock ?? null,
    product_ids: [],
    end_time: p.endTime ?? null,
    cta_label: p.ctaLabel ?? null,
    cta_href: p.ctaHref ?? null,
    priority: p.priority ?? 99,
    created_at: new Date(2026, 0, idx + 1).toISOString(),
    updated_at: new Date(2026, 0, idx + 1).toISOString(),
  }));
}

// Re-export Product untuk convenience
export type { Product, ProductWithRelations, Promotion };

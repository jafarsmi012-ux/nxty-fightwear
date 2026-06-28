/**
 * scripts/migrate-data.ts
 * Migrasi idempotent dari data/*.json ke Supabase.
 *
 * Usage:
 *   1. Set env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY di .env.local
 *   2. Run: npx tsx scripts/migrate-data.ts
 *
 * Strategy:
 *   - Extract unique categories dari products.json → upsert by slug
 *   - Insert/update products by slug (id di-generate Supabase, kita track id mapping)
 *   - Insert product_images (hapus dulu by product_id, lalu insert ulang)
 *   - Insert/update promotions by id
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Minimal .env.local loader (no external dep). Format: KEY=VALUE per line.
function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}
loadEnvLocal();

interface LegacyProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  sizes: string[];
  colors: string[];
  images: string[];
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  inStock: boolean;
}

interface LegacyJson {
  products: LegacyProduct[];
}

interface LegacyPromo {
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
}

interface LegacyPromoJson {
  promotions: LegacyPromo[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus di-set di .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const productsJson = JSON.parse(
    readFileSync(join(process.cwd(), "data/products.json"), "utf8"),
  ) as LegacyJson;
  const promosJson = JSON.parse(
    readFileSync(join(process.cwd(), "data/promotions.json"), "utf8"),
  ) as LegacyPromoJson;

  console.log(
    `[migrate] ${productsJson.products.length} produk, ${promosJson.promotions.length} promo`,
  );

  // 1. Categories — extract unique dari products
  const categoryMap = new Map<string, { name: string; slug: string }>();
  productsJson.products.forEach((p) => {
    const slug = slugify(p.category);
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, { name: p.category, slug });
    }
  });

  console.log(`[migrate] ${categoryMap.size} kategori unik`);

  const categorySlugToId = new Map<string, string>();
  for (const [slug, { name }] of categoryMap) {
    const { data, error } = await supabase
      .from("categories")
      .upsert({ name, slug, description: null }, { onConflict: "slug" })
      .select("id")
      .single();

    if (error) {
      console.error(`[migrate] Gagal upsert category ${slug}:`, error.message);
      continue;
    }
    categorySlugToId.set(slug, data.id);
    console.log(`  ✓ category ${name} → ${data.id}`);
  }

  // 2. Products — upsert by slug, lalu ambil/track id
  console.log(`[migrate] Inserting products...`);
  const productSlugToId = new Map<string, string>();
  const productLegacyIdToSlug = new Map<string, string>();

  for (const p of productsJson.products) {
    productLegacyIdToSlug.set(p.id, p.slug);
    const catSlug = slugify(p.category);
    const categoryId = categorySlugToId.get(catSlug) ?? null;

    const { data, error } = await supabase
      .from("products")
      .upsert(
        {
          name: p.name,
          slug: p.slug,
          category_id: categoryId,
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
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ ${p.slug}:`, error.message);
      continue;
    }
    productSlugToId.set(p.slug, data.id);

    // Hapus images lama, insert ulang
    await supabase
      .from("product_images")
      .delete()
      .eq("product_id", data.id);

    if (p.images.length > 0) {
      const imageRows = p.images.map((url, sort_order) => ({
        product_id: data.id,
        url,
        sort_order,
      }));
      const { error: imgErr } = await supabase
        .from("product_images")
        .insert(imageRows);
      if (imgErr) {
        console.error(`  ✗ images for ${p.slug}:`, imgErr.message);
      }
    }
  }
  console.log(`[migrate] ${productSlugToId.size} produk ter-migrate`);

  // 3. Promotions — upsert by id, map product_ids (legacy id → uuid)
  console.log(`[migrate] Inserting promotions...`);
  const validPromoTypes = new Set(["banner", "flash_sale", "voucher", "bundle", "add_on"]);
  for (const promo of promosJson.promotions) {
    // Skip invalid promotion types (legacy data may have types not in current schema)
    if (!validPromoTypes.has(promo.type)) {
      console.warn(`  ⚠ ${promo.id}: skip (invalid type: "${promo.type}")`);
      continue;
    }
    const mappedProductIds = (promo.productIds ?? [])
      .map((legacyId) => productSlugToId.get(productLegacyIdToSlug.get(legacyId) ?? ""))
      .filter((x): x is string => Boolean(x));

    const { error } = await supabase.from("promotions").upsert(
      {
        // Skip id — let Supabase generate UUID (legacy string IDs won't fit uuid column)
        type: promo.type,
        title: promo.title,
        subtitle: promo.subtitle ?? null,
        description: promo.description ?? null,
        image: promo.image ?? null,
        badge: promo.badge ?? null,
        discount_type: promo.discountType ?? null,
        discount_value: promo.discountValue ?? null,
        min_purchase: promo.minPurchase ?? null,
        flash_price: promo.flashPrice ?? null,
        flash_stock: promo.flashStock ?? null,
        product_ids: mappedProductIds,
        end_time: promo.endTime ?? null,
        cta_label: promo.ctaLabel ?? null,
        cta_href: promo.ctaHref ?? null,
        priority: promo.priority ?? 99,
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error(`  ✗ ${promo.id}:`, error.message);
    } else {
      console.log(`  ✓ ${promo.id} (${mappedProductIds.length} products)`);
    }
  }

  console.log("\n[migrate] Done!");
}

main().catch((err) => {
  console.error("[migrate] Fatal:", err);
  process.exit(1);
});

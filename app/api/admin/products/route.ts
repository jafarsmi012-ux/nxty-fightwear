import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verifikasi session admin dari cookie.
 * Mengembalikan null kalau valid, atau NextResponse 401 kalau tidak.
 */
async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * GET /api/admin/products
 * List semua produk + relasi kategori & images, diurutkan terbaru.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth) return auth;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id, name, slug), images:product_images(id, url, sort_order)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

/**
 * POST /api/admin/products
 * Buat produk baru. Body:
 * {
 *   name, slug, category_id?, description?,
 *   price, original_price?,
 *   sizes: string[], colors: string[],
 *   rating?, reviews_count?,
 *   featured?, in_stock?, weight_grams?,
 *   images?: Array<{ url: string; sort_order?: number }>
 * }
 *
 * Insert ke `products` lalu bulk insert images jika ada.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON valid" },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const priceRaw = body.price;
  const price =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string" && priceRaw.trim() !== ""
        ? Number(priceRaw)
        : NaN;

  if (!name) {
    return NextResponse.json(
      { error: "Nama produk wajib diisi" },
      { status: 400 },
    );
  }
  if (!slug) {
    return NextResponse.json(
      { error: "Slug produk wajib diisi" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "Harga produk wajib diisi (>= 0)" },
      { status: 400 },
    );
  }

  const sizes = Array.isArray(body.sizes)
    ? body.sizes.filter((s): s is string => typeof s === "string" && s.trim() !== "").map((s) => s.trim())
    : [];
  const colors = Array.isArray(body.colors)
    ? body.colors.filter((c): c is string => typeof c === "string" && c.trim() !== "").map((c) => c.trim())
    : [];

  const rating =
    typeof body.rating === "number" && Number.isFinite(body.rating)
      ? Math.max(0, Math.min(5, body.rating))
      : 4.5;
  const reviewsCount =
    typeof body.reviews_count === "number" && Number.isFinite(body.reviews_count)
      ? Math.max(0, Math.floor(body.reviews_count))
      : 0;

  const originalPrice =
    body.original_price === null ||
    body.original_price === undefined ||
    body.original_price === ""
      ? null
      : Number(body.original_price);
  if (
    originalPrice !== null &&
    (!Number.isFinite(originalPrice) || originalPrice < 0)
  ) {
    return NextResponse.json(
      { error: "Harga coret harus berupa angka >= 0" },
      { status: 400 },
    );
  }

  const weightGrams =
    typeof body.weight_grams === "number" && Number.isFinite(body.weight_grams)
      ? Math.max(0, Math.floor(body.weight_grams))
      : 500;

  const categoryId =
    typeof body.category_id === "string" && body.category_id.trim() !== ""
      ? body.category_id
      : null;

  const description =
    typeof body.description === "string" && body.description.trim() !== ""
      ? body.description.trim()
      : null;

  const featured = body.featured === true;
  const inStock = body.in_stock === false ? false : true;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }

  // Insert produk
  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      category_id: categoryId,
      description,
      price,
      original_price: originalPrice,
      sizes,
      colors,
      rating,
      reviews_count: reviewsCount,
      featured,
      in_stock: inStock,
      weight_grams: weightGrams,
    })
    .select("*, category:categories(id, name, slug)")
    .single();

  if (insertError || !product) {
    return NextResponse.json(
      { error: insertError?.message ?? "Gagal membuat produk" },
      { status: 400 },
    );
  }

  // Insert images jika ada
  const images = Array.isArray(body.images)
    ? (body.images as Array<{ url?: unknown; sort_order?: unknown }>)
    : [];

  const imageRows = images
    .map((img, idx) => {
      if (typeof img?.url !== "string" || img.url.trim() === "") return null;
      const sortOrder =
        typeof img.sort_order === "number" && Number.isFinite(img.sort_order)
          ? Math.max(0, Math.floor(img.sort_order))
          : idx;
      return { product_id: product.id, url: img.url.trim(), sort_order: sortOrder };
    })
    .filter((r): r is { product_id: string; url: string; sort_order: number } => r !== null);

  let insertedImages: unknown[] = [];
  if (imageRows.length > 0) {
    const { data: imgData, error: imgError } = await supabase
      .from("product_images")
      .insert(imageRows)
      .select("id, url, sort_order");
    if (imgError) {
      // Produk sudah terbuat; laporkan error tapi tetap kembalikan produk.
      return NextResponse.json(
        {
          ...(product as Record<string, unknown>),
          images: [],
          warning: `Produk dibuat, tapi gagal menyimpan gambar: ${imgError.message}`,
        },
        { status: 201 },
      );
    }
    insertedImages = imgData ?? [];
  }

  return NextResponse.json(
    { ...(product as Record<string, unknown>), images: insertedImages },
    { status: 201 },
  );
}

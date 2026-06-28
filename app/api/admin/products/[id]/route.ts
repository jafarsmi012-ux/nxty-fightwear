import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * GET /api/admin/products/[id]
 * Ambil satu produk + relasi.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id, name, slug), images:product_images(id, url, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(data);
}

/**
 * PUT /api/admin/products/[id]
 * Update produk. Body parsial; images (jika dikirim) akan diganti total:
 *   - hapus semua product_images lama untuk produk ini
 *   - insert ulang dengan sort_order berdasarkan urutan array
 *
 * Field yang didukung: name, slug, category_id, description, price,
 * original_price, sizes, colors, rating, reviews_count, featured,
 * in_stock, weight_grams, images.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON valid" },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Nama produk tidak boleh kosong" },
        { status: 400 },
      );
    }
    update.name = name;
  }
  if (typeof body.slug === "string") {
    const slug = body.slug.trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Slug produk tidak boleh kosong" },
        { status: 400 },
      );
    }
    update.slug = slug;
  }
  if (body.category_id !== undefined) {
    update.category_id =
      typeof body.category_id === "string" && body.category_id.trim() !== ""
        ? body.category_id
        : null;
  }
  if (body.description !== undefined) {
    update.description =
      typeof body.description === "string" && body.description.trim() !== ""
        ? body.description.trim()
        : null;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Harga produk harus angka >= 0" },
        { status: 400 },
      );
    }
    update.price = price;
  }
  if (body.original_price !== undefined) {
    if (
      body.original_price === null ||
      body.original_price === "" ||
      body.original_price === undefined
    ) {
      update.original_price = null;
    } else {
      const op = Number(body.original_price);
      if (!Number.isFinite(op) || op < 0) {
        return NextResponse.json(
          { error: "Harga coret harus angka >= 0" },
          { status: 400 },
        );
      }
      update.original_price = op;
    }
  }
  if (Array.isArray(body.sizes)) {
    update.sizes = body.sizes
      .filter((s): s is string => typeof s === "string" && s.trim() !== "")
      .map((s) => s.trim());
  }
  if (Array.isArray(body.colors)) {
    update.colors = body.colors
      .filter((c): c is string => typeof c === "string" && c.trim() !== "")
      .map((c) => c.trim());
  }
  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating)) {
      return NextResponse.json(
        { error: "Rating harus berupa angka" },
        { status: 400 },
      );
    }
    update.rating = Math.max(0, Math.min(5, rating));
  }
  if (body.reviews_count !== undefined) {
    const rc = Number(body.reviews_count);
    if (!Number.isFinite(rc) || rc < 0) {
      return NextResponse.json(
        { error: "Reviews count harus angka >= 0" },
        { status: 400 },
      );
    }
    update.reviews_count = Math.floor(rc);
  }
  if (typeof body.featured === "boolean") update.featured = body.featured;
  if (typeof body.in_stock === "boolean") update.in_stock = body.in_stock;
  if (body.weight_grams !== undefined) {
    const w = Number(body.weight_grams);
    if (!Number.isFinite(w) || w < 0) {
      return NextResponse.json(
        { error: "Berat harus angka >= 0" },
        { status: 400 },
      );
    }
    update.weight_grams = Math.floor(w);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }

  // Validasi produk ada
  const { data: existing, error: findError } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  // Update produk jika ada field
  if (Object.keys(update).length > 0) {
    const { error: updateError } = await supabase
      .from("products")
      .update(update)
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  // Replace images jika dikirim
  let insertedImages: unknown[] | null = null;
  if (Array.isArray(body.images)) {
    const images = body.images as Array<{ url?: unknown; sort_order?: unknown }>;
    const imageRows = images
      .map((img, idx) => {
        if (typeof img?.url !== "string" || img.url.trim() === "") return null;
        const sortOrder =
          typeof img.sort_order === "number" && Number.isFinite(img.sort_order)
            ? Math.max(0, Math.floor(img.sort_order))
            : idx;
        return {
          product_id: id,
          url: img.url.trim(),
          sort_order: sortOrder,
        };
      })
      .filter(
        (r): r is { product_id: string; url: string; sort_order: number } =>
          r !== null,
      );

    // Hapus images lama, lalu insert baru
    const { error: delError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (delError) {
      return NextResponse.json(
        { error: `Gagal menghapus gambar lama: ${delError.message}` },
        { status: 400 },
      );
    }

    if (imageRows.length > 0) {
      const { data: imgData, error: insError } = await supabase
        .from("product_images")
        .insert(imageRows)
        .select("id, url, sort_order");
      if (insError) {
        return NextResponse.json(
          { error: `Gagal menyimpan gambar: ${insError.message}` },
          { status: 400 },
        );
      }
      insertedImages = imgData ?? [];
    } else {
      insertedImages = [];
    }
  }

  // Fetch final state
  const { data: finalProduct, error: finalError } = await supabase
    .from("products")
    .select(
      "*, category:categories(id, name, slug), images:product_images(id, url, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (finalError) {
    return NextResponse.json({ error: finalError.message }, { status: 500 });
  }

  if (insertedImages !== null && finalProduct) {
    (finalProduct as Record<string, unknown>).images = insertedImages;
  }

  return NextResponse.json(finalProduct);
}

/**
 * DELETE /api/admin/products/[id]
 * Hapus produk. product_images akan otomatis terhapus via FK cascade.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

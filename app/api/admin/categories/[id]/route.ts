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
 * GET /api/admin/categories/[id]
 * Ambil satu kategori berdasarkan id.
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
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

/**
 * PUT /api/admin/categories/[id]
 * Update kategori. Body: { name?, slug?, description? }
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;

  let body: { name?: string; slug?: string; description?: string | null };
  try {
    body = await req.json();
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
        { error: "Nama kategori tidak boleh kosong" },
        { status: 400 },
      );
    }
    update.name = name;
  }
  if (typeof body.slug === "string") {
    const slug = body.slug.trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Slug kategori tidak boleh kosong" },
        { status: 400 },
      );
    }
    update.slug = slug;
  }
  if (body.description !== undefined) {
    update.description =
      typeof body.description === "string" && body.description.trim() !== ""
        ? body.description.trim()
        : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada field yang diupdate" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("categories")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/categories/[id]
 * Hapus kategori. Gagal jika masih ada produk terkait (FK constraint).
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }

  // Cek apakah ada produk yang masih terkait
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Kategori masih dipakai oleh ${count} produk. Pindahkan atau hapus produk terkait terlebih dahulu.`,
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";
import type { PromotionType, DiscountType } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: PromotionType[] = [
  "banner",
  "flash_sale",
  "voucher",
  "bundle",
  "add_on",
];

const VALID_DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed"];

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
 * GET /api/admin/promotions
 * List semua promo, diurutkan berdasarkan priority ASC lalu created_at DESC.
 * Optional query: ?type=banner (filter per tipe).
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  let query = supabase
    .from("promotions")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  const type = req.nextUrl.searchParams.get("type");
  if (type && VALID_TYPES.includes(type as PromotionType)) {
    query = query.eq("type", type as PromotionType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

/**
 * Body payload untuk create promo. Field nullable; client hanya kirim yang relevan.
 */
interface CreateBody {
  type?: string;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  badge?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  min_purchase?: number | null;
  flash_price?: number | null;
  flash_stock?: number | null;
  product_ids?: string[];
  end_time?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  priority?: number;
}

function parseCreateBody(body: CreateBody) {
  const type = body.type ?? "";
  const title = (body.title ?? "").trim();

  const errors: string[] = [];
  if (!type || !VALID_TYPES.includes(type as PromotionType)) {
    errors.push("Tipe promo tidak valid");
  }
  if (!title) {
    errors.push("Judul promo wajib diisi");
  }

  const insert: Record<string, unknown> = {
    type: type as PromotionType,
    title,
    subtitle: body.subtitle?.trim() || null,
    description: body.description?.trim() || null,
    image: body.image?.trim() || null,
    badge: body.badge?.trim() || null,
    product_ids: Array.isArray(body.product_ids) ? body.product_ids : [],
    end_time: body.end_time ?? null,
    cta_label: body.cta_label?.trim() || null,
    cta_href: body.cta_href?.trim() || null,
    priority: typeof body.priority === "number" ? body.priority : 99,
  };

  // Discount fields (voucher)
  if (body.discount_type !== undefined && body.discount_type !== null) {
    if (
      typeof body.discount_type === "string" &&
      VALID_DISCOUNT_TYPES.includes(body.discount_type as DiscountType)
    ) {
      insert.discount_type = body.discount_type as DiscountType;
    } else {
      errors.push("Tipe diskon tidak valid");
    }
  } else {
    insert.discount_type = null;
  }
  if (typeof body.discount_value === "number") {
    insert.discount_value = body.discount_value;
  } else {
    insert.discount_value = null;
  }
  if (typeof body.min_purchase === "number") {
    insert.min_purchase = body.min_purchase;
  } else {
    insert.min_purchase = null;
  }

  // Flash sale fields
  if (typeof body.flash_price === "number") {
    insert.flash_price = body.flash_price;
  } else {
    insert.flash_price = null;
  }
  if (typeof body.flash_stock === "number") {
    insert.flash_stock = body.flash_stock;
  } else {
    insert.flash_stock = null;
  }

  return { errors, insert };
}

/**
 * POST /api/admin/promotions
 * Buat promo baru. Body: type, title, plus field kondisional sesuai type.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON valid" },
      { status: 400 },
    );
  }

  const { errors, insert } = parseCreateBody(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("promotions")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

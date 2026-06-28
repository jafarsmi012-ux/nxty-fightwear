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
 * GET /api/admin/promotions/[id]
 * Ambil satu promo berdasarkan id.
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
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

interface UpdateBody {
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

function nullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() === "" ? null : value.trim();
}

/**
 * PUT /api/admin/promotions/[id]
 * Update promo. Body berisi field-field yang ingin diubah.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON valid" },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};

  if (typeof body.type === "string") {
    if (!VALID_TYPES.includes(body.type as PromotionType)) {
      return NextResponse.json(
        { error: "Tipe promo tidak valid" },
        { status: 400 },
      );
    }
    update.type = body.type as PromotionType;
  }

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json(
        { error: "Judul promo tidak boleh kosong" },
        { status: 400 },
      );
    }
    update.title = title;
  }

  const subtitle = nullableString(body.subtitle);
  if (subtitle !== undefined) update.subtitle = subtitle;

  const description = nullableString(body.description);
  if (description !== undefined) update.description = description;

  const image = nullableString(body.image);
  if (image !== undefined) update.image = image;

  const badge = nullableString(body.badge);
  if (badge !== undefined) update.badge = badge;

  const ctaLabel = nullableString(body.cta_label);
  if (ctaLabel !== undefined) update.cta_label = ctaLabel;

  const ctaHref = nullableString(body.cta_href);
  if (ctaHref !== undefined) update.cta_href = ctaHref;

  if (body.end_time !== undefined) {
    update.end_time = body.end_time === null ? null : body.end_time;
  }

  if (body.product_ids !== undefined) {
    if (!Array.isArray(body.product_ids)) {
      return NextResponse.json(
        { error: "product_ids harus berupa array" },
        { status: 400 },
      );
    }
    update.product_ids = body.product_ids;
  }

  if (body.priority !== undefined) {
    if (typeof body.priority !== "number") {
      return NextResponse.json(
        { error: "priority harus berupa angka" },
        { status: 400 },
      );
    }
    update.priority = body.priority;
  }

  // Discount fields
  if (body.discount_type !== undefined) {
    if (body.discount_type === null) {
      update.discount_type = null;
    } else if (
      typeof body.discount_type === "string" &&
      VALID_DISCOUNT_TYPES.includes(body.discount_type as DiscountType)
    ) {
      update.discount_type = body.discount_type as DiscountType;
    } else {
      return NextResponse.json(
        { error: "Tipe diskon tidak valid" },
        { status: 400 },
      );
    }
  }

  if (body.discount_value !== undefined) {
    if (body.discount_value === null) {
      update.discount_value = null;
    } else if (typeof body.discount_value === "number") {
      update.discount_value = body.discount_value;
    } else {
      return NextResponse.json(
        { error: "discount_value harus berupa angka atau null" },
        { status: 400 },
      );
    }
  }

  if (body.min_purchase !== undefined) {
    if (body.min_purchase === null) {
      update.min_purchase = null;
    } else if (typeof body.min_purchase === "number") {
      update.min_purchase = body.min_purchase;
    } else {
      return NextResponse.json(
        { error: "min_purchase harus berupa angka atau null" },
        { status: 400 },
      );
    }
  }

  if (body.flash_price !== undefined) {
    if (body.flash_price === null) {
      update.flash_price = null;
    } else if (typeof body.flash_price === "number") {
      update.flash_price = body.flash_price;
    } else {
      return NextResponse.json(
        { error: "flash_price harus berupa angka atau null" },
        { status: 400 },
      );
    }
  }

  if (body.flash_stock !== undefined) {
    if (body.flash_stock === null) {
      update.flash_stock = null;
    } else if (typeof body.flash_stock === "number") {
      update.flash_stock = body.flash_stock;
    } else {
      return NextResponse.json(
        { error: "flash_stock harus berupa angka atau null" },
        { status: 400 },
      );
    }
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
    .from("promotions")
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
 * DELETE /api/admin/promotions/[id]
 * Hapus promo berdasarkan id.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await context.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  const { error } = await supabase.from("promotions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

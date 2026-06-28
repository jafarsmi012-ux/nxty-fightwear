import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";
import type { OrderStatus } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processed",
  "shipped",
  "delivered",
  "cancelled",
];

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
 * GET /api/admin/orders
 * List semua pesanan, diurutkan dari yang terbaru.
 *
 * Query params:
 *   - status: filter by status (pending|paid|processed|shipped|delivered|cancelled)
 *   - q: search by order id, customer name, atau customer email (case-insensitive, partial match)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const status = req.nextUrl.searchParams.get("status");
  if (status && VALID_STATUSES.includes(status as OrderStatus)) {
    query = query.eq("status", status as OrderStatus);
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (q) {
    // Escape percent signs untuk menghindari pattern injection di ILIKE.
    // Kita escape %, _ dan \ karena semuanya special di SQL LIKE.
    const escaped = q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    // id UUID/cuid, customer_name, customer_email — semuanya string.
    query = query.or(
      `id.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

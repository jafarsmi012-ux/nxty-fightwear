import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/track/order?id=XXX&email=YYY
 * Lookup order by id + email verification.
 * Return order info + shipping info.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  if (!id || !email) {
    return NextResponse.json(
      { error: "id & email required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, items, shipping, created_at, customer_name, customer_address")
    .eq("id", id)
    .eq("customer_email", email)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan atau email tidak cocok" },
      { status: 404 }
    );
  }

  return NextResponse.json({ order: data });
}

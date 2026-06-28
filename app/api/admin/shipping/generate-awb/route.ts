import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";
import { createShipment, EverproError } from "@/lib/shipping/everpro";
import type { Order, OrderShipping, OrderStatus } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHIPPABLE_STATUSES: OrderStatus[] = ["paid", "processed"];

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

interface GenerateAwbBody {
  order_id?: string;
  origin?: string;
  destination?: string;
  weight?: number;
  courier?: string;
  service?: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  recipient_postal_code?: string;
  item_name?: string;
  item_value?: number;
  item_weight?: number;
  item_qty?: number;
}

/**
 * POST /api/admin/shipping/generate-awb
 *
 * Generate AWB via Everpro, simpan ke orders.shipping, update status → "shipped".
 *
 * Body: shipment detail (lihat GenerateAwbBody). Wajib ada order_id.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  let body: GenerateAwbBody;
  try {
    body = (await req.json()) as GenerateAwbBody;
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON valid" },
      { status: 400 },
    );
  }

  const orderId = body.order_id?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "order_id wajib diisi" },
      { status: 400 },
    );
  }

  // Field wajib lainnya
  const missing: string[] = [];
  if (!body.origin) missing.push("origin");
  if (!body.destination) missing.push("destination");
  if (typeof body.weight !== "number" || body.weight <= 0) missing.push("weight");
  if (!body.courier) missing.push("courier");
  if (!body.service) missing.push("service");
  if (!body.recipient_name) missing.push("recipient_name");
  if (!body.recipient_phone) missing.push("recipient_phone");
  if (!body.recipient_address) missing.push("recipient_address");
  if (!body.recipient_postal_code) missing.push("recipient_postal_code");
  if (!body.item_name) missing.push("item_name");
  if (typeof body.item_value !== "number") missing.push("item_value");
  if (typeof body.item_weight !== "number" || body.item_weight <= 0)
    missing.push("item_weight");
  if (typeof body.item_qty !== "number" || body.item_qty <= 0)
    missing.push("item_qty");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Field wajib: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }

  // Ambil order, pastikan status valid dan belum ada waybill
  const { data: orderRow, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchErr || !orderRow) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Order tidak ditemukan" },
      { status: 404 },
    );
  }

  const order = orderRow as Order;

  if (!SHIPPABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      {
        error: `Order status "${order.status}" tidak bisa di-ship. Hanya status "paid" atau "processed".`,
      },
      { status: 400 },
    );
  }

  const existingShipping = (order.shipping ?? {}) as OrderShipping;
  if (existingShipping.waybill) {
    return NextResponse.json(
      {
        error: `Order sudah punya waybill: ${existingShipping.waybill}`,
      },
      { status: 400 },
    );
  }

  // Panggil Everpro
  let result;
  try {
    result = await createShipment({
      order_id: orderId,
      origin: body.origin!,
      destination: body.destination!,
      weight: body.weight!,
      courier: body.courier!,
      service: body.service!,
      recipient_name: body.recipient_name!,
      recipient_phone: body.recipient_phone!,
      recipient_address: body.recipient_address!,
      recipient_postal_code: body.recipient_postal_code!,
      item_name: body.item_name!,
      item_value: body.item_value!,
      item_weight: body.item_weight!,
      item_qty: body.item_qty!,
    });
  } catch (err) {
    if (err instanceof EverproError) {
      return NextResponse.json(
        { error: `Everpro: ${err.message}` },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal generate AWB" },
      { status: 502 },
    );
  }

  // Merge shipping JSON, update status → shipped
  const nextShipping: OrderShipping = {
    ...existingShipping,
    courier: result.courier,
    service: result.service,
    waybill: result.waybill,
    etd: result.etd || existingShipping.etd,
  };

  const { data: updated, error: updateErr } = await supabase
    .from("orders")
    .update({
      shipping: nextShipping,
      status: "shipped",
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? "Gagal update order" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    waybill: result.waybill,
    courier: result.courier,
    service: result.service,
    etd: result.etd,
    order: updated,
  });
}

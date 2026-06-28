import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";
import { trackShipment, EverproError } from "@/lib/shipping/everpro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * GET /api/admin/shipping/track
 *
 * Proxy ke Everpro untuk tracking shipment.
 * Query: ?waybill=XXX&courier=jne
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  const waybill = req.nextUrl.searchParams.get("waybill")?.trim();
  const courier = req.nextUrl.searchParams.get("courier")?.trim();

  if (!waybill || !courier) {
    return NextResponse.json(
      { error: "waybill dan courier wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const result = await trackShipment(waybill, courier);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EverproError) {
      return NextResponse.json(
        { error: `Everpro: ${err.message}` },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal track shipment" },
      { status: 502 },
    );
  }
}

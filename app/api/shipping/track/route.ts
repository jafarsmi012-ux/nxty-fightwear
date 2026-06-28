import { NextRequest, NextResponse } from "next/server";
import { trackShipment } from "@/lib/shipping/everpro";

/**
 * GET /api/shipping/track?waybill=XXX&courier=jne
 * Public tracking endpoint (no auth required) untuk customer tracking.
 * Returns tracking events dari Everpro.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const waybill = searchParams.get("waybill");
  const courier = searchParams.get("courier");

  if (!waybill || !courier) {
    return NextResponse.json(
      { error: "waybill & courier required" },
      { status: 400 }
    );
  }

  try {
    const result = await trackShipment(waybill, courier);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Track API error:", message);
    return NextResponse.json(
      { error: "Gagal melacak pengiriman", detail: message },
      { status: 500 }
    );
  }
}

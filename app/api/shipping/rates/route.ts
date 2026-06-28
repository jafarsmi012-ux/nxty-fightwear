import { NextRequest, NextResponse } from "next/server";
import { getRates, type Rate } from "@/lib/shipping/everpro";

interface RateRequest {
  destination: string; // city or postal code
  weight: number; // grams
  courier?: string; // optional specific courier
}

/**
 * POST /api/shipping/rates
 * Hitung ongkir dari Everpro berdasarkan kota tujuan & berat.
 * Digunakan di checkout.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RateRequest;
    if (!body.destination || !body.weight) {
      return NextResponse.json(
        { error: "destination & weight required" },
        { status: 400 }
      );
    }

    // Origin = alamat toko (Lembang, Bandung Barat). Bisa di-hardcode atau dari env.
    const origin = process.env.STORE_ORIGIN_CITY || "Lembang";
    const rates = await getRates({
      origin,
      destination: body.destination,
      weight: body.weight,
      courier: body.courier,
    });

    return NextResponse.json({ rates });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Rates API error:", message);
    return NextResponse.json(
      { error: "Gagal menghitung ongkir", detail: message },
      { status: 500 }
    );
  }
}

// Re-export type
export type { Rate };

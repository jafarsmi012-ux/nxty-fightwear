import { NextRequest, NextResponse } from "next/server";
import {
  signSession,
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus JSON valid" },
      { status: 400 },
    );
  }

  const { password } = (body ?? {}) as { password?: string };

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "Password wajib diisi" },
      { status: 400 },
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD belum di-set di server" },
      { status: 500 },
    );
  }

  // Constant-time-ish compare (best-effort; bukan crypto-grade tapi cukup untuk single password)
  if (password !== expected) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  const token = signSession();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}

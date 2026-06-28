import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appendFileSync } from "node:fs";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession, ADMIN_COOKIE } from "@/lib/supabase/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function debugLog(msg: string) {
  try {
    appendFileSync("/tmp/api-error.log", `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // ignore
  }
}

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  debugLog("GET /api/admin/categories called");
  const auth = await requireAuth();
  if (auth) return auth;

  debugLog(`URL: ${process.env.SUPABASE_URL}, hasKey: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    const msg = `createAdminClient THREW: ${err instanceof Error ? err.message : String(err)}`;
    debugLog(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!supabase) {
    debugLog("createAdminClient returned null (env missing)");
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  }

  debugLog("Supabase client created, calling .from('categories')...");

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      debugLog(`Supabase error: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    debugLog(`Success: ${data?.length ?? 0} rows`);
    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const e = err as { message?: string; cause?: { code?: string; message?: string } };
    const msg = `THROWN: msg=${e.message} cause=${e.cause?.message} code=${e.cause?.code}`;
    debugLog(msg);
    return NextResponse.json(
      { error: e.message ?? "Unknown error", detail: e.cause?.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  let body: { name?: string; slug?: string; description?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const slug = (body.slug ?? "").trim();

  if (!name) return NextResponse.json({ error: "Nama wajib" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Slug wajib" }, { status: 400 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, description: body.description?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

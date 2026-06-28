import { createClient } from "@supabase/supabase-js";
import { Agent, setGlobalDispatcher } from "undici";

/**
 * Cek apakah Supabase admin credentials sudah diset.
 */
export function isSupabaseAdminConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Fix critical: Next.js 16 + @supabase/supabase-js fetch issue.
 *
 * Symptom: `TypeError: fetch failed` saat Supabase client fetch dari
 * Next.js server runtime (production ATAU dev).
 *
 * Root cause: Default global fetch (undici) di Node 22 gagal terhadap
 * Cloudflare-hosted Supabase. Override `global.fetch` di Supabase client
 * juga gagal karena Supabase pakai `onRequestStart` callback yang
 * incompat dengan custom Agent per-request.
 *
 * Fix: Set undici GLOBAL dispatcher SEKALI di module init dengan IPv4-only
 * agent. Pakai `setGlobalDispatcher` (bukan `global.fetch = ...`).
 * Dijalankan sekali saat module pertama kali di-import (idempotent check).
 */
let dispatcherInitialized = false;
function initDispatcher() {
  if (dispatcherInitialized) return;
  if (typeof process === "undefined") return;

  // Skip di Edge runtime (undici Agent tidak available)
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const ipv4Agent = new Agent({
      connect: {
        family: 4, // Force IPv4 untuk konsistensi
        timeout: 10_000,
      },
    });
    setGlobalDispatcher(ipv4Agent);
    dispatcherInitialized = true;
  } catch (err) {
    console.warn("[Supabase] Failed to set global dispatcher:", err);
  }
}

initDispatcher();

/**
 * Create Supabase admin server client dengan service role key.
 * Return null jika env vars belum diset (gracefully).
 */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    console.warn(
      "[Supabase] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset. Admin operations disabled."
    );
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

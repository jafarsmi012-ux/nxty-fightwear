import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Pakai untuk komponen "use client" yang
 * butuh akses langsung (mis. upload file dari admin panel).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!,
  );
}

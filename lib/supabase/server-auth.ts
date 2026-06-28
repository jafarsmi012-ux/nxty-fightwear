import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get current authenticated customer user from Supabase session cookie.
 * Returns null jika:
 * - Supabase env vars belum diset (development tanpa setup)
 * - User tidak login
 * - Session expired/invalid
 */
export async function getCurrentCustomerUser(): Promise<{
  id: string;
  email: string;
} | null> {
  // Check if Supabase env vars are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_ANON_KEY belum diset. Customer auth disabled."
    );
    return null;
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email || "" } : null;
  } catch (err) {
    console.error("[Supabase] getCurrentCustomerUser error:", err);
    return null;
  }
}

/**
 * Require current user or redirect to login.
 * Untuk dipake di layout/page customer yang butuh auth.
 */
export async function requireCustomerUser() {
  const user = await getCurrentCustomerUser();
  if (!user) redirect("/masuk");
  return user;
}

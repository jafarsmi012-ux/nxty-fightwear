import { createClient } from "./client";

/**
 * Kirim magic link atau OTP ke email customer.
 * Jika useOtp = true, kirim 6-digit code.
 * Jika useOtp = false, kirim magic link ke email.
 */
export async function signInWithEmail(
  email: string,
  useOtp: boolean = false
): Promise<void> {
  const supabase = createClient();
  const options = useOtp
    ? { shouldCreateUser: true }
    : {
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        shouldCreateUser: true,
      };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options,
  });
  if (error) throw error;
}

/**
 * Verifikasi OTP code (kalau user pakai mode OTP).
 */
export async function verifyOtp(
  email: string,
  token: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
}

/**
 * Logout customer.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Ambil current user (client-side).
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Subscribe ke perubahan auth state (login/logout).
 */
export function onAuthStateChange(callback: (user: any | null) => void) {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );
  return subscription;
}

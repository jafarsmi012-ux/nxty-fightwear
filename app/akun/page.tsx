import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { requireCustomerUser } from "@/lib/supabase/server-auth";
import ProfileForm from "./ProfileForm";

export default async function AkunProfilePage() {
  const user = await requireCustomerUser();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
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
    }
  );

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
        Profil Saya
      </h1>
      <p className="text-sm text-neutral-400 mb-6">
        Kelola informasi akun Anda
      </p>

      <ProfileForm
        userId={user.id}
        email={user.email || ""}
        initialName={profile?.full_name || ""}
        initialPhone={profile?.phone || ""}
      />
    </div>
  );
}

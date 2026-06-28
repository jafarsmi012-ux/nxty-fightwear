import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { requireCustomerUser } from "@/lib/supabase/server-auth";
import Link from "next/link";
import { User, Package, MapPin, LogOut } from "lucide-react";

export default async function AkunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomerUser();
  const userId = user.id;
  const userEmail = user.email;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar nav (desktop) */}
        <aside className="md:w-60 shrink-0">
          <nav className="md:sticky md:top-20 flex md:flex-col gap-2 overflow-x-auto scrollbar-hide">
            <Link
              href="/akun"
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#161616] border-2 border-[#262626] hover:border-[#dc2626] min-w-fit"
            >
              <User className="w-3.5 h-3.5 text-[#dc2626]" />
              Profil
            </Link>
            <Link
              href="/akun/pesanan"
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#161616] border-2 border-[#262626] hover:border-[#dc2626] min-w-fit"
            >
              <Package className="w-3.5 h-3.5 text-[#dc2626]" />
              Pesanan Saya
            </Link>
            <Link
              href="/akun/alamat"
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#161616] border-2 border-[#262626] hover:border-[#dc2626] min-w-fit"
            >
              <MapPin className="w-3.5 h-3.5 text-[#dc2626]" />
              Alamat Saya
            </Link>
            <form action="/api/customer/logout" method="post" className="md:mt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-[#dc2626] bg-transparent border-2 border-[#262626] hover:border-[#dc2626] hover:bg-[#dc2626] hover:text-white w-full min-w-fit"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </form>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 pb-12">{children}</main>
      </div>
    </div>
  );
}

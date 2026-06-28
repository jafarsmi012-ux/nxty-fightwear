import { requireCustomerUser } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import DeleteAddressButton from "./DeleteAddressButton";

export default async function AlamatPage() {
  const user = await requireCustomerUser();
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: addresses } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Alamat Saya
          </h1>
          <p className="text-sm text-neutral-400">
            Kelola alamat pengiriman Anda
          </p>
        </div>
        <Link
          href="/akun/alamat/baru"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] text-white text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Tambah
        </Link>
      </div>

      {addresses && addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-[#161616] border-2 border-[#262626] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[#dc2626] shrink-0" />
                    <span className="text-sm font-black uppercase tracking-wider text-white">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#dc2626] text-white px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white">{addr.recipient_name}</p>
                  <p className="text-xs text-neutral-400">{addr.phone}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {addr.street}, {addr.city}, {addr.province} {addr.postal_code}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/akun/alamat/${addr.id}`}
                    className="w-9 h-9 border-2 border-[#262626] flex items-center justify-center hover:bg-[#dc2626] hover:border-[#dc2626]"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <DeleteAddressButton addressId={addr.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#161616] border-2 border-dashed border-[#262626] p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
          <p className="text-sm font-bold text-white uppercase tracking-tight mb-1">
            Belum Ada Alamat
          </p>
          <p className="text-xs text-neutral-500 mb-4">
            Tambahkan alamat untuk mempercepat checkout
          </p>
          <Link
            href="/akun/alamat/baru"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] text-white text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Tambah Alamat
          </Link>
        </div>
      )}
    </div>
  );
}

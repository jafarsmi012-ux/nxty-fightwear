import { requireCustomerUser } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function PesananSayaPage() {
  const user = await requireCustomerUser();
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
        Pesanan Saya
      </h1>
      <p className="text-sm text-neutral-400 mb-6">
        Riwayat pesanan Anda
      </p>

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/akun/pesanan/${order.id}`}
              className="block bg-[#161616] border-2 border-[#262626] hover:border-[#dc2626] p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package className="w-5 h-5 text-[#dc2626] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-neutral-500 truncate">
                      {order.id}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-xs font-bold text-white mt-1">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[#161616] border-2 border-dashed border-[#262626] p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
          <p className="text-sm font-bold text-white uppercase tracking-tight mb-1">
            Belum Ada Pesanan
          </p>
          <p className="text-xs text-neutral-500 mb-4">
            Pesanan Anda akan muncul di sini
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2.5 bg-[#dc2626] text-white text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors min-h-[44px]"
          >
            Mulai Belanja
          </Link>
        </div>
      )}
    </div>
  );
}

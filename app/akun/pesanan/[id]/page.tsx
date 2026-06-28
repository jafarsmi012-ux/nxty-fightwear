import { requireCustomerUser } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import TrackingTimeline from "@/components/admin/TrackingTimeline";
import type { TrackingEvent } from "@/lib/shipping/everpro";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

async function fetchTracking(waybill: string, courier: string): Promise<TrackingEvent[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/shipping/track?waybill=${waybill}&courier=${courier}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export default async function PesananDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCustomerUser();
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (!order) notFound();

  const events =
    order.shipping?.waybill && order.shipping?.courier
      ? await fetchTracking(order.shipping.waybill, order.shipping.courier)
      : [];

  return (
    <div>
      <Link
        href="/akun/pesanan"
        className="inline-flex items-center gap-1 text-neutral-400 hover:text-white mb-4 text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            Order ID
          </p>
          <p className="text-sm font-mono font-bold text-white">{order.id}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {new Date(order.created_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div className="bg-[#161616] border-2 border-[#262626] p-4 mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
          Items
        </h3>
        <div className="space-y-2">
          {order.items?.map((item: { name: string; size: string; color: string; quantity: number; price: number }, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs py-2 border-b border-[#262626] last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{item.name}</p>
                <p className="text-neutral-500">
                  {item.size} · {item.color} · ×{item.quantity}
                </p>
              </div>
              <p className="text-white font-bold ml-2">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping info */}
      {order.shipping && (
        <div className="bg-[#161616] border-2 border-[#262626] p-4 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
            Pengiriman
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-neutral-500 mb-0.5">Kurir</p>
              <p className="text-white font-bold">
                {order.shipping.courier?.toUpperCase()} {order.shipping.service}
              </p>
            </div>
            {order.shipping.waybill && (
              <div>
                <p className="text-neutral-500 mb-0.5">No. Resi</p>
                <p className="text-white font-mono font-bold">
                  {order.shipping.waybill}
                </p>
              </div>
            )}
            {order.shipping.etd && (
              <div>
                <p className="text-neutral-500 mb-0.5">Estimasi</p>
                <p className="text-white font-bold">{order.shipping.etd} hari</p>
              </div>
            )}
            <div>
              <p className="text-neutral-500 mb-0.5">Ongkir</p>
              <p className="text-white font-bold">
                {formatPrice(order.shipping_cost || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking timeline */}
      {events.length > 0 && (
        <div className="bg-[#161616] border-2 border-[#262626] p-4 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
            Tracking Pengiriman
          </h3>
          <TrackingTimeline events={events} />
        </div>
      )}

      {/* Address */}
      {order.customer_address && (
        <div className="bg-[#161616] border-2 border-[#262626] p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#dc2626]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Alamat Pengiriman
            </h3>
          </div>
          <p className="text-sm font-bold text-white">{order.customer_name}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {order.customer_address.phone}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {order.customer_address.street}, {order.customer_address.city},{" "}
            {order.customer_address.province} {order.customer_address.postal_code}
          </p>
        </div>
      )}

      {/* Total */}
      <div className="bg-[#161616] border-2 border-[#dc2626] p-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-neutral-500">Subtotal</span>
          <span className="text-white font-bold">
            {formatPrice(
              (order.total || 0) - (order.shipping_cost || 0)
            )}
          </span>
        </div>
        <div className="flex justify-between text-xs mb-2 pb-2 border-b border-[#262626]">
          <span className="text-neutral-500">Ongkir</span>
          <span className="text-white font-bold">
            {formatPrice(order.shipping_cost || 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Total
          </span>
          <span className="text-lg font-black text-white">
            {formatPrice(order.total || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

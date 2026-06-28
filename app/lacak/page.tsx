"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, Package, Loader2, MapPin, Mail } from "lucide-react";
import TrackingTimeline from "@/components/admin/TrackingTimeline";
import type { TrackingEvent } from "@/lib/shipping/everpro";

interface OrderData {
  id: string;
  status: string;
  total: number;
  items: any[];
  shipping: any;
  created_at: string;
  customer_name: string;
  customer_address: any;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Sudah Dibayar",
  processed: "Diproses",
  shipped: "Dikirim",
  delivered: "Sampai",
  cancelled: "Dibatalkan",
};

export default function LacakPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setOrder(null);
    setEvents([]);
    try {
      const res = await fetch(
        `/api/track/order?id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melacak");
      setOrder(data.order);

      // If has waybill, fetch tracking
      const waybill = data.order.shipping?.waybill;
      const courier = data.order.shipping?.courier;
      if (waybill && courier) {
        try {
          const trackRes = await fetch(
            `/api/shipping/track?waybill=${encodeURIComponent(waybill)}&courier=${encodeURIComponent(courier)}`
          );
          if (trackRes.ok) {
            const trackData = await trackRes.json();
            setEvents(trackData.events || []);
          }
        } catch {
          // Tracking opsional, jangan gagalkan seluruh flow
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal melacak pesanan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-neutral-400 hover:text-white mb-4 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </Link>

        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          Lacak Pesanan
        </h1>
        <p className="text-sm text-neutral-400 mb-6">
          Masukkan Order ID dan email yang dipakai saat checkout
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-[#161616] border-2 border-[#262626] p-4 space-y-4 mb-6"
        >
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="NXTY-xxxxx"
              required
              className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              className="w-full bg-[#0a0a0a] text-white px-3 py-3 border-2 border-[#262626] focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600"
            />
          </div>

          {error && (
            <div className="border border-[#dc2626] text-[#dc2626] text-xs p-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#dc2626] text-white font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:bg-[#262626] disabled:text-neutral-600 disabled:cursor-not-allowed min-h-[48px]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Melacak...
              </span>
            ) : (
              "Lacak"
            )}
          </button>
        </form>

        {order && (
          <div className="space-y-4">
            {/* Status badge */}
            <div className="bg-[#161616] border-2 border-[#262626] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    Order
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    {order.id}
                  </p>
                </div>
                <span className="bg-[#dc2626] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1">
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-neutral-500 mb-0.5">Total</p>
                  <p className="text-white font-bold">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-0.5">Tanggal</p>
                  <p className="text-white font-bold">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-[#161616] border-2 border-[#262626] p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
                Items
              </h3>
              <div className="space-y-2">
                {order.items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-2 border-b border-[#262626] last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">
                        {item.name}
                      </p>
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

            {/* Tracking timeline */}
            {events.length > 0 && (
              <div className="bg-[#161616] border-2 border-[#262626] p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
                  Tracking Pengiriman
                </h3>
                {order.shipping?.waybill && (
                  <p className="text-xs text-neutral-500 mb-3 font-mono">
                    Resi: {order.shipping.waybill} ({order.shipping.courier})
                  </p>
                )}
                <TrackingTimeline events={events} />
              </div>
            )}

            {/* Address */}
            {order.customer_address && (
              <div className="bg-[#161616] border-2 border-[#262626] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#dc2626]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Alamat Pengiriman
                  </h3>
                </div>
                <p className="text-xs text-neutral-400">
                  {order.customer_address.street}, {order.customer_address.city}
                  , {order.customer_address.province}{" "}
                  {order.customer_address.postal_code}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

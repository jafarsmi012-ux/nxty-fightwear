"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import type { Order, OrderStatus } from "@/types/database";
import OrderDetailModal from "@/components/admin/OrderDetailModal";

interface Props {
  orders: Order[];
}

const PAGE_SIZE = 20;

const STATUS_BADGES: Record<OrderStatus, string> = {
  pending: "bg-[#161616] text-yellow-300 border-yellow-300",
  paid: "bg-[#161616] text-blue-300 border-blue-300",
  processed: "bg-[#161616] text-purple-300 border-purple-300",
  shipped: "bg-[#161616] text-cyan-300 border-cyan-300",
  delivered: "bg-green-500 text-[#0a0a0a] border-green-500",
  cancelled: "bg-[#dc2626] text-white border-[#dc2626]",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processed: "Processed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_FILTERS: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processed", label: "Processed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function formatRupiah(value: number | null): string {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function shortOrderId(id: string): string {
  // Tampilkan 8 char terakhir biar muat di tabel; full id tetap ada di modal.
  return id.length > 10 ? `…${id.slice(-8)}` : id;
}

export default function OrderListClient({ orders }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.customer_name?.toLowerCase().includes(q) ?? false) ||
        (o.customer_email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
          Manajemen
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Pesanan
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          Daftar pesanan masuk NXTY Fightwear. Total {orders.length} pesanan.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label
            htmlFor="search"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2"
          >
            Cari Order / Customer
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              strokeWidth={2.5}
            />
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Order ID, nama, atau email…"
              className="w-full bg-[#161616] border-2 border-[#262626] pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#dc2626] transition-colors"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | OrderStatus);
              setPage(1);
            }}
            className="w-full bg-[#161616] border-2 border-[#262626] px-3 py-3 text-sm text-white focus:outline-none focus:border-[#dc2626] transition-colors"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag
              size={32}
              strokeWidth={2}
              className="mx-auto mb-3 text-neutral-600"
            />
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
              Belum ada pesanan
            </p>
            <p className="text-[11px] text-neutral-600">
              Pesanan akan muncul di sini setelah customer checkout.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
              Tidak ada hasil
            </p>
            <p className="text-[11px] text-neutral-600">
              Coba ubah filter atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#dc2626] text-white">
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-12">
                  #
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-32">
                  Order ID
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-40">
                  Tanggal
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626]">
                  Customer
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-36 text-right">
                  Total
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-32">
                  Status
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((o, idx) => {
                const itemCount = Array.isArray(o.items) ? o.items.length : 0;
                return (
                  <tr
                    key={o.id}
                    className="border-t-2 border-[#262626] hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelected(o)}
                  >
                    <td className="px-3 py-3 text-xs font-black text-neutral-400 border-r-2 border-[#262626]">
                      {start + idx + 1}
                    </td>
                    <td className="px-3 py-3 text-xs font-mono text-white border-r-2 border-[#262626]">
                      {shortOrderId(o.id)}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-neutral-300 border-r-2 border-[#262626]">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-3 py-3 text-xs text-white border-r-2 border-[#262626]">
                      <div className="font-black truncate max-w-xs">
                        {o.customer_name ?? "—"}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate max-w-xs">
                        {o.customer_email ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-black text-white border-r-2 border-[#262626] font-mono text-right">
                      {formatRupiah(o.total)}
                      <div className="text-[10px] text-neutral-500 font-normal mt-0.5">
                        {itemCount} item
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs border-r-2 border-[#262626]">
                      <span
                        className={`inline-block px-2 py-1 border-2 text-[10px] font-black uppercase tracking-wider ${STATUS_BADGES[o.status]}`}
                      >
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(o);
                        }}
                        className="inline-flex items-center gap-1.5 bg-white text-[#0a0a0a] border-2 border-white px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-[#0a0a0a] hover:text-white transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Halaman {safePage} dari {totalPages} — Menampilkan {start + 1}–
            {Math.min(start + PAGE_SIZE, filtered.length)} dari {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 bg-[#0a0a0a] text-white border-2 border-white px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-[#0a0a0a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={12} strokeWidth={2.5} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 bg-[#0a0a0a] text-white border-2 border-white px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-[#0a0a0a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

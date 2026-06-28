import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { Promotion, PromotionType } from "@/types/database";
import PromoActions from "./PromoActions";
import TypeFilter from "./TypeFilter";

export const dynamic = "force-dynamic";

const VALID_TYPES: PromotionType[] = [
  "banner",
  "flash_sale",
  "voucher",
  "bundle",
  "add_on",
];

const TYPE_BADGE_CLASSES: Record<PromotionType, string> = {
  banner: "bg-white text-[#0a0a0a] border-white",
  flash_sale: "bg-[#dc2626] text-white border-[#dc2626]",
  voucher: "bg-yellow-400 text-[#0a0a0a] border-yellow-400",
  bundle: "bg-blue-500 text-white border-blue-500",
  add_on: "bg-purple-500 text-white border-purple-500",
};

const TYPE_LABELS: Record<PromotionType, string> = {
  banner: "Banner",
  flash_sale: "Flash Sale",
  voucher: "Voucher",
  bundle: "Bundle",
  add_on: "Add On",
};

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function isActive(endTime: string | null): boolean {
  if (!endTime) return true;
  return new Date(endTime).getTime() > Date.now();
}

function formatEndTime(endTime: string | null): string {
  if (!endTime) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(endTime));
}

function getDiscountLabel(promo: Promotion): string {
  if (promo.type === "voucher") {
    if (
      promo.discount_type === "percentage" &&
      typeof promo.discount_value === "number"
    ) {
      return `${promo.discount_value}%`;
    }
    if (
      promo.discount_type === "fixed" &&
      typeof promo.discount_value === "number"
    ) {
      return formatRupiah(promo.discount_value);
    }
    return "—";
  }
  if (promo.type === "flash_sale") {
    return typeof promo.flash_price === "number"
      ? formatRupiah(promo.flash_price)
      : "—";
  }
  return "—";
}

async function loadPromotions(typeFilter: PromotionType | null): Promise<Promotion[]> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [] as never;
  }
  let query = supabase
    .from("promotions")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  try {
    const { data, error } = await query;
    if (error) {
      console.warn("[admin/promo] promotions error:", error.message);
      return [];
    }
    return (data ?? []) as Promotion[];
  } catch (err) {
    console.warn("[admin/promo] fetch failed:", err);
    return [];
  }
}

export default async function PromoListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawType = params.type;
  const typeFilter: PromotionType | null =
    rawType && VALID_TYPES.includes(rawType as PromotionType)
      ? (rawType as PromotionType)
      : null;

  const promotions = await loadPromotions(typeFilter);

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-4 mb-6 flex-col md:flex-row">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
            Manajemen
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Promo
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Kelola banner, flash sale, voucher, bundle, dan add-on NXTY
            Fightwear.
          </p>
        </div>
        <Link
          href="/admin/promo/baru"
          className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-4 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tambah Promo
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <TypeFilter />
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
          {promotions.length} promo
        </p>
      </div>

      {/* Tabel */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] overflow-x-auto">
        {promotions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
              Belum ada promo
            </p>
            <p className="text-[11px] text-neutral-600 mb-4">
              Tambahkan promo pertama untuk mulai menampilkan banner atau
              flash sale di toko.
            </p>
            <Link
              href="/admin/promo/baru"
              className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              Tambah Promo
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#dc2626] text-white">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-12">
                  #
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-32">
                  Tipe
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626]">
                  Judul
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-36">
                  Diskon/Potongan
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-20">
                  Prioritas
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-32">
                  Berakhir
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-r-2 border-[#262626] w-28">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-44">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo, idx) => {
                const active = isActive(promo.end_time);
                return (
                  <tr
                    key={promo.id}
                    className="border-t-2 border-[#262626] hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-black text-neutral-400 border-r-2 border-[#262626]">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-xs border-r-2 border-[#262626]">
                      <span
                        className={`inline-block px-2 py-1 border-2 text-[10px] font-black uppercase tracking-wider ${
                          TYPE_BADGE_CLASSES[promo.type]
                        }`}
                      >
                        {TYPE_LABELS[promo.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-white border-r-2 border-[#262626]">
                      {promo.title}
                      {promo.subtitle ? (
                        <p className="mt-1 text-[11px] font-normal text-neutral-500 line-clamp-1">
                          {promo.subtitle}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-white border-r-2 border-[#262626] font-mono">
                      {getDiscountLabel(promo)}
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-white border-r-2 border-[#262626] font-mono">
                      {promo.priority}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-neutral-300 border-r-2 border-[#262626]">
                      {formatEndTime(promo.end_time)}
                    </td>
                    <td className="px-4 py-3 text-xs border-r-2 border-[#262626]">
                      <span
                        className={`inline-block px-2 py-1 border-2 text-[10px] font-black uppercase tracking-wider ${
                          active
                            ? "bg-green-500 text-[#0a0a0a] border-green-500"
                            : "bg-[#161616] text-neutral-500 border-[#262626]"
                        }`}
                      >
                        {active ? "Aktif" : "Berakhir"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PromoActions id={promo.id} title={promo.title} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

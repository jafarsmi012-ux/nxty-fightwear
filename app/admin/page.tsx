import Link from "next/link";
import {
  Package,
  Layers,
  Tag,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getAdminStats } from "@/lib/storefront/products";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const statCards = [
    {
      label: "Total Produk",
      value: stats.totalProducts,
      icon: Package,
      href: "/admin/produk",
    },
    {
      label: "Total Kategori",
      value: stats.totalCategories,
      icon: Layers,
      href: "/admin/kategori",
    },
    {
      label: "Promo Aktif",
      value: stats.activePromotions,
      icon: Tag,
      href: "/admin/promo",
    },
    {
      label: "Pesanan Hari Ini",
      value: stats.ordersToday,
      icon: ShoppingBag,
      href: "/admin/pesanan",
    },
  ];

  const quickLinks = [
    {
      title: "Kelola Produk",
      desc: "Tambah, edit, dan atur stok produk fightwear",
      href: "/admin/produk",
      icon: Package,
    },
    {
      title: "Kelola Kategori",
      desc: "Manajemen kategori & subkategori produk",
      href: "/admin/kategori",
      icon: Layers,
    },
    {
      title: "Kelola Promo",
      desc: "Buat flash sale, voucher, dan banner promo",
      href: "/admin/promo",
      icon: Tag,
    },
    {
      title: "Kelola Pesanan",
      desc: "Lihat & proses pesanan masuk dari customer",
      href: "/admin/pesanan",
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mb-2">
          Dashboard
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Ringkasan Toko
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          Pantau performa NXTY Fightwear secara real-time.
        </p>
      </div>

      {/* Stats grid */}
      <section
        aria-label="Statistik utama"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group bg-[#0a0a0a] border-2 border-white p-4 md:p-5 hover:border-[#dc2626] hover:shadow-[4px_4px_0_#dc2626] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="w-9 h-9 border-2 border-[#dc2626] flex items-center justify-center bg-[#dc2626]/10">
                  <Icon size={18} strokeWidth={2.5} className="text-[#dc2626]" />
                </span>
                <ArrowRight
                  size={16}
                  className="text-neutral-600 group-hover:text-[#dc2626] transition-colors"
                />
              </div>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {card.value}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                {card.label}
              </p>
            </Link>
          );
        })}
      </section>

      {/* Quick links */}
      <section aria-label="Aksi cepat" className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#dc2626]" />
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white">
            Aksi Cepat
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-[#0a0a0a] border-2 border-white p-5 flex items-start gap-4 hover:border-[#dc2626] hover:shadow-[4px_4px_0_#dc2626] transition-all"
              >
                <span className="shrink-0 w-12 h-12 border-2 border-white flex items-center justify-center group-hover:border-[#dc2626] group-hover:bg-[#dc2626] transition-colors">
                  <Icon
                    size={22}
                    strokeWidth={2.5}
                    className="text-white group-hover:text-white"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black uppercase tracking-wider text-white mb-1">
                    {link.title}
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {link.desc}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="text-neutral-600 group-hover:text-[#dc2626] transition-colors shrink-0 mt-1"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent orders placeholder */}
      <section aria-label="Pesanan terbaru">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white mb-4">
          Pesanan Terbaru
        </h2>
        <div className="bg-[#0a0a0a] border-2 border-white p-6 text-center">
          <ShoppingBag size={32} className="text-neutral-600 mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
            Belum ada pesanan
          </p>
          <p className="text-[10px] text-neutral-600">
            Daftar pesanan masuk akan tersedia di Fase 7.
          </p>
        </div>
      </section>
    </div>
  );
}

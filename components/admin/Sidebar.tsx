"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Package,
  Tag,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Kategori", href: "/admin/kategori", icon: Layers },
  { label: "Produk", href: "/admin/produk", icon: Package },
  { label: "Promo", href: "/admin/promo", icon: Tag },
  { label: "Pesanan", href: "/admin/pesanan", icon: ShoppingBag },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      showToast("info", "Logout berhasil");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      showToast("info", "Logout gagal, coba lagi");
    }
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-[#0a0a0a] border-r-2 border-[#dc2626] flex-col z-40">
      {/* Logo */}
      <div className="border-b-2 border-white p-5">
        <p className="text-2xl font-black tracking-tighter text-white">NXTY</p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626] mt-1">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-wider border-l-4 transition-colors",
                    active
                      ? "bg-[#dc2626] text-white border-white"
                      : "text-neutral-300 border-transparent hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t-2 border-white p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider text-neutral-300 border-2 border-transparent hover:border-[#dc2626] hover:text-[#dc2626] transition-colors"
        >
          <LogOut size={18} strokeWidth={2.5} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

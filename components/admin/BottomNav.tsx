"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Package,
  Tag,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_SIZE = 22;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Kategori", href: "/admin/kategori", icon: Layers },
  { label: "Produk", href: "/admin/produk", icon: Package },
  { label: "Promo", href: "/admin/promo", icon: Tag },
  { label: "Pesanan", href: "/admin/pesanan", icon: ShoppingBag },
];

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi admin"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0a] border-t-2 border-[#dc2626] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className="relative flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 transition-colors",
                    active ? "bg-[#dc2626]" : "bg-transparent",
                  )}
                />
                <Icon
                  size={ICON_SIZE}
                  strokeWidth={active ? 2.5 : 2}
                  className={cn(
                    "transition-colors",
                    active ? "text-[#dc2626]" : "text-neutral-400",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wide mt-1 transition-colors",
                    active ? "text-[#dc2626]" : "text-neutral-400",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

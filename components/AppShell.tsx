"use client";

import { usePathname } from "next/navigation";
import { useUI } from "@/contexts/UIContext";
import BottomNav from "./BottomNav";
import CartDrawer from "./CartDrawer";
import MobileFilterSheet from "./MobileFilterSheet";
import MobileSearchSheet from "./MobileSearchSheet";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Wrapper yang mount BottomNav (mobile), CartDrawer, dan mobile sheets.
 * State modal dikelola oleh UIContext (global).
 * BottomNav disembunyikan saat modal terbuka.
 *
 * Untuk route /admin/*, TIDAK mount BottomNav/sheets/cartdrawer karena
 * admin punya layout & BottomNav sendiri (lihat app/admin/layout.tsx).
 */
export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const {
    cartOpen,
    filterOpen,
    searchOpen,
    closeCart,
    closeFilter,
    closeSearch,
  } = useUI();
  const anyModalOpen = cartOpen || filterOpen || searchOpen;

  return (
    <>
      {children}

      {/* Sheets + CartDrawer hanya untuk storefront (skip admin) */}
      {!isAdminRoute && (
        <>
          <MobileFilterSheet isOpen={filterOpen} onClose={closeFilter} />
          <MobileSearchSheet isOpen={searchOpen} onClose={closeSearch} />
          <CartDrawer isOpen={cartOpen} onClose={closeCart} />
        </>
      )}

      {/* BottomNav hanya untuk storefront (skip admin) */}
      {!anyModalOpen && !isAdminRoute && <BottomNav />}
    </>
  );
}

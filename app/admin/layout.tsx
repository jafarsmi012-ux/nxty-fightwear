"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import AdminBottomNav from "@/components/admin/BottomNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  // Login page: no chrome, just centered form
  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">{children}</main>
      <AdminBottomNav />
    </div>
  );
}

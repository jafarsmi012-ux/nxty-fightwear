import { createAdminClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database";
import OrderListClient from "./OrderListClient";

export const dynamic = "force-dynamic";

async function loadOrders(): Promise<Order[]> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[admin/pesanan] orders error:", error.message);
      return [];
    }
    return (data ?? []) as Order[];
  } catch (err) {
    console.warn("[admin/pesanan] fetch failed:", err);
    return [];
  }
}

export default async function PesananListPage() {
  const orders = await loadOrders();
  return <OrderListClient orders={orders} />;
}

import { requireCustomerUser } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AddressForm } from "../AddressForm";

export default async function AlamatEditPage({
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

  const { data: address } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (!address) notFound();

  return (
    <div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
        Edit Alamat
      </h1>
      <p className="text-sm text-neutral-400 mb-6">
        Perbarui alamat pengiriman
      </p>
      <AddressForm
        mode="edit"
        addressId={address.id}
        initialData={address}
      />
    </div>
  );
}

import { AddressForm } from "../AddressForm";

export default function AlamatBaruPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
        Tambah Alamat
      </h1>
      <p className="text-sm text-neutral-400 mb-6">
        Isi alamat pengiriman baru
      </p>
      <AddressForm mode="create" />
    </div>
  );
}

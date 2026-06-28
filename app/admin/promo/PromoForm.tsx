"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { Promotion, PromotionType, DiscountType } from "@/types/database";

export interface ProductOption {
  id: string;
  name: string;
}

interface PromoFormProps {
  mode: "create" | "edit";
  products: ProductOption[];
  initial?: Promotion;
}

const TYPE_OPTIONS: Array<{ value: PromotionType; label: string }> = [
  { value: "banner", label: "Banner" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "voucher", label: "Voucher" },
  { value: "bundle", label: "Bundle" },
  { value: "add_on", label: "Add On" },
];

const DISCOUNT_TYPE_OPTIONS: Array<{ value: DiscountType; label: string }> = [
  { value: "percentage", label: "Persentase (%)" },
  { value: "fixed", label: "Nominal (Rp)" },
];

/** Konversi ISO timestamp atau null ke nilai `datetime-local` (YYYY-MM-DDTHH:mm). */
function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/** Konversi nilai `datetime-local` ke ISO string. Empty string => null. */
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function PromoForm({ mode, products, initial }: PromoFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [type, setType] = useState<PromotionType>(initial?.type ?? "banner");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.cta_label ?? "");
  const [ctaHref, setCtaHref] = useState(initial?.cta_href ?? "");
  const [priority, setPriority] = useState<number>(initial?.priority ?? 99);
  const [endTime, setEndTime] = useState<string>(toDatetimeLocal(initial?.end_time));

  // Voucher fields
  const [discountType, setDiscountType] = useState<DiscountType>(
    (initial?.discount_type as DiscountType | null) ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState<string>(
    initial?.discount_value !== null && initial?.discount_value !== undefined
      ? String(initial.discount_value)
      : "",
  );
  const [minPurchase, setMinPurchase] = useState<string>(
    initial?.min_purchase !== null && initial?.min_purchase !== undefined
      ? String(initial.min_purchase)
      : "",
  );

  // Flash sale fields
  const [flashPrice, setFlashPrice] = useState<string>(
    initial?.flash_price !== null && initial?.flash_price !== undefined
      ? String(initial.flash_price)
      : "",
  );
  const [flashStock, setFlashStock] = useState<string>(
    initial?.flash_stock !== null && initial?.flash_stock !== undefined
      ? String(initial.flash_stock)
      : "",
  );
  const [productIds, setProductIds] = useState<string[]>(
    initial?.product_ids ?? [],
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleProduct(productId: string) {
    setProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      type,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      image: image.trim() || null,
      badge: badge.trim() || null,
      cta_label: ctaLabel.trim() || null,
      cta_href: ctaHref.trim() || null,
      priority,
      end_time: fromDatetimeLocal(endTime),
    };

    if (type === "voucher") {
      const dv = discountValue.trim() === "" ? null : Number(discountValue);
      const mp = minPurchase.trim() === "" ? null : Number(minPurchase);
      payload.discount_type = dv !== null ? discountType : null;
      payload.discount_value = dv !== null && !Number.isNaN(dv) ? dv : null;
      payload.min_purchase = mp !== null && !Number.isNaN(mp) ? mp : null;
      payload.flash_price = null;
      payload.flash_stock = null;
      payload.product_ids = [];
    } else if (type === "flash_sale") {
      const fp = flashPrice.trim() === "" ? null : Number(flashPrice);
      const fs = flashStock.trim() === "" ? null : Number(flashStock);
      payload.discount_type = null;
      payload.discount_value = null;
      payload.min_purchase = null;
      payload.flash_price = fp !== null && !Number.isNaN(fp) ? fp : null;
      payload.flash_stock = fs !== null && !Number.isNaN(fs) ? fs : null;
      payload.product_ids = productIds;
    } else if (type === "banner") {
      payload.discount_type = null;
      payload.discount_value = null;
      payload.min_purchase = null;
      payload.flash_price = null;
      payload.flash_stock = null;
      payload.product_ids = [];
    } else {
      // bundle / add_on
      payload.discount_type = null;
      payload.discount_value = null;
      payload.min_purchase = null;
      payload.flash_price = null;
      payload.flash_stock = null;
      payload.product_ids = productIds;
    }

    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast("info", "Judul promo wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/promotions"
          : `/api/admin/promotions/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        showToast("info", json.error ?? "Gagal menyimpan promo");
        return;
      }

      showToast(
        "success",
        mode === "create"
          ? "Promo berhasil dibuat"
          : "Promo berhasil diperbarui",
      );
      router.push("/admin/promo");
      router.refresh();
    } catch {
      showToast("info", "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    const confirmed = window.confirm(
      `Hapus promo "${initial.title}"? Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/promotions/${initial.id}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        showToast("info", json.error ?? "Gagal menghapus promo");
        return;
      }

      showToast("success", "Promo berhasil dihapus");
      router.push("/admin/promo");
      router.refresh();
    } catch {
      showToast("info", "Terjadi kesalahan jaringan");
    } finally {
      setDeleting(false);
    }
  }

  const baseInput =
    "w-full bg-[#161616] border-2 border-[#262626] px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#dc2626] transition-colors";
  const baseSelect =
    "w-full bg-[#161616] border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#dc2626] transition-colors appearance-none";

  const disabled = submitting || deleting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* === Section 1: Field utama === */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#dc2626]">
            01
          </span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
            Identitas Promo
          </h2>
        </div>

        {/* Tipe */}
        <div>
          <label
            htmlFor="type"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Tipe <span className="text-[#dc2626]">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as PromotionType)}
            className={baseSelect}
            disabled={disabled}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Judul */}
        <div>
          <label
            htmlFor="title"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Judul <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Flash Sale Boxing Gloves"
            className={baseInput}
            disabled={disabled}
          />
        </div>

        {/* Subtitle */}
        <div>
          <label
            htmlFor="subtitle"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Subtitle
          </label>
          <input
            id="subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Teks kecil di bawah judul (opsional)"
            className={baseInput}
            disabled={disabled}
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label
            htmlFor="description"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Deskripsi
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi lengkap promo (opsional)"
            className={`${baseInput} resize-none`}
            disabled={disabled}
          />
        </div>

        {/* Badge */}
        <div>
          <label
            htmlFor="badge"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Badge
          </label>
          <input
            id="badge"
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Contoh: LIMITED, NEW, -50%"
            className={baseInput}
            disabled={disabled}
          />
        </div>
      </div>

      {/* === Section 2: CTA & Prioritas === */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#dc2626]">
            02
          </span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
            Tampilan & Penjadwalan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="cta_label"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              CTA Label
            </label>
            <input
              id="cta_label"
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Contoh: Belanja Sekarang"
              className={baseInput}
              disabled={disabled}
            />
          </div>
          <div>
            <label
              htmlFor="cta_href"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              CTA Href
            </label>
            <input
              id="cta_href"
              type="text"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="Contoh: /kategori/boxing-gloves"
              className={`${baseInput} font-mono`}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="priority"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Prioritas
            </label>
            <input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              min={0}
              className={`${baseInput} font-mono`}
              disabled={disabled}
            />
            <p className="mt-2 text-[10px] text-neutral-500">
              Angka kecil = tampil lebih dulu. Default 99.
            </p>
          </div>
          <div>
            <label
              htmlFor="end_time"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Berakhir Pada
            </label>
            <input
              id="end_time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={baseInput}
              disabled={disabled}
            />
            <p className="mt-2 text-[10px] text-neutral-500">
              Kosongkan jika tidak ada batas waktu.
            </p>
          </div>
        </div>
      </div>

      {/* === Section 3: Field kondisional per tipe === */}
      <div className="bg-[#0a0a0a] border-2 border-[#dc2626] p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#dc2626]">
            03
          </span>
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
            Pengaturan Tipe: {TYPE_OPTIONS.find((o) => o.value === type)?.label}
          </h2>
        </div>

        {/* === Voucher === */}
        {type === "voucher" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="discount_type"
                  className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
                >
                  Tipe Diskon
                </label>
                <select
                  id="discount_type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className={baseSelect}
                  disabled={disabled}
                >
                  {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="discount_value"
                  className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
                >
                  Nilai Diskon
                </label>
                <input
                  id="discount_value"
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "10" : "50000"}
                  className={`${baseInput} font-mono`}
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="min_purchase"
                className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
              >
                Minimum Pembelian (Rp)
              </label>
              <input
                id="min_purchase"
                type="number"
                min={0}
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="Contoh: 200000"
                className={`${baseInput} font-mono`}
                disabled={disabled}
              />
              <p className="mt-2 text-[10px] text-neutral-500">
                Voucher hanya berlaku jika subtotal mencapai nilai ini.
                Kosongkan jika tidak ada minimum.
              </p>
            </div>
          </>
        ) : null}

        {/* === Flash Sale === */}
        {type === "flash_sale" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="flash_price"
                  className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
                >
                  Harga Flash (Rp)
                </label>
                <input
                  id="flash_price"
                  type="number"
                  min={0}
                  value={flashPrice}
                  onChange={(e) => setFlashPrice(e.target.value)}
                  placeholder="Contoh: 199000"
                  className={`${baseInput} font-mono`}
                  disabled={disabled}
                />
              </div>
              <div>
                <label
                  htmlFor="flash_stock"
                  className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
                >
                  Stok Flash
                </label>
                <input
                  id="flash_stock"
                  type="number"
                  min={0}
                  value={flashStock}
                  onChange={(e) => setFlashStock(e.target.value)}
                  placeholder="Contoh: 50"
                  className={`${baseInput} font-mono`}
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2">
                Produk ({productIds.length} dipilih)
              </label>
              {products.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic">
                  Belum ada produk. Tambahkan produk terlebih dahulu untuk
                  mengaitkannya ke flash sale.
                </p>
              ) : (
                <div className="bg-[#161616] border-2 border-[#262626] max-h-72 overflow-y-auto">
                  {products.map((p) => {
                    const checked = productIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b-2 border-[#262626] last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors ${
                          checked ? "bg-[#dc2626]/10" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                          disabled={disabled}
                          className="w-4 h-4 accent-[#dc2626]"
                        />
                        <span className="text-xs font-black text-white">
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* === Banner === */}
        {type === "banner" ? (
          <div>
            <label
              htmlFor="image"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              URL Gambar
            </label>
            <input
              id="image"
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://... atau /images/banner.jpg"
              className={`${baseInput} font-mono`}
              disabled={disabled}
            />
            <p className="mt-2 text-[10px] text-neutral-500">
              URL absolut atau path publik. Disarankan rasio 16:9.
            </p>
            {image ? (
              <div className="mt-3 border-2 border-[#262626] bg-[#161616] p-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Preview banner"
                  className="max-h-40 max-w-full object-contain"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* === Bundle / Add On === */}
        {type === "bundle" || type === "add_on" ? (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2">
                Produk Terkait ({productIds.length} dipilih)
              </label>
              {products.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic">
                  Belum ada produk. Tambahkan produk terlebih dahulu untuk
                  mengaitkannya.
                </p>
              ) : (
                <div className="bg-[#161616] border-2 border-[#262626] max-h-72 overflow-y-auto">
                  {products.map((p) => {
                    const checked = productIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b-2 border-[#262626] last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors ${
                          checked ? "bg-[#dc2626]/10" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                          disabled={disabled}
                          className="w-4 h-4 accent-[#dc2626]"
                        />
                        <span className="text-xs font-black text-white">
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            {mode === "create" ? "Simpan" : "Simpan Perubahan"}
          </button>
          <Link
            href="/admin/promo"
            className="inline-flex items-center bg-[#0a0a0a] text-white border-2 border-white px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#0a0a0a] transition-colors"
          >
            Batal
          </Link>
        </div>

        {mode === "edit" && initial ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-[#dc2626] border-2 border-[#dc2626] px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-[#dc2626] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} strokeWidth={2.5} />
            )}
            Hapus Promo
          </button>
        ) : null}
      </div>
    </form>
  );
}

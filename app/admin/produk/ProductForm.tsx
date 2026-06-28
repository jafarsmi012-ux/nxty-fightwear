"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import ImageUploader, { type ImageItem } from "@/components/admin/ImageUploader";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface ProductInitial {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  sizes: string[];
  colors: string[];
  rating: number;
  reviews_count: number;
  featured: boolean;
  in_stock: boolean;
  weight_grams: number;
  images: ImageItem[];
}

interface ProductFormProps {
  mode: "create" | "edit";
  categories: CategoryOption[];
  initial?: ProductInitial;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const baseInput =
  "w-full bg-[#161616] border-2 border-[#262626] px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function ProductForm({
  mode,
  categories,
  initial,
}: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState<string>(
    initial?.original_price != null ? String(initial.original_price) : "",
  );
  const [weightGrams, setWeightGrams] = useState<string>(
    initial?.weight_grams != null ? String(initial.weight_grams) : "500",
  );
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [rating, setRating] = useState<string>(
    initial?.rating != null ? String(initial.rating) : "4.5",
  );
  const [reviewsCount, setReviewsCount] = useState<string>(
    initial?.reviews_count != null ? String(initial.reviews_count) : "0",
  );
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);
  const [inStock, setInStock] = useState<boolean>(initial?.in_stock ?? true);
  const [images, setImages] = useState<ImageItem[]>(initial?.images ?? []);
  const [submitting, setSubmitting] = useState(false);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function addSize() {
    const v = sizeInput.trim();
    if (!v) return;
    if (sizes.includes(v)) {
      setSizeInput("");
      return;
    }
    setSizes([...sizes, v]);
    setSizeInput("");
  }

  function removeSize(value: string) {
    setSizes(sizes.filter((s) => s !== value));
  }

  function addColor() {
    const v = colorInput.trim();
    if (!v) return;
    if (colors.includes(v)) {
      setColorInput("");
      return;
    }
    setColors([...colors, v]);
    setColorInput("");
  }

  function removeColor(value: string) {
    setColors(colors.filter((c) => c !== value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) {
      showToast("info", "Nama produk wajib diisi");
      return;
    }
    if (!trimmedSlug) {
      showToast("info", "Slug produk wajib diisi");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      showToast("info", "Harga harus berupa angka >= 0");
      return;
    }
    const weightNum = Number(weightGrams);
    if (!Number.isFinite(weightNum) || weightNum < 0) {
      showToast("info", "Berat harus berupa angka >= 0");
      return;
    }
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      showToast("info", "Rating harus antara 0 dan 5");
      return;
    }
    const reviewsNum = Number(reviewsCount);
    if (!Number.isFinite(reviewsNum) || reviewsNum < 0) {
      showToast("info", "Reviews count harus angka >= 0");
      return;
    }

    let originalPriceNum: number | null = null;
    if (originalPrice.trim() !== "") {
      const op = Number(originalPrice);
      if (!Number.isFinite(op) || op < 0) {
        showToast("info", "Harga coret harus angka >= 0");
        return;
      }
      originalPriceNum = op;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        slug: trimmedSlug,
        category_id: categoryId || null,
        description: description.trim() || null,
        price: priceNum,
        original_price: originalPriceNum,
        sizes,
        colors,
        rating: ratingNum,
        reviews_count: Math.floor(reviewsNum),
        featured,
        in_stock: inStock,
        weight_grams: Math.floor(weightNum),
        images: images.map((img, idx) => ({
          url: img.url,
          sort_order: img.sort_order ?? idx,
        })),
      };

      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        showToast("info", json.error ?? "Gagal menyimpan produk");
        return;
      }

      showToast(
        "success",
        mode === "create"
          ? "Produk berhasil dibuat"
          : "Produk berhasil diperbarui",
      );
      router.push("/admin/produk");
      router.refresh();
    } catch {
      showToast("info", "Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECTION: Identitas */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626]">
          Identitas Produk
        </h2>

        <div>
          <label
            htmlFor="name"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Nama <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Contoh: Boxing Gloves Pro Series"
            className={baseInput}
            disabled={submitting}
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Slug <span className="text-[#dc2626]">*</span>
          </label>
          <input
            id="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="boxing-gloves-pro-series"
            className={`${baseInput} font-mono`}
            disabled={submitting}
          />
          <p className="mt-2 text-[10px] text-neutral-500">
            URL-friendly identifier. Otomatis terisi dari nama, bisa diubah.
          </p>
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Kategori
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={baseInput}
            disabled={submitting}
          >
            <option value="">— Tanpa kategori —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

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
            placeholder="Deskripsi produk (opsional)"
            className={`${baseInput} resize-none`}
            disabled={submitting}
          />
        </div>
      </div>

      {/* SECTION: Harga & Stok */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626]">
          Harga & Stok
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="price"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Harga (IDR) <span className="text-[#dc2626]">*</span>
            </label>
            <input
              id="price"
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="450000"
              className={`${baseInput} font-mono`}
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="originalPrice"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Harga Coret (IDR)
            </label>
            <input
              id="originalPrice"
              type="number"
              min={0}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Opsional"
              className={`${baseInput} font-mono`}
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="weight"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Berat (gram)
            </label>
            <input
              id="weight"
              type="number"
              min={0}
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              placeholder="500"
              className={`${baseInput} font-mono`}
              disabled={submitting}
            />
            <p className="mt-2 text-[10px] text-neutral-500">
              Digunakan untuk hitung ongkir.
            </p>
          </div>

          <div>
            <label
              htmlFor="rating"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Rating (0-5)
            </label>
            <input
              id="rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="4.5"
              className={`${baseInput} font-mono`}
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="reviewsCount"
              className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
            >
              Reviews Count
            </label>
            <input
              id="reviewsCount"
              type="number"
              min={0}
              value={reviewsCount}
              onChange={(e) => setReviewsCount(e.target.value)}
              placeholder="0"
              className={`${baseInput} font-mono`}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              disabled={submitting}
              className="sr-only peer"
            />
            <span
              aria-hidden
              className={`w-10 h-5 border-2 transition-colors flex items-center px-0.5 ${
                featured
                  ? "bg-[#dc2626] border-[#dc2626]"
                  : "bg-[#161616] border-[#262626]"
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 bg-white transition-transform ${
                  featured ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Featured
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              disabled={submitting}
              className="sr-only peer"
            />
            <span
              aria-hidden
              className={`w-10 h-5 border-2 transition-colors flex items-center px-0.5 ${
                inStock
                  ? "bg-[#dc2626] border-[#dc2626]"
                  : "bg-[#161616] border-[#262626]"
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 bg-white transition-transform ${
                  inStock ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-white">
              In Stock
            </span>
          </label>
        </div>
      </div>

      {/* SECTION: Variasi */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626]">
          Variasi
        </h2>

        <div>
          <label
            htmlFor="sizeInput"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Ukuran
          </label>
          <div className="flex gap-2">
            <input
              id="sizeInput"
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize();
                }
              }}
              placeholder="Contoh: 10oz, 12oz"
              className={baseInput}
              disabled={submitting}
            />
            <button
              type="button"
              onClick={addSize}
              disabled={submitting || !sizeInput.trim()}
              className="shrink-0 inline-flex items-center gap-1 bg-[#dc2626] text-white border-2 border-[#dc2626] px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={12} strokeWidth={2.5} />
              Tambah
            </button>
          </div>
          {sizes.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <li
                  key={s}
                  className="inline-flex items-center gap-2 bg-[#161616] border-2 border-[#262626] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSize(s)}
                    disabled={submitting}
                    aria-label={`Hapus ukuran ${s}`}
                    className="text-neutral-500 hover:text-[#dc2626]"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[10px] text-neutral-500">
              Tekan Enter atau klik Tambah untuk menambahkan.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="colorInput"
            className="block text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-2"
          >
            Warna
          </label>
          <div className="flex gap-2">
            <input
              id="colorInput"
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor();
                }
              }}
              placeholder="Contoh: Hitam, Merah"
              className={baseInput}
              disabled={submitting}
            />
            <button
              type="button"
              onClick={addColor}
              disabled={submitting || !colorInput.trim()}
              className="shrink-0 inline-flex items-center gap-1 bg-[#dc2626] text-white border-2 border-[#dc2626] px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={12} strokeWidth={2.5} />
              Tambah
            </button>
          </div>
          {colors.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {colors.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-2 bg-[#161616] border-2 border-[#262626] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeColor(c)}
                    disabled={submitting}
                    aria-label={`Hapus warna ${c}`}
                    className="text-neutral-500 hover:text-[#dc2626]"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[10px] text-neutral-500">
              Tekan Enter atau klik Tambah untuk menambahkan.
            </p>
          )}
        </div>
      </div>

      {/* SECTION: Gambar */}
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dc2626]">
            Gambar Produk
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono">
            {images.length}/5 gambar
          </p>
        </div>
        <ImageUploader images={images} onChange={setImages} maxImages={5} />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {mode === "create" ? "Simpan Produk" : "Simpan Perubahan"}
        </button>
        <Link
          href="/admin/produk"
          className="inline-flex items-center bg-[#0a0a0a] text-white border-2 border-white px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#0a0a0a] transition-colors"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

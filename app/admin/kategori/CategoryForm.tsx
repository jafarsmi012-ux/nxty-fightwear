"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface CategoryFormProps {
  mode: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
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

export default function CategoryForm({ mode, initial }: CategoryFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) {
      showToast("info", "Nama kategori wajib diisi");
      return;
    }
    if (!trimmedSlug) {
      showToast("info", "Slug kategori wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/categories"
          : `/api/admin/categories/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          slug: trimmedSlug,
          description: description.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        showToast("info", json.error ?? "Gagal menyimpan kategori");
        return;
      }

      showToast(
        "success",
        mode === "create"
          ? "Kategori berhasil dibuat"
          : "Kategori berhasil diperbarui",
      );
      router.push("/admin/kategori");
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
      `Hapus kategori "${initial.name}"? Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${initial.id}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        showToast("info", json.error ?? "Gagal menghapus kategori");
        return;
      }

      showToast("success", "Kategori berhasil dihapus");
      router.push("/admin/kategori");
      router.refresh();
    } catch {
      showToast("info", "Terjadi kesalahan jaringan");
    } finally {
      setDeleting(false);
    }
  }

  const baseInput =
    "w-full bg-[#161616] border-2 border-[#262626] px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#dc2626] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#0a0a0a] border-2 border-[#262626] p-5 md:p-6 space-y-5">
        {/* Nama */}
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
            placeholder="Contoh: Boxing Gloves"
            className={baseInput}
            disabled={submitting || deleting}
          />
        </div>

        {/* Slug */}
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
            placeholder="boxing-gloves"
            className={`${baseInput} font-mono`}
            disabled={submitting || deleting}
          />
          <p className="mt-2 text-[10px] text-neutral-500">
            URL-friendly identifier. Otomatis terisi dari nama, tapi bisa
            diubah.
          </p>
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
            placeholder="Deskripsi singkat kategori (opsional)"
            className={`${baseInput} resize-none`}
            disabled={submitting || deleting}
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting || deleting}
            className="inline-flex items-center gap-2 bg-[#dc2626] text-white border-2 border-[#dc2626] px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            {mode === "create" ? "Simpan" : "Simpan Perubahan"}
          </button>
          <Link
            href="/admin/kategori"
            className="inline-flex items-center bg-[#0a0a0a] text-white border-2 border-white px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-[#0a0a0a] transition-colors"
          >
            Batal
          </Link>
        </div>

        {mode === "edit" && initial ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-[#dc2626] border-2 border-[#dc2626] px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-[#dc2626] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} strokeWidth={2.5} />
            )}
            Hapus Kategori
          </button>
        ) : null}
      </div>
    </form>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Star, Trash2, Upload, X } from "lucide-react";


export interface ImageItem {
  id?: string;
  url: string;
  sort_order: number;
  /** Flag untuk membedakan URL existing vs baru (supaya tidak ada ID DB) */
  pending?: boolean;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({
  images,
  onChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const remaining = Math.max(0, maxImages - images.length);

  const uploadOne = useCallback(
    async (file: File): Promise<ImageItem | null> => {
      if (file.size <= 0) return null;
      if (file.size > MAX_BYTES) {
        setError("Ukuran file maksimal 5MB");
        return null;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Tipe file harus JPEG, PNG, atau WebP");
        return null;
      }

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Upload gagal");
        return null;
      }
      return {
        url: json.url,
        sort_order: 0,
        pending: true,
      };
    },
    [],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      setError(null);
      const slots = Math.min(list.length, remaining);
      if (slots <= 0) {
        setError(`Maksimal ${maxImages} gambar per produk`);
        return;
      }
      const accepted = list.slice(0, slots);
      setUploading(true);
      try {
        const results: ImageItem[] = [];
        for (const f of accepted) {
          // eslint-disable-next-line no-await-in-loop
          const item = await uploadOne(f);
          if (item) results.push(item);
        }
        if (results.length > 0) {
          const baseOrder = images.length;
          const reindexed = results.map((it, i) => ({
            ...it,
            sort_order: baseOrder + i,
          }));
          onChange([...images, ...reindexed]);
        }
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [images, maxImages, onChange, remaining, uploadOne],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      void handleFiles(e.target.files);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => imageKey(i) === active.id);
    const newIndex = images.findIndex((i) => imageKey(i) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(images, oldIndex, newIndex).map((it, idx) => ({
      ...it,
      sort_order: idx,
    }));
    onChange(reordered);
  }

  function removeAt(targetKey: string) {
    const next = images
      .filter((i) => imageKey(i) !== targetKey)
      .map((it, idx) => ({ ...it, sort_order: idx }));
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-[#dc2626] bg-[#dc2626]/10"
            : "border-[#262626] bg-[#161616]"
        } ${remaining === 0 ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-2 border-[#dc2626] flex items-center justify-center bg-[#dc2626]/10">
            {uploading ? (
              <Loader2 size={18} className="text-[#dc2626] animate-spin" />
            ) : (
              <Upload size={18} className="text-[#dc2626]" strokeWidth={2.5} />
            )}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-white">
            {uploading
              ? "Mengupload…"
              : remaining === 0
                ? "Batas tercapai"
                : "Drop gambar di sini"}
          </p>
          <p className="text-[10px] text-neutral-500">
            atau klik tombol di bawah. JPEG/PNG/WebP, maks 5MB, total maks{" "}
            {maxImages} gambar.
          </p>
          <button
            type="button"
            disabled={uploading || remaining === 0}
            onClick={() => inputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-2 bg-[#0a0a0a] text-white border-2 border-white px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-[#0a0a0a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={12} strokeWidth={2.5} />
            Pilih File
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      </div>

      {error ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-[#dc2626]">
          {error}
        </p>
      ) : null}

      {/* Sortable list */}
      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(imageKey)}>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <SortableImage
                  key={imageKey(img)}
                  image={img}
                  index={idx}
                  onRemove={() => removeAt(imageKey(img))}
                  disabled={uploading}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-[10px] text-neutral-500">
          Belum ada gambar. Gambar pertama akan menjadi gambar utama produk.
        </p>
      )}
    </div>
  );
}

function imageKey(img: ImageItem): string {
  return img.id ?? `pending-${img.url}`;
}

interface SortableImageProps {
  image: ImageItem;
  index: number;
  onRemove: () => void;
  disabled: boolean;
}

function SortableImage({ image, index, onRemove, disabled }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: imageKey(image) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative border-2 border-[#262626] bg-[#0a0a0a] group"
    >
      <div className="relative aspect-square bg-[#161616]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={`Gambar ${index + 1}`}
          className="w-full h-full object-cover"
        />
        {index === 0 ? (
          <span className="absolute top-1 left-1 inline-flex items-center gap-1 bg-[#dc2626] text-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
            <Star size={9} strokeWidth={2.5} />
            Utama
          </span>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Hapus gambar"
          className="absolute top-1 right-1 w-6 h-6 bg-[#0a0a0a] border border-[#dc2626] text-[#dc2626] flex items-center justify-center hover:bg-[#dc2626] hover:text-white transition-colors disabled:opacity-50"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex items-center justify-between px-2 py-1.5 border-t-2 border-[#262626]">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag untuk reorder"
          className="text-neutral-500 hover:text-[#dc2626] cursor-grab active:cursor-grabbing p-1 -ml-1"
        >
          <GripVertical size={14} strokeWidth={2.5} />
        </button>
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
          #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Hapus"
          className="text-neutral-500 hover:text-[#dc2626] p-1 -mr-1"
        >
          <Trash2 size={12} strokeWidth={2.5} />
        </button>
      </div>
    </li>
  );
}


"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { PromotionType } from "@/types/database";

const TYPE_OPTIONS: Array<{ value: PromotionType | "all"; label: string }> = [
  { value: "all", label: "Semua Tipe" },
  { value: "banner", label: "Banner" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "voucher", label: "Voucher" },
  { value: "bundle", label: "Bundle" },
  { value: "add_on", label: "Add On" },
];

export default function TypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = searchParams.get("type") ?? "all";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/promo?${qs}` : "/admin/promo");
    });
  }

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
        Filter:
      </span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="bg-[#161616] border-2 border-[#262626] px-3 py-2 text-xs font-black uppercase tracking-wider text-white focus:outline-none focus:border-[#dc2626] transition-colors disabled:opacity-50"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

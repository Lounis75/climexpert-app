"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PERIODS = [
  { value: "1d",  label: "1j" },
  { value: "7d",  label: "7j" },
  { value: "1m",  label: "1m" },
  { value: "1y",  label: "1an" },
  { value: "all", label: "Toujours" },
] as const;

export default function AlexPeriodSelector({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-slate-800 border border-white/8 rounded-lg">
      {PERIODS.map(({ value, label }) => {
        const active = current === value;
        return (
          <button
            key={value}
            onClick={() => select(value)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              active
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export type Stat = { value: number; prefix?: string; suffix?: string; label: string; sub?: string };

function useCountUp(target: number, start: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return val;
}

function StatCard({ s, start }: { s: Stat; start: boolean }) {
  const v = useCountUp(s.value, start);
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 text-center">
      <p className="text-4xl sm:text-5xl font-bold text-sky-600 tabular-nums leading-none">
        {s.prefix}{v}{s.suffix}
      </p>
      <p className="text-slate-900 font-semibold mt-3">{s.label}</p>
      {s.sub && <p className="text-slate-400 text-sm mt-0.5">{s.sub}</p>}
    </div>
  );
}

/** Grille de chiffres qui s'animent (count-up) au moment où elle entre dans l'écran. */
export default function StatsCounter({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => <StatCard key={i} s={s} start={inView} />)}
    </div>
  );
}

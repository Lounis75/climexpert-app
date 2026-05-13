"use client";

import { useState } from "react";
import { Calculator as CalculatorIcon, ArrowRight, Info } from "lucide-react";

const ISOLATION = [
  { id: "good", label: "Bien isolé", sublabel: "Double vitrage, isolation récente", watt: 35 },
  { id: "average", label: "Isolation moyenne", sublabel: "Double vitrage, isolation standard", watt: 45 },
  { id: "poor", label: "Mal isolé", sublabel: "Simple vitrage, ancienne construction", watt: 60 },
];

const EXPOSURE = [
  { id: "low", label: "Peu ensoleillé", sublabel: "Façade nord ou ombragée", factor: 1.0 },
  { id: "medium", label: "Modérément ensoleillé", sublabel: "Façade est ou ouest", factor: 1.15 },
  { id: "high", label: "Très ensoleillé", sublabel: "Façade sud, Velux, verrière", factor: 1.3 },
];

function getRecommendation(kw: number, rooms: number) {
  if (rooms === 1 && kw <= 3.5) return { system: "Monosplit", kw: `${Math.ceil(kw * 2) / 2} kW`, price: "1 500 – 2 500 € TTC", color: "sky" };
  if (rooms <= 3 && kw <= 9) return { system: "Multisplit", kw: `${Math.round(kw)} kW total`, price: "2 800 – 5 500 € TTC", color: "emerald" };
  if (kw > 9) return { system: "Gainable ou PAC", kw: `${Math.round(kw)} kW total`, price: "4 000 – 10 000 € TTC", color: "amber" };
  return { system: "Multisplit", kw: `${Math.round(kw)} kW total`, price: "2 800 – 6 000 € TTC", color: "emerald" };
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  sky: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", badge: "bg-sky-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-500" },
};

export default function Calculator() {
  const [surface, setSurface] = useState(30);
  const [height, setHeight] = useState(2.5);
  const [rooms, setRooms] = useState(1);
  const [isolation, setIsolation] = useState("average");
  const [exposure, setExposure] = useState("medium");

  const isolationData = ISOLATION.find((i) => i.id === isolation)!;
  const exposureData = EXPOSURE.find((e) => e.id === exposure)!;

  const kwPerRoom = (surface / rooms) * (height / 2.5) * (isolationData.watt / 1000) * exposureData.factor;
  const totalKw = kwPerRoom * rooms;
  const rec = getRecommendation(totalKw, rooms);
  const colors = colorMap[rec.color];

  function openChat() {
    window.dispatchEvent(new CustomEvent("open-chat", { detail: { topic: "Installation" } }));
  }

  return (
    <div id="calculateur" className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden scroll-mt-24">
      {/* Header */}
      <div className="bg-[#0B1120] px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
          <CalculatorIcon className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Calculateur de puissance</p>
          <p className="text-slate-400 text-xs">Estimez la capacité nécessaire pour votre logement</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Surface + Hauteur */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-3">
              Surface totale à climatiser
              <span className="text-sky-600 font-bold text-base tabular-nums">{surface} m²</span>
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={surface}
              onChange={(e) => setSurface(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>10 m²</span><span>200 m²</span>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-3">
              Hauteur sous plafond
              <span className="text-sky-600 font-bold text-base tabular-nums">{height.toFixed(1)} m</span>
            </label>
            <input
              type="range"
              min={2.2}
              max={4.0}
              step={0.1}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>2,2 m</span><span>4,0 m</span>
            </div>
          </div>
        </div>

        {/* Nombre de pièces */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Nombre de pièces à climatiser
          </label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setRooms(n)}
                className={`w-11 h-11 rounded-xl border font-semibold text-sm transition-all ${
                  rooms === n
                    ? "bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Isolation */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Isolation du logement</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {ISOLATION.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setIsolation(opt.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  isolation === opt.id
                    ? "bg-sky-50 border-sky-400 text-sky-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.sublabel}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Exposition */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Exposition solaire</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {EXPOSURE.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setExposure(opt.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  exposure === opt.id
                    ? "bg-sky-50 border-sky-400 text-sky-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.sublabel}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Résultat */}
        <div className={`rounded-2xl border p-5 ${colors.bg} ${colors.border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Puissance recommandée
              </p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className={`text-4xl font-extrabold tracking-tight ${colors.text}`}>
                  {rec.kw}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-white text-xs font-bold ${colors.badge}`}>
                  {rec.system}
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                Budget estimé : <span className="font-semibold text-slate-700">{rec.price}</span>, pose incluse
              </p>
              <p className="text-slate-400 text-xs mt-1">Prix TTC pour les particuliers. Professionnel : déduisez la TVA (20%).</p>
            </div>
            <button
              onClick={openChat}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/20"
            >
              Devis précis gratuit
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>
            Estimation indicative basée sur les normes thermiques françaises (35-60 W/m²).
            Une étude thermique gratuite par nos techniciens affine ce résultat selon votre configuration réelle.
          </p>
        </div>
      </div>
    </div>
  );
}

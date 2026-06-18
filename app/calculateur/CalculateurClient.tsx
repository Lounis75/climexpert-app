"use client";

import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/components/Tracker";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Phone,
  ShieldCheck, Zap, Info, ChevronRight,
  Star, MessageCircle, Building2, Home, Briefcase,
  Clock, Camera, ImagePlus,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const BIEN_TYPES = [
  { value: "appartement", label: "Appartement",  sublabel: "Studio, T2, T3…",          icon: Building2 },
  { value: "maison",      label: "Maison",        sublabel: "Individuelle, mitoyenne…",  icon: Home },
  { value: "local",       label: "Local pro",     sublabel: "Bureau, commerce, atelier", icon: Briefcase },
];

const ISOLATION = [
  { id: "good",    label: "Bien isolé",        sublabel: "Double vitrage récent, isolation ≤ 10 ans", watt: 35 },
  { id: "average", label: "Isolation moyenne", sublabel: "Double vitrage standard",                   watt: 45 },
  { id: "poor",    label: "Mal isolé",         sublabel: "Simple vitrage ou ancienne construction",   watt: 60 },
];

const EXPOSURE = [
  { id: "low",    label: "Peu ensoleillé",  sublabel: "Façade nord ou ombragée", factor: 1.0  },
  { id: "medium", label: "Modérément",      sublabel: "Façade est ou ouest",     factor: 1.15 },
  { id: "high",   label: "Très ensoleillé", sublabel: "Façade sud ou Velux",     factor: 1.3  },
];

const TOTAL_STEPS = 4;
const TIME_LABELS = ["~1 min 30", "~1 min", "~20 sec", "Résultat immédiat"];

// ─── Calcul ───────────────────────────────────────────────────────────────────

function calcResult(surface: number, height: number, rooms: number, isoId: string, expId: string) {
  const iso = ISOLATION.find(i => i.id === isoId)!;
  const exp = EXPOSURE.find(e => e.id === expId)!;
  const kw  = surface * (height / 2.5) * (iso.watt / 1000) * exp.factor;

  if (rooms === 1 && kw <= 3.5) return { system: "Monosplit",           kwRaw: kw, priceMin: 1500, priceMax: 2500,  color: "sky"     };
  if (rooms <= 2 && kw <= 7)    return { system: "Multisplit 2 pièces", kwRaw: kw, priceMin: 2800, priceMax: 4000,  color: "emerald" };
  if (rooms <= 3 && kw <= 9)    return { system: "Multisplit 3 pièces", kwRaw: kw, priceMin: 3800, priceMax: 5500,  color: "emerald" };
  if (rooms <= 6 && kw <= 14)   return { system: "Multisplit 4-6 p.",   kwRaw: kw, priceMin: 4500, priceMax: 8000,  color: "emerald" };
                                 return { system: "Gainable / PAC",      kwRaw: kw, priceMin: 4000, priceMax: 10000, color: "amber"   };
}

function kwLabel(kw: number) { return `${Math.round(kw * 2) / 2} kW`; }
function fmt(n: number) { return n.toLocaleString("fr-FR") + " €"; }

function getBrands(priceMin: number, priceMax: number) {
  return [
    { name: "Daikin",              tag: "Fiabilité n°1 mondial",       minP: Math.round(priceMin * 1.12 / 50) * 50, maxP: Math.round(priceMax * 1.12 / 50) * 50, dot: "bg-sky-500"     },
    { name: "Mitsubishi Electric",  tag: "Ultra silencieux · 18 dB(A)", minP: Math.round(priceMin * 1.06 / 50) * 50, maxP: Math.round(priceMax * 1.06 / 50) * 50, dot: "bg-indigo-500"  },
    { name: "Fujitsu",             tag: "Meilleur rapport qualité/prix",minP: priceMin,                               maxP: priceMax,                                dot: "bg-emerald-500" },
  ];
}

function getAides(system: string) {
  if (system.includes("PAC") || system.includes("Gainable")) {
    return {
      highlight: true,
      total: "jusqu'à 4 500 €",
      lines: [
        { label: "MaPrimeRénov'", amount: "2 000 – 4 000 €", detail: "Sous conditions de revenus · Dossier géré par ClimExpert" },
        { label: "CEE (Certificats d'Économies d'Énergie)", amount: "300 – 800 €", detail: "Versée directement par l'installateur" },
      ],
      note: "Nos techniciens RGE gèrent les dossiers de A à Z. Ces montants sont déduits de votre facture.",
    };
  }
  return {
    highlight: false,
    total: "150 – 300 €",
    lines: [
      { label: "CEE (Certificats d'Économies d'Énergie)", amount: "150 – 300 €", detail: "Versée par l'installateur en déduction de facture · Automatique avec technicien RGE" },
    ],
    note: "La TVA à 5,5 % s'applique si votre logement a plus de 2 ans. Économie supplémentaire de 4,5 % sur le devis.",
  };
}

const colorMap = {
  sky:     { border: "border-sky-200",     bg: "bg-sky-50",     text: "text-sky-600",     badge: "bg-sky-500"     },
  emerald: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-500" },
  amber:   { border: "border-amber-200",   bg: "bg-amber-50",   text: "text-amber-600",   badge: "bg-amber-500"   },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalculateurClient() {
  const [step,      setStep]      = useState(1);
  const [fade,      setFade]      = useState(false);

  // Tracking : enregistre une utilisation aboutie du calculateur (étape résultat).
  useEffect(() => {
    if (step === 5) trackEvent("calculateur_complete", { rooms, surface: roomSurfaces.slice(0, rooms).reduce((a, b) => a + b, 0) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Step 1
  const [bien, setBien] = useState("appartement");

  // Step 2
  const [rooms, setRooms] = useState(2);

  // Step 3
  const [roomSurfaces, setRoomSurfaces] = useState<number[]>([25, 20, 15, 12, 12, 12]);
  const [height,       setHeight]       = useState(2.5);
  const surface = roomSurfaces.slice(0, rooms).reduce((a, b) => a + b, 0);
  function updateRoomSurface(i: number, v: number) {
    setRoomSurfaces(prev => { const n = [...prev]; n[i] = v; return n; });
  }

  // Step 4
  const [isolation, setIsolation] = useState("average");

  // Step 5
  const [exposure, setExposure] = useState("medium");

  // Form
  const [societe,       setSociete]       = useState("");
  const [nom,           setNom]           = useState("");
  const [telephone,     setTelephone]     = useState("");
  const [email,         setEmail]         = useState("");
  const [adresse,       setAdresse]       = useState("");
  const [adresseSuggestions, setAdresseSuggestions] = useState<string[]>([]);
  const [showSuggestions,    setShowSuggestions]    = useState(false);
  const adresseRef = useRef<HTMLDivElement>(null);
  const [contraintes,   setContraintes]   = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; isPdf: boolean }[]>([]);
  const [uploading,     setUploading]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [error,         setError]         = useState("");

  // Fermer suggestions si clic extérieur
  useEffect(() => {
    function h(e: MouseEvent) {
      if (adresseRef.current && !adresseRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Autocomplete adresse
  useEffect(() => {
    if (adresse.length < 3) { setAdresseSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=5&autocomplete=1`);
        const data = await res.json();
        setAdresseSuggestions((data.features ?? []).map((f: { properties: { label: string } }) => f.properties.label));
        setShowSuggestions(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [adresse]);

  // Calcul
  const rec    = calcResult(surface, height, rooms, isolation, exposure);
  const colors = colorMap[rec.color as keyof typeof colorMap];
  const brands = getBrands(rec.priceMin, rec.priceMax);
  const aides  = getAides(rec.system);

  // Navigation
  function navigate(next: number) {
    setFade(true);
    setTimeout(() => { setStep(next); setFade(false); }, 180);
  }
  function autoNext(next: number) { setTimeout(() => navigate(next), 220); }

  // Upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const results: { name: string; url: string; isPdf: boolean }[] = [];
    for (const file of files.slice(0, 5)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload/devis", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          results.push({ name: file.name, url, isPdf: file.type === "application/pdf" });
        }
      } catch { /* ignore */ }
    }
    setUploadedFiles(prev => [...prev, ...results].slice(0, 5));
    setUploading(false);
    e.target.value = "";
  }

  function toggleContrainte(id: string) {
    setContraintes(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim() || !email.trim()) { setError("Nom, téléphone et email sont requis."); return; }
    setLoading(true); setError("");
    try {
      const isoData = ISOLATION.find(i => i.id === isolation)!;
      const expData = EXPOSURE.find(e => e.id === exposure)!;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom, telephone, email,
          societe: societe || undefined,
          type: "installation",
          bien,
          ville: adresse,
          message: `Via calculateur — Système : ${rec.system} · ${kwLabel(rec.kwRaw)} · Budget : ${fmt(rec.priceMin)}–${fmt(rec.priceMax)} TTC · ${rooms} pièce(s) (${roomSurfaces.slice(0, rooms).map((s, i) => `P${i + 1}:${s}m²`).join(", ")}) · Surface totale : ${surface} m² · H : ${height}m · Isolation : ${isoData.label} · Exposition : ${expData.label} · Usage : Réversible${adresse ? ` · Adresse : ${adresse}` : ""}${contraintes.length ? ` · Contraintes : ${contraintes.join(", ")}` : ""}`,
          photosUrls: uploadedFiles.map(f => f.url),
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue. Appelez-nous au 06 67 43 27 67.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const isResultStep = step > TOTAL_STEPS; // step 5+
  const progress = Math.min((step / TOTAL_STEPS) * 100, 100);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(160deg, #080d18 0%, #0c1525 100%)" }}>
        <header className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="https://climexpert.fr" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <svg viewBox="0 0 100 100" className="w-4.5 h-4.5" fill="none">
                <path d="M15 30 L65 30 Q80 30 80 18 Q80 8 68 8"   stroke="white" strokeWidth="9" strokeLinecap="round"/>
                <path d="M15 50 L72 50 Q87 50 87 38 Q87 28 75 28" stroke="white" strokeWidth="9" strokeLinecap="round"/>
                <path d="M15 70 L60 70 Q75 70 75 82 Q75 92 63 92" stroke="white" strokeWidth="9" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-sm text-white">Clim<span className="text-sky-400">Expert</span></span>
          </a>

          {/* Progress (question steps only) */}
          {!isResultStep && (
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-300 whitespace-nowrap">{TIME_LABELS[step - 1]}</span>
              </div>
            </div>
          )}

          {/* Alex */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors shadow-lg shadow-sky-500/25 flex-shrink-0 touch-manipulation"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parler à Alex</span>
            <span className="sm:hidden">Alex</span>
          </button>
        </header>

        {/* Titre (question steps) */}
        {!isResultStep && (
          <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-6 text-center">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">
              Étape {step} sur {TOTAL_STEPS}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
              {step === 1 && "Quel est votre type de bien ?"}
              {step === 2 && "Combien de pièces à climatiser ?"}
              {step === 3 && "Surface de chaque pièce"}
              {step === 4 && "Isolation & exposition solaire"}
            </h1>
            {step === 2 && <p className="text-slate-400 text-sm mt-1">Couloirs, celliers et dégagements exclus</p>}
            {step === 3 && <p className="text-slate-400 text-sm mt-1">Ajustez la surface réelle de chaque pièce</p>}
            {step === 4 && <p className="text-slate-400 text-sm mt-1">Deux dernières questions pour affiner le calcul</p>}
          </section>
        )}

        {isResultStep && (
          <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-1">Votre recommandation</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Résultat personnalisé</h1>
            <p className="text-slate-400 text-sm mt-1">Basé sur votre configuration · Devis précis sous 24h</p>
          </section>
        )}

        <div className="h-5" style={{ background: "linear-gradient(to bottom, #0c1525, #f1f5f9)" }} />
      </div>

      {/* ── Contenu wizard ──────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-10">

        <div className={`transition-all duration-180 ${fade ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>

          {/* ── ÉTAPE 1 : Type de bien ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              {BIEN_TYPES.map(({ value, label, sublabel, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setBien(value); autoNext(2); }}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all touch-manipulation active:scale-[0.98] ${
                    bien === value
                      ? "border-sky-400 bg-sky-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30 shadow-sm"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    bien === value ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-base ${bien === value ? "text-sky-700" : "text-slate-900"}`}>{label}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{sublabel}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${bien === value ? "text-sky-400" : "text-slate-300"}`} />
                </button>
              ))}
            </div>
          )}

          {/* ── ÉTAPE 2 : Nombre de pièces ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => { setRooms(n); autoNext(3); }}
                    className={`flex flex-col items-center justify-center py-7 rounded-2xl border-2 font-bold transition-all touch-manipulation active:scale-[0.97] shadow-sm ${
                      rooms === n
                        ? "border-sky-400 bg-sky-500 text-white shadow-sky-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-200"
                    }`}
                  >
                    <span className="text-3xl leading-none">{n}</span>
                    <span className={`text-xs font-medium mt-1.5 ${rooms === n ? "text-sky-100" : "text-slate-400"}`}>
                      {n === 1 ? "pièce" : "pièces"}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-slate-400 pt-1">1 pièce = 1 unité intérieure · Split par pièce</p>
            </div>
          )}

          {/* ── ÉTAPE 3 : Surface par pièce + hauteur ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Surfaces */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Surface par pièce</p>
                </div>
                <div className="p-5 space-y-5">
                  {Array.from({ length: rooms }).map((_, i) => (
                    <div key={i}>
                      <label className="flex items-center justify-between text-sm mb-2.5">
                        <span className="font-medium text-slate-700">Pièce {i + 1}</span>
                        <span className="text-sky-600 font-bold text-base tabular-nums">{roomSurfaces[i] ?? 15} m²</span>
                      </label>
                      <input
                        type="range" min={5} max={80} step={1}
                        value={roomSurfaces[i] ?? 15}
                        onChange={e => updateRoomSurface(i, Number(e.target.value))}
                        className="w-full accent-sky-500 h-1.5 rounded-full touch-manipulation"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>5 m²</span><span>80 m²</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Surface totale</span>
                    <span className="text-lg font-bold text-slate-800">{surface} m²</span>
                  </div>
                </div>
              </div>

              {/* Hauteur */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hauteur sous plafond</p>
                </div>
                <div className="p-5">
                  <label className="flex items-center justify-between text-sm mb-2.5">
                    <span className="font-medium text-slate-700">Hauteur</span>
                    <span className="text-sky-600 font-bold text-base tabular-nums">{height.toFixed(1)} m</span>
                  </label>
                  <input
                    type="range" min={2.2} max={4.0} step={0.1} value={height}
                    onChange={e => setHeight(Number(e.target.value))}
                    className="w-full accent-sky-500 h-1.5 rounded-full touch-manipulation"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>2,2 m</span><span>4,0 m</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => navigate(2)} className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors touch-manipulation">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={() => navigate(4)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-500/20 touch-manipulation">
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : Isolation + Exposition solaire ────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Isolation */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Isolation du logement</p>
                </div>
                <div className="p-3 space-y-2">
                  {ISOLATION.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setIsolation(opt.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all touch-manipulation active:scale-[0.98] ${
                        isolation === opt.id
                          ? "border-sky-400 bg-sky-50"
                          : "border-slate-100 bg-white hover:border-sky-200"
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${isolation === opt.id ? "text-sky-700" : "text-slate-900"}`}>{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.sublabel}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isolation === opt.id ? "border-sky-400 bg-sky-400" : "border-slate-300"
                      }`}>
                        {isolation === opt.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-slate-400 px-1 pt-1">
                    Construit avant 1990 sans rénovation → <span className="text-slate-600 font-medium">Mal isolé</span>
                  </p>
                </div>
              </div>

              {/* Exposition */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exposition solaire</p>
                </div>
                <div className="p-3 space-y-2">
                  {EXPOSURE.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setExposure(opt.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all touch-manipulation active:scale-[0.98] ${
                        exposure === opt.id
                          ? "border-sky-400 bg-sky-50"
                          : "border-slate-100 bg-white hover:border-sky-200"
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${exposure === opt.id ? "text-sky-700" : "text-slate-900"}`}>{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.sublabel}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        exposure === opt.id ? "border-sky-400 bg-sky-400" : "border-slate-300"
                      }`}>
                        {exposure === opt.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => navigate(3)} className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors touch-manipulation">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={() => navigate(5)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-500/20 touch-manipulation">
                  Voir mon résultat <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 5 : Résultat ──────────────────────────────────────────── */}
          {step === 5 && !submitted && (
            <>
              {/* Recommandation */}
              <div className={`rounded-2xl border p-5 mb-4 ${colors.bg} ${colors.border}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2.5 mb-1">
                      <span className={`text-3xl font-extrabold tracking-tight ${colors.text}`}>{kwLabel(rec.kwRaw)}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-white text-xs font-bold ${colors.badge}`}>{rec.system}</span>
                    </div>
                    <p className="text-slate-600 text-sm">
                      Budget estimé :{" "}
                      <span className={`font-bold ${colors.text}`}>{fmt(rec.priceMin)} – {fmt(rec.priceMax)} TTC</span>{" "}
                      <span className="text-slate-400 text-xs">(pose incluse)</span>
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />Réversible — chauffe aussi en hiver (COP 3-5)
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-200/60 pt-3 mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Ce prix inclut :</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      `Unité ext. + ${rooms} unité${rooms > 1 ? "s" : ""} int.`,
                      "Liaisons frigorifiques (5 m)",
                      "Raccordement électrique",
                      "Mise en service et tests",
                    ].map(item => (
                      <p key={item} className="text-xs text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />{item}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Récap configuration */}
                <div className="border-t border-slate-200/60 pt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Pièces", value: `${rooms}` },
                    { label: "Surface", value: `${surface} m²` },
                    { label: "Hauteur", value: `${height.toFixed(1)} m` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className={`font-bold text-sm ${colors.text}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-400 border-t border-slate-200/60 pt-3 mt-3">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <p>Estimation indicative selon normes thermiques françaises. Devis précis après étude gratuite.</p>
                </div>
              </div>

              {/* Contraintes */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Précisez si applicable — pour affiner le devis :</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "acces-difficile",  label: "Accès difficile",       detail: "Étage élevé, pas d'ascenseur"   },
                    { id: "liaisons-longues", label: "Liaisons > 6 m",        detail: "Distance unité int./ext."       },
                    { id: "copropriete",      label: "Copropriété / ABF",     detail: "Contrainte façade ou règlement" },
                    { id: "maconnerie",       label: "Percement béton/pierre", detail: "Murs épais ou armés"           },
                  ].map(({ id, label, detail }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleContrainte(id)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all touch-manipulation ${
                        contraintes.includes(id)
                          ? "bg-amber-50 border-amber-400 text-amber-700"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold">{label}</p>
                      <p className="text-slate-400 mt-0.5">{detail}</p>
                    </button>
                  ))}
                </div>
                {contraintes.length > 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Ces éléments seront transmis à votre technicien pour un chiffrage précis.
                  </p>
                )}
              </div>

              {/* Comparatif marques */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4">
                <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Comparatif marques recommandées</p>
                  <p className="text-xs text-slate-400 mt-0.5">Toutes installées par nos techniciens RGE</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {brands.map(({ name, tag, dot, minP, maxP }, i) => (
                    <div key={name} className={`flex items-center gap-3 px-5 py-4 ${i === 0 ? "bg-sky-50/50" : ""}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900">{name}</p>
                          {i === 0 && <span className="text-[10px] bg-sky-100 text-sky-600 font-medium px-1.5 py-0.5 rounded-full">Recommandé</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{tag}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700 text-right flex-shrink-0">{fmt(minP)} – {fmt(maxP)}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-start gap-2.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">Pourquoi ces écarts ?</span>{" "}
                    Daikin et Mitsubishi Electric sont haut de gamme : durabilité 15-20 ans, silence et SAV rapide. Fujitsu offre un excellent rapport qualité/prix.
                    La <span className="font-medium text-slate-700">main-d'œuvre est identique</span> — seul le matériel change.
                  </p>
                </div>
              </div>

              {/* Aides */}
              <div className={`rounded-2xl border overflow-hidden mb-4 ${aides.highlight ? "border-emerald-200" : "border-slate-200"}`}>
                <div className={`px-5 py-3.5 flex items-center justify-between ${aides.highlight ? "bg-emerald-50" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${aides.highlight ? "bg-emerald-100" : "bg-slate-100"}`}>
                      <Zap className={`w-3.5 h-3.5 ${aides.highlight ? "text-emerald-600" : "text-slate-500"}`} />
                    </div>
                    <p className={`text-sm font-semibold ${aides.highlight ? "text-emerald-800" : "text-slate-700"}`}>Aides financières disponibles</p>
                  </div>
                  <p className={`font-bold text-base ${aides.highlight ? "text-emerald-600" : "text-slate-600"}`}>{aides.total}</p>
                </div>
                <div className="bg-white divide-y divide-slate-100">
                  {aides.lines.map(({ label, amount, detail }) => (
                    <div key={label} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-medium text-slate-800">{label}</p>
                        <p className={`text-sm font-bold flex-shrink-0 ${aides.highlight ? "text-emerald-600" : "text-slate-600"}`}>{amount}</p>
                      </div>
                      <p className="text-xs text-slate-400">{detail}</p>
                    </div>
                  ))}
                </div>
                <div className={`px-5 py-3 flex items-start gap-2 ${aides.highlight ? "bg-emerald-50/60" : "bg-slate-50"}`}>
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">{aides.note}</p>
                </div>
              </div>

              {/* Formulaire */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Obtenez votre devis précis — gratuit</p>
                  <p className="text-xs text-slate-400 mt-0.5">Un technicien vous rappelle sous 24h</p>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                  {bien === "local" && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Société</label>
                      <input type="text" value={societe} onChange={e => setSociete(e.target.value)}
                        placeholder="ClimExpert SAS" autoComplete="organization"
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Prénom Nom *</label>
                      <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                        placeholder="Marie Dupont" required autoComplete="name"
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Téléphone *</label>
                      <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                        placeholder="06 12 34 56 78" required autoComplete="tel"
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Email *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="marie@email.com" required autoComplete="email"
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                    </div>
                    <div ref={adresseRef} className="relative">
                      <label className="block text-xs text-slate-400 mb-1.5">Adresse ou ville</label>
                      <input type="text" value={adresse}
                        onChange={e => { setAdresse(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => adresseSuggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Paris 16e…" autoComplete="off"
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                      {showSuggestions && adresseSuggestions.length > 0 && (
                        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          {adresseSuggestions.map(s => (
                            <li key={s} onMouseDown={() => { setAdresse(s); setShowSuggestions(false); setAdresseSuggestions([]); }}
                              className="px-3.5 py-2.5 text-sm text-slate-700 hover:bg-sky-50 cursor-pointer border-b border-slate-100 last:border-0">
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Upload photos */}
                  <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-sky-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-sky-900">Ajoutez vos photos — devis bien plus précis</p>
                        <p className="text-xs text-sky-600 mt-0.5">Photo de l&apos;emplacement, du tableau électrique, de la façade extérieure…</p>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-sky-700">
                        {[
                          "Évite les surprises de chiffrage",
                          "Technicien mieux préparé",
                          "Devis définitif dès le 1er appel",
                        ].map(b => (
                          <div key={b} className="flex items-start gap-1.5 bg-white rounded-xl px-2.5 py-2 border border-sky-100 shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-sky-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-tight">{b}</span>
                          </div>
                        ))}
                      </div>
                      <label className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-all touch-manipulation ${
                        uploading
                          ? "border-sky-300 bg-sky-100"
                          : uploadedFiles.length >= 5
                          ? "border-sky-200 bg-white opacity-60"
                          : "border-sky-300 bg-white hover:border-sky-400 hover:bg-sky-50 active:scale-[0.99]"
                      }`}>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple className="hidden"
                          onChange={handleFileChange} disabled={uploading || uploadedFiles.length >= 5} />
                        {uploading ? (
                          <>
                            <span className="w-5 h-5 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin" />
                            <span className="text-xs text-sky-600 font-medium">Envoi en cours…</span>
                          </>
                        ) : uploadedFiles.length >= 5 ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-sky-400" />
                            <span className="text-xs text-sky-600 font-medium">5 fichiers ajoutés — maximum atteint</span>
                          </>
                        ) : (
                          <>
                            <ImagePlus className="w-6 h-6 text-sky-400" />
                            <span className="text-sm text-sky-700 font-semibold">Appuyer pour ajouter des photos</span>
                            <span className="text-xs text-sky-400">JPG, PNG, HEIC ou PDF · jusqu&apos;à 5 fichiers</span>
                          </>
                        )}
                      </label>
                      {uploadedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {uploadedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 shadow-sm">
                              {f.isPdf ? <span className="text-red-500 font-bold text-[10px]">PDF</span> : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={f.url} alt="" className="w-6 h-6 rounded object-cover" />
                              )}
                              <span className="max-w-[100px] truncate">{f.name}</span>
                              <button type="button" onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                                className="text-slate-400 hover:text-red-400 ml-0.5 touch-manipulation">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {uploadedFiles.length === 0 && (
                        <p className="text-center text-xs text-sky-500 mt-2">
                          Aucune photo pour l&apos;instant — votre devis sera affiné lors du rendez-vous
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Récap */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.badge}`} />
                    <p className="text-xs text-slate-500">
                      {rec.system} · {kwLabel(rec.kwRaw)} · {fmt(rec.priceMin)}–{fmt(rec.priceMax)} TTC
                    </p>
                  </div>

                  {error && <p className="text-red-500 text-xs">{error}</p>}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 transition-all touch-manipulation text-sm">
                    {loading
                      ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Envoi…</>
                      : <><ArrowRight className="w-4 h-4" />Recevoir mon devis gratuit</>}
                  </button>
                  <p className="text-center text-xs text-slate-400">Sans engagement · 100% gratuit</p>
                </form>
              </div>

              {/* Retour */}
              <button onClick={() => navigate(4)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mt-2 touch-manipulation">
                <ArrowLeft className="w-3.5 h-3.5" /> Modifier mes préférences
              </button>
            </>
          )}

          {/* ── Confirmation ────────────────────────────────────────────────── */}
          {step === 5 && submitted && (
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-slate-900 font-bold text-xl mb-2">Demande envoyée !</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                Merci {nom}. Un technicien ClimExpert vous rappelle sous <strong className="text-slate-900">24h</strong> avec un devis détaillé.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="https://wa.me/33667432767" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all">
                  <Phone className="w-4 h-4" /> Appeler maintenant
                </a>
                <a href="https://climexpert.fr"
                  className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all">
                  Voir le site <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Trust signals (résultat) */}
        {step === 5 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { icon: Star,         text: "4,9/5 · 200 avis", sub: "Google" },
              { icon: ShieldCheck,  text: "Techniciens RGE",  sub: "Certifiés" },
              { icon: Zap,          text: "Intervention 48h", sub: "Île-de-France" },
              { icon: CheckCircle2, text: "Devis gratuit",    sub: "Sans engagement" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <Icon className="w-4 h-4 text-sky-500 mx-auto mb-1.5" />
                <p className="text-slate-900 text-xs font-semibold leading-tight">{text}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {step === 5 && (
          <div className="pt-6">
            <h2 className="text-slate-900 font-semibold text-sm mb-3">Questions fréquentes</h2>
            <div className="space-y-2">
              {[
                { q: "Comment calculer la puissance d'une climatisation ?", a: "La puissance dépend de la surface, de la hauteur sous plafond, de l'isolation et de l'exposition solaire. Règle : 35 W/m² (bien isolé), 45 W/m² (moyen), 60 W/m² (mal isolé). Notre calculateur applique ces normes thermiques françaises automatiquement." },
                { q: "Quel est le prix d'une climatisation en Île-de-France ?", a: "À partir de 1 500 € TTC pour un monosplit (1 pièce), 2 800–5 500 € pour un multisplit (2-3 pièces), 4 000–10 000 € pour un gainable. Tous les prix incluent le matériel, la pose et la mise en service." },
                { q: "Monosplit ou multisplit : quelle solution choisir ?", a: "Le monosplit est idéal pour une seule pièce (à partir de 1 500 €). Le multisplit connecte 2 à 6 pièces sur une seule unité extérieure — il revient moins cher par pièce à partir de 2 unités." },
                { q: "La climatisation réversible peut-elle chauffer en hiver ?", a: "Oui, tous nos systèmes sont réversibles. En mode chauffage, ils sont 3 à 5 fois plus efficaces qu'un radiateur électrique. Ils fonctionnent jusqu'à -15°C pour les modèles récents." },
                { q: "Y a-t-il des aides financières disponibles ?", a: "Les PAC air-eau sont éligibles à MaPrimeRénov' (jusqu'à 4 000 €) et aux CEE (300–800 €). Pour les splits, des CEE sont disponibles (150–300 €). Nos techniciens RGE gèrent les dossiers." },
              ].map(({ q, a }) => (
                <details key={q} className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none">
                    <span className="text-slate-900 text-sm font-medium pr-3">{q}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 pb-4 border-t border-slate-200 mt-6">
          <p className="text-slate-400 text-xs">
            © 2026 <a href="https://climexpert.fr" className="hover:text-slate-600">ClimExpert</a>
            {" · "}
            <a href="https://climexpert.fr/mentions-legales" className="hover:text-slate-600">Mentions légales</a>
          </p>
        </div>

      </main>
    </div>
  );
}

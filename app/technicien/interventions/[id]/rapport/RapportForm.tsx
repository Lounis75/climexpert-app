"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function RapportForm({
  interventionId,
  isVisiteTechnique,
}: {
  interventionId: string;
  isVisiteTechnique: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [conforme, setConforme]           = useState(true);
  const [notes, setNotes]                 = useState("");
  const [dureeH, setDureeH]               = useState(""); // heures
  const [dureeM, setDureeM]               = useState(""); // minutes
  const [photos, setPhotos]               = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [uploading, setUploading]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");
  // Visite technique
  const [dimensions, setDimensions]       = useState("");
  const [typeMur, setTypeMur]             = useState("");
  const [distanceGroupes, setDistanceGroupes] = useState("");
  const [contraintesElec, setContraintesElec] = useState("");
  const [equipReco, setEquipReco]         = useState("");
  const [difficulte, setDifficulte]       = useState("standard");

  async function addPhotos(files: FileList) {
    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    for (const f of newPhotos) {
      const preview = URL.createObjectURL(f);
      setPhotos((prev) => [...prev, { file: f, preview }]);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const p of photos) {
      if (p.url) { urls.push(p.url); continue; }
      const form = new FormData();
      form.append("file", p.file);
      const res = await fetch("/api/technicien/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      setUploading(true);
      const photosUrls = await uploadPhotos();
      setUploading(false);

      const dureeMin = (parseInt(dureeH || "0") * 60) + parseInt(dureeM || "0");

      const body: Record<string, unknown> = {
        interventionId,
        installationConforme: conforme,
        notes,
        photosUrls,
        dureeReelleMinutes: dureeMin || null,
        ...(isVisiteTechnique && {
          dimensionsPiece: dimensions,
          typeMur,
          distanceGroupes,
          contraintesElec,
          equipementRecommande: equipReco,
          difficulte,
        }),
      };

      const res = await fetch("/api/technicien/rapports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      router.replace(`/technicien/interventions/${interventionId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/technicien/interventions/${interventionId}`} className="p-2 bg-white border border-slate-200 rounded-xl">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="font-bold text-slate-900">Rapport de clôture</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Conformité */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">Installation conforme ?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConforme(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                conforme ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> Oui, conforme
            </button>
            <button
              type="button"
              onClick={() => setConforme(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                !conforme ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> Non conforme
            </button>
          </div>
          {!conforme && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg">
              ⚠️ L'email de clôture NE sera PAS envoyé automatiquement. L'admin sera notifié.
            </p>
          )}
        </div>

        {/* Durée réelle */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">Durée réelle</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Heures</label>
              <input
                type="number" min="0" max="12" value={dureeH}
                onChange={(e) => setDureeH(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Minutes</label>
              <input
                type="number" min="0" max="59" value={dureeM}
                onChange={(e) => setDureeM(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <label className="text-sm font-semibold text-slate-900 block mb-3">Observations</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Décrivez les travaux effectués, remarques importantes…"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Champs visite technique */}
        {isVisiteTechnique && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-900">Informations visite technique</p>
            {[
              { label: "Dimensions de la pièce", value: dimensions, set: setDimensions, placeholder: "ex: 4m x 5m" },
              { label: "Type de mur", value: typeMur, set: setTypeMur, placeholder: "béton / placo / brique" },
              { label: "Distance groupe/unité intérieure", value: distanceGroupes, set: setDistanceGroupes, placeholder: "ex: 8m" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs text-slate-500 block mb-1">{label}</label>
                <input
                  type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Contraintes électriques</label>
              <textarea value={contraintesElec} onChange={(e) => setContraintesElec(e.target.value)}
                rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Équipement recommandé</label>
              <input type="text" value={equipReco} onChange={(e) => setEquipReco(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Difficulté estimée</label>
              <select value={difficulte} onChange={(e) => setDifficulte(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
                <option value="standard">Standard</option>
                <option value="complexe">Complexe</option>
                <option value="tres_complexe">Très complexe</option>
              </select>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">Photos ({photos.length}/5)</p>
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-sky-500 font-medium"
              >
                <Upload className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addPhotos(e.target.files)}
          />
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-slate-400 text-sm text-center"
            >
              Appuyer pour ajouter des photos
            </button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors text-base"
        >
          {uploading ? "Upload des photos…" : submitting ? "Envoi…" : "Soumettre le rapport"}
        </button>
      </form>
    </div>
  );
}

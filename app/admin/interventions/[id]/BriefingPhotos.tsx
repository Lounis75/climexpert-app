"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

/** Galerie de photos de briefing : l'admin ajoute des photos pour aider le technicien. */
export default function BriefingPhotos({ id, initial }: { id: string; initial: string[] }) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/admin/interventions/${id}/photos`, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data.error ?? "Échec de l'envoi"); break; }
        setPhotos(data.photos);
      }
    } catch {
      setError("Échec de l'envoi");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(url: string) {
    const res = await fetch(`/api/admin/interventions/${id}/photos?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPhotos(data.photos);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
      className={`rounded-2xl transition-colors ${dragging ? "ring-2 ring-sky-500/60 bg-sky-500/5" : ""}`}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((url) => (
          <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Photo de briefing" className="w-full h-full object-cover" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label="Agrandir" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Supprimer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border border-dashed border-white/15 bg-slate-900/40 text-slate-400 hover:text-white hover:border-white/30 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          <span className="text-[10px] text-center px-1">{uploading ? "Envoi…" : dragging ? "Déposez ici" : "Ajouter / glisser"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        className="hidden"
      />
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <p className="text-slate-500 text-[11px] mt-2">Glissez-déposez vos photos ici ou cliquez sur « Ajouter ». Visibles par le technicien sur sa fiche.</p>
    </div>
  );
}

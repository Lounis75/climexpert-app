"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, Upload, User, X, Save, Loader2 } from "lucide-react";
import type { Author } from "@/lib/authors";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all";

interface FormState {
  name: string;
  role: string;
  bio: string;
  photo: string;
}

const emptyForm: FormState = { name: "", role: "", bio: "", photo: "" };

function Avatar({ author, size = "md" }: { author: Pick<Author, "name" | "photo">; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-10 h-10 text-sm" : size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12 text-base";
  const initials = author.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (author.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={author.photo} alt={author.name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0 font-bold text-sky-400`}>
      {initials}
    </div>
  );
}

export default function AuthorsManager({ initialAuthors }: { initialAuthors: Author[] }) {
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = useCallback(async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur upload");
      setForm((f) => ({ ...f, photo: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }, []);

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) {
      setError("Nom et rôle sont requis.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setAuthors((prev) => [...prev, data]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/authors?id=${id}`, { method: "DELETE" });
      setAuthors((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Liste des auteurs */}
      {authors.length > 0 && (
        <div className="space-y-3">
          {authors.map((author) => (
            <div
              key={author.id}
              className="flex items-center gap-4 bg-slate-800/40 border border-white/8 rounded-2xl p-4"
            >
              <Avatar author={author} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{author.name}</p>
                <p className="text-sky-400 text-xs mt-0.5">{author.role}</p>
                {author.bio && (
                  <p className="text-slate-400 text-xs mt-1 line-clamp-1">{author.bio}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(author.id)}
                disabled={deletingId === author.id}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {deletingId === author.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {authors.length === 0 && !showForm && (
        <div className="text-center py-12 bg-slate-800/20 border border-white/6 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-white font-medium mb-1">Aucun profil auteur</p>
          <p className="text-slate-400 text-sm">Créez un profil pour chaque technicien qui rédige des articles.</p>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm">Nouveau profil</h2>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">{error}</p>
          )}

          {/* Photo */}
          <div>
            <p className="text-slate-300 text-xs font-medium mb-2">Photo (optionnel)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }}
            />
            <div className="flex items-center gap-3">
              {form.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo} alt="preview" className="w-12 h-12 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 bg-white/8 hover:bg-white/12 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-40"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "Upload…" : "Choisir une photo"}
              </button>
              {form.photo && (
                <button onClick={() => setForm((f) => ({ ...f, photo: "" }))} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Nom complet *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Thomas Durand"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Rôle / titre *</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Technicien RGE — 8 ans d'expérience"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5">Bio courte (optionnel)</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={2}
              placeholder="Spécialisé dans les installations multisplit et gainables en Île-de-France depuis 2016."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Enregistrement…" : "Créer le profil"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm); setError(""); }}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 font-semibold rounded-xl text-sm transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Ajouter un technicien
        </button>
      )}
    </div>
  );
}

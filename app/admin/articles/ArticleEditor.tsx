"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, Save, ArrowLeft, Eye, Upload, X, User, UserCircle } from "lucide-react";
import Link from "next/link";
import type { Article } from "@/lib/articles";
import { sectionsToMarkdown } from "@/lib/articles";
import type { Author } from "@/lib/authors";

const CATEGORIES = [
  "Prix & Budget",
  "Installation",
  "Aides & Financement",
  "Guide technique",
  "Entretien",
  "Guide d'achat",
  "Dépannage",
  "Actualités",
];

interface FaqDraft {
  question: string;
  answer: string;
}

interface Draft {
  title: string;
  slug: string;
  category: string;
  heroImage: string;
  heroAlt: string;
  intro: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  body: string;
  faq: FaqDraft[];
  relatedSlugs: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function estimateReadTime(draft: Draft): number {
  const text = [
    draft.intro,
    draft.body,
    ...draft.faq.flatMap((f) => [f.question, f.answer]),
  ]
    .join(" ")
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function articleToDraft(article: Article): Draft {
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    heroImage: article.heroImage,
    heroAlt: article.heroAlt,
    intro: article.intro,
    author: article.author ?? "",
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    keywords: article.keywords,
    // Nouveau format : un seul corps Markdown. Pour les anciens articles
    // (sans body mais avec sections), on convertit les sections en Markdown.
    body: article.body || sectionsToMarkdown(article.sections),
    faq: article.faq.length > 0 ? article.faq : [{ question: "", answer: "" }],
    relatedSlugs: article.relatedSlugs.join(", "),
  };
}

const emptyDraft: Draft = {
  title: "",
  slug: "",
  category: "Guide technique",
  heroImage: "",
  heroAlt: "",
  intro: "",
  author: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  body: "",
  faq: [{ question: "", answer: "" }],
  relatedSlugs: "",
};

interface Props {
  initialArticle?: Article;
  isEditing?: boolean;
}

export default function ArticleEditor({ initialArticle, isEditing }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(
    initialArticle ? articleToDraft(initialArticle) : emptyDraft
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEditing ?? false);
  const [error, setError] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/authors")
      .then((r) => r.ok ? r.json() : [])
      .then(setAuthors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slugTouched && draft.title) {
      setDraft((d) => ({ ...d, slug: slugify(d.title) }));
    }
  }, [draft.title, slugTouched]);

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setFaq(i: number, key: keyof FaqDraft, value: string) {
    setDraft((d) => {
      const faq = [...d.faq];
      faq[i] = { ...faq[i], [key]: value };
      return { ...d, faq };
    });
  }

  function addFaq() {
    setDraft((d) => ({ ...d, faq: [...d.faq, { question: "", answer: "" }] }));
  }

  function removeFaq(i: number) {
    setDraft((d) => ({ ...d, faq: d.faq.filter((_, idx) => idx !== i) }));
  }

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur upload");
      setField("heroImage", data.url);
      if (!draft.heroAlt) setField("heroAlt", file.name.replace(/\.[^.]+$/, "").replace(/-/g, " "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }, [draft.heroAlt]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleSave() {
    if (!draft.title.trim() || !draft.slug.trim()) {
      setError("Le titre et le slug sont requis.");
      return;
    }
    if (!draft.intro.trim()) {
      setError("L'introduction est requise.");
      return;
    }
    setError("");
    setSaving(true);

    const article: Article = {
      slug: draft.slug,
      title: draft.title,
      metaTitle: draft.metaTitle || draft.title,
      metaDescription: draft.metaDescription,
      keywords: draft.keywords,
      date: new Date().toISOString().split("T")[0],
      readTime: estimateReadTime(draft),
      category: draft.category,
      heroImage: draft.heroImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=85",
      heroAlt: draft.heroAlt || draft.title,
      intro: draft.intro,
      author: draft.author.trim() || undefined,
      body: draft.body.trim() || undefined,
      sections: [], // nouveau format : tout le contenu est dans `body` (Markdown)
      faq: draft.faq.filter((f) => f.question.trim() && f.answer.trim()),
      relatedSlugs: draft.relatedSlugs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      if (res.ok) {
        router.push("/admin/articles");
        router.refresh();
      } else {
        setError("Erreur lors de la sauvegarde.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Actions top */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/articles"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux articles
        </Link>
        <div className="flex items-center gap-3">
          {isEditing && draft.slug && (
            <Link
              href={`/guide-climatisation/${draft.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <Eye className="w-4 h-4" />
              Voir l&apos;article
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement…" : isEditing ? "Mettre à jour" : "Publier l'article"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Infos de base */}
      <Card title="Informations de base">
        <Field label="Titre de l'article *">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Ex : Prix d'une climatisation à Paris en 2026"
            className={inputClass}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Slug (URL) *">
            <input
              type="text"
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setField("slug", slugify(e.target.value));
              }}
              placeholder="prix-climatisation-paris-2026"
              className={`${inputClass} font-mono text-xs`}
              readOnly={isEditing}
            />
            {!isEditing && (
              <p className="text-slate-500 text-xs mt-1">
                /guide-climatisation/<span className="text-sky-400">{draft.slug || "…"}</span>
              </p>
            )}
          </Field>

          <Field label="Catégorie">
            <select
              value={draft.category}
              onChange={(e) => setField("category", e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-800">
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Introduction (chapeau) *">
          <textarea
            value={draft.intro}
            onChange={(e) => setField("intro", e.target.value)}
            placeholder="Résumé de l'article en 2-3 phrases. Apparaît sous le titre et dans les cartes du guide."
            rows={3}
            className={inputClass}
          />
        </Field>

        <Field label="Auteur" hint="Améliore le référencement E-E-A-T — sélectionnez un profil ou saisissez un nom">
          {authors.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Option "Aucun" */}
                <button
                  type="button"
                  onClick={() => setField("author", "")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    !draft.author
                      ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className="text-xs font-medium">Aucun auteur</span>
                </button>

                {authors.map((author) => (
                  <button
                    key={author.id}
                    type="button"
                    onClick={() => setField("author", author.name)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      draft.author === author.name
                        ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                        : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {author.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={author.photo} alt={author.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-sky-400">
                        {author.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-white">{author.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{author.role.split("—")[0].trim()}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Link href="/admin/authors" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-400 transition-colors">
                <UserCircle className="w-3 h-3" />
                Gérer les profils auteurs
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={draft.author}
                  onChange={(e) => setField("author", e.target.value)}
                  placeholder="Prénom Nom, Technicien RGE ClimExpert"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <Link href="/admin/authors" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-400 transition-colors">
                <UserCircle className="w-3 h-3" />
                Créer des profils auteurs
              </Link>
            </div>
          )}
        </Field>
      </Card>

      {/* Image hero — drag & drop */}
      <Card title="Image principale">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Zone de dépôt */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !draft.heroImage && fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
            dragOver
              ? "border-sky-400 bg-sky-500/10"
              : draft.heroImage
              ? "border-white/10 cursor-default"
              : "border-white/15 hover:border-white/30 cursor-pointer"
          }`}
        >
          {draft.heroImage ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.heroImage}
                alt={draft.heroAlt}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Changer
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setField("heroImage", ""); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              {uploading ? (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-3" />
                  <p className="text-slate-400 text-sm">Upload en cours…</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-sky-400" />
                  </div>
                  <p className="text-white text-sm font-medium mb-1">
                    {dragOver ? "Déposez l'image ici" : "Glissez une image ici"}
                  </p>
                  <p className="text-slate-500 text-xs">ou cliquez pour parcourir</p>
                  <p className="text-slate-600 text-xs mt-2">JPEG, PNG, WebP · max 5 MB</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* URL manuelle en fallback */}
        <Field label="Ou coller une URL d'image">
          <input
            type="text"
            value={draft.heroImage}
            onChange={(e) => setField("heroImage", e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>

        <Field label="Description de l'image (alt SEO)">
          <input
            type="text"
            value={draft.heroAlt}
            onChange={(e) => setField("heroAlt", e.target.value)}
            placeholder="Ex : Technicien installant une climatisation à Paris"
            className={inputClass}
          />
        </Field>
      </Card>

      {/* SEO */}
      <Card title="SEO" collapsible defaultOpen={false}>
        <Field label="Meta titre (affiché dans Google)" hint="Idéalement < 60 caractères">
          <input
            type="text"
            value={draft.metaTitle}
            onChange={(e) => setField("metaTitle", e.target.value)}
            placeholder={draft.title || "Ex : Prix Climatisation Paris 2026 | ClimExpert"}
            className={inputClass}
          />
          <p className="text-xs text-slate-500 mt-1">{draft.metaTitle.length}/60 caractères</p>
        </Field>
        <Field label="Meta description" hint="Idéalement 130-155 caractères">
          <textarea
            value={draft.metaDescription}
            onChange={(e) => setField("metaDescription", e.target.value)}
            placeholder="Description qui apparaît dans les résultats Google…"
            rows={2}
            className={inputClass}
          />
          <p className="text-xs text-slate-500 mt-1">{draft.metaDescription.length}/155 caractères</p>
        </Field>
        <Field label="Mots-clés (séparés par des virgules)">
          <input
            type="text"
            value={draft.keywords}
            onChange={(e) => setField("keywords", e.target.value)}
            placeholder="prix climatisation paris, tarif installation clim, devis climatisation idf"
            className={inputClass}
          />
        </Field>
      </Card>

      {/* Sections */}
      <Card title="Corps de l'article">
        <p className="text-slate-500 text-xs mb-3">
          Collez ou rédigez tout votre article ici, en <span className="text-slate-300 font-medium">Markdown</span>.
          Idéal pour coller un texte généré avec Claude d&apos;un seul bloc.
        </p>
        <div className="bg-slate-900/40 border border-white/8 rounded-lg px-3 py-2 mb-3 text-[11px] text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Aide Markdown :</span>{" "}
          <code className="text-sky-400">## Titre</code> = sous-titre ·{" "}
          <code className="text-sky-400">### Titre</code> = sous-sous-titre ·{" "}
          <code className="text-sky-400">**gras**</code> ·{" "}
          <code className="text-sky-400">- item</code> = liste ·{" "}
          <code className="text-sky-400">&gt; texte</code> = encart ·{" "}
          ligne vide = nouveau paragraphe · tableaux supportés
        </div>
        <textarea
          value={draft.body}
          onChange={(e) => setField("body", e.target.value)}
          placeholder={"## Premier sous-titre\n\nVotre premier paragraphe…\n\nVotre deuxième paragraphe…\n\n## Deuxième sous-titre\n\n- Un point\n- Un autre point\n\n> À retenir : une information clé."}
          rows={24}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
        />
        <p className="text-slate-600 text-xs mt-2">
          {draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0} mots
        </p>
      </Card>

      {/* FAQ */}
      <Card title={`FAQ (${draft.faq.filter((f) => f.question).length} questions)`}>
        <div className="space-y-4">
          {draft.faq.map((item, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/8 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-medium">Question {i + 1}</span>
                <button onClick={() => removeFaq(i)} disabled={draft.faq.length === 1} className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input type="text" value={item.question} onChange={(e) => setFaq(i, "question", e.target.value)} placeholder="Question fréquente…" className={inputClass} />
              <textarea value={item.answer} onChange={(e) => setFaq(i, "answer", e.target.value)} placeholder="Réponse détaillée…" rows={3} className={inputClass} />
            </div>
          ))}
        </div>
        <button onClick={addFaq} className="mt-4 flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Ajouter une question
        </button>
      </Card>

      {/* Articles liés */}
      <Card title="Articles liés">
        <Field label="Slugs des articles liés (séparés par des virgules)" hint="Ex : prix-climatisation-ile-de-france-2025, climatisation-gainable">
          <input
            type="text"
            value={draft.relatedSlugs}
            onChange={(e) => setField("relatedSlugs", e.target.value)}
            placeholder="prix-climatisation-ile-de-france-2025, climatisation-gainable"
            className={inputClass}
          />
        </Field>
      </Card>

      {/* Actions bottom */}
      <div className="flex items-center justify-between pt-4 pb-8">
        <p className="text-slate-500 text-xs">
          Temps de lecture estimé : <span className="text-white">{estimateReadTime(draft)} min</span>
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement…" : isEditing ? "Mettre à jour l'article" : "Publier l'article"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-slate-300 text-sm font-medium">{label}</label>
        {hint && <span className="text-slate-500 text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Card({ title, children, collapsible, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-4 ${collapsible ? "cursor-pointer hover:bg-white/5 transition-colors" : ""}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
      >
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        {collapsible && (
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </div>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

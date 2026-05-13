"use client";

import { useState } from "react";
import { Star, Tag, Clock, Calendar, ExternalLink, Plus, Pencil, Trash2, Lock } from "lucide-react";
import Link from "next/link";

interface ArticleRow {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: number;
  featured: boolean;
  isDynamic: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Prix & Budget": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Installation": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Aides & Financement": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Guide technique": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Entretien": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Guide d'achat": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Dépannage": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Actualités": "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function ArticlesManager({ initialArticles }: { initialArticles: ArticleRow[] }) {
  const [articles, setArticles] = useState<ArticleRow[]>(
    [...initialArticles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const categories = ["Tous", ...Array.from(new Set(articles.map((a) => a.category)))];
  const filtered = activeCategory === "Tous"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const featuredCount = articles.filter((a) => a.featured).length;
  const dynamicCount = articles.filter((a) => a.isDynamic).length;

  async function toggleFeatured(slug: string) {
    setToggling(slug);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        const { featured } = await res.json();
        setArticles((prev) =>
          prev.map((a) => (a.slug === slug ? { ...a, featured } : a))
        );
      }
    } finally {
      setToggling(null);
    }
  }

  async function deleteArticle(slug: string) {
    if (!window.confirm("Supprimer cet article définitivement ?")) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.slug !== slug));
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Articles", value: articles.length },
          { label: "À la une", value: featuredCount },
          { label: "Mes articles", value: dynamicCount },
          { label: "Catégories", value: categories.length - 1 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800/40 border border-white/8 rounded-2xl p-4">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Create button + Category tabs */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-sky-500 border-sky-500 text-white"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Link
          href="/admin/articles/new"
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      {/* Articles list */}
      <div className="space-y-3 mt-6">
        {filtered.map((article) => {
          const catColor = CATEGORY_COLORS[article.category] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
          return (
            <div
              key={article.slug}
              className={`flex items-start sm:items-center gap-4 bg-slate-800/40 border rounded-2xl p-4 transition-all ${
                article.featured ? "border-amber-500/30 bg-amber-500/5" : "border-white/8"
              }`}
            >
              {/* Toggle featured */}
              <button
                onClick={() => toggleFeatured(article.slug)}
                disabled={toggling === article.slug}
                title={article.featured ? "Retirer de la une" : "Mettre à la une"}
                className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  article.featured
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
                    : "border-white/10 text-slate-600 hover:text-slate-400 hover:border-white/20"
                } ${toggling === article.slug ? "opacity-50 cursor-wait" : ""}`}
              >
                <Star className={`w-4 h-4 ${article.featured ? "fill-amber-400" : ""}`} />
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${catColor}`}>
                    <Tag className="w-2.5 h-2.5" />
                    {article.category}
                  </span>
                  {article.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      À la une
                    </span>
                  )}
                  {article.isDynamic && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-semibold">
                      Rédigé par vous
                    </span>
                  )}
                </div>
                <p className="text-white text-sm font-medium leading-snug truncate">{article.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.date)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {article.readTime} min
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {article.isDynamic ? (
                  <>
                    <Link
                      href={`/admin/articles/${article.slug}/edit`}
                      className="w-8 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 flex items-center justify-center transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => deleteArticle(article.slug)}
                      disabled={deleting === article.slug}
                      className="w-8 h-8 rounded-lg border border-white/10 text-slate-600 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors disabled:opacity-40"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span
                    className="w-8 h-8 rounded-lg border border-white/5 text-slate-700 flex items-center justify-center"
                    title="Article système (non modifiable)"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
                <Link
                  href={`/guide-climatisation/${article.slug}`}
                  target="_blank"
                  className="w-8 h-8 rounded-lg border border-white/10 text-slate-600 hover:text-slate-300 hover:border-white/20 flex items-center justify-center transition-colors"
                  title="Voir l'article"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-slate-600 text-xs text-center mt-8">
        Articles ⭐ apparaissent dans le bandeau du guide et sur la page d&apos;accueil. Articles avec un cadenas sont les articles système.
      </p>
    </div>
  );
}

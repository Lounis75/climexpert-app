"use client";

import { useState } from "react";
import { FileText, UserCircle } from "lucide-react";
import ArticlesManager from "./ArticlesManager";
import AuthorsManager from "../authors/AuthorsManager";
import type { Author } from "@/lib/authors";

interface ArticleRow {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: number;
  featured: boolean;
  isDynamic: boolean;
}

export default function ArticlesPageTabs({
  articles,
  authors,
}: {
  articles: ArticleRow[];
  authors: Author[];
}) {
  const [tab, setTab] = useState<"articles" | "auteurs">("articles");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-slate-800/40 border border-white/8 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("articles")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "articles"
              ? "bg-sky-500 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Articles
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === "articles" ? "bg-white/20" : "bg-slate-700"}`}>
            {articles.length}
          </span>
        </button>
        <button
          onClick={() => setTab("auteurs")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "auteurs"
              ? "bg-sky-500 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <UserCircle className="w-3.5 h-3.5" />
          Auteurs
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === "auteurs" ? "bg-white/20" : "bg-slate-700"}`}>
            {authors.length}
          </span>
        </button>
      </div>

      {tab === "articles" && <ArticlesManager initialArticles={articles} />}
      {tab === "auteurs" && <AuthorsManager initialAuthors={authors} />}
    </div>
  );
}

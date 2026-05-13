"use client";

import { MessageCircle } from "lucide-react";

interface PageCTAProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  topic?: string;
}

export default function PageCTA({ title, subtitle, ctaLabel, topic }: PageCTAProps) {
  return (
    <section id="devis" className="py-20 bg-[#0B1120] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          {title}
        </h2>
        <p className="text-slate-400 text-lg mb-10">{subtitle}</p>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-chat", topic ? { detail: { topic } } : undefined))}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
        >
          <MessageCircle className="w-4 h-4" />
          {ctaLabel}
        </button>

        <p className="text-slate-600 text-sm mt-8">
          Devis gratuit · Sans engagement · Réponse immédiate
        </p>
      </div>
    </section>
  );
}

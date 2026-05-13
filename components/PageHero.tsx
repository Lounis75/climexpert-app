"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Phone, ShieldCheck } from "lucide-react";

interface PageHeroProps {
  badge: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  ctaLabel: string;
  photo: string;
  photoAlt: string;
  stats: { value: string; label: string }[];
  topic?: string;
}

export default function PageHero({
  badge,
  title,
  titleAccent,
  subtitle,
  ctaLabel,
  photo,
  photoAlt,
  stats,
  topic,
}: PageHeroProps) {
  return (
    <section className="relative bg-[#0B1120] overflow-hidden pt-28 pb-16">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              {badge}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              {title}
              {titleAccent && (
                <>
                  <br />
                  <span className="text-gradient">{titleAccent}</span>
                </>
              )}
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed">{subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat", topic ? { detail: { topic } } : undefined))}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-sky-500/25"
              >
                {ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat", topic ? { detail: { topic } } : undefined))}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-2xl border border-white/15 transition-all duration-200"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Estimation gratuite
              </button>
            </div>
          </motion.div>

          {/* Right — Photo */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="hidden lg:block relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/40">
              {/* TODO: remplacer par photo chantier réelle */}
              <Image src={photo} alt={photoAlt} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/60 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-[#0B1120] px-6 py-5">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

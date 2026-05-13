"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, MessageCircle } from "lucide-react";

const stats = [
  { value: "80+", label: "Installations réalisées" },
  { value: "10 ans", label: "D'expérience cumulée par technicien" },
  { value: "Certifications", label: "Fluides frigorigènes & RGE" },
  { value: "48h", label: "Délai d'intervention" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

interface HeroProps {
  ratingBadge?: React.ReactNode;
}

export default function Hero({ ratingBadge }: HeroProps) {
  return (
    <section className="relative min-h-screen bg-[#0B1120] flex flex-col justify-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-500/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div className="flex flex-col gap-8">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium"
            >
              <ShieldCheck className="w-4 h-4" />
              Techniciens certifiés · Île-de-France
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight"
            >
              La climatisation
              <br />
              <span className="text-gradient">haut de gamme</span>
              <br />
              en Île-de-France
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-slate-400 text-lg leading-relaxed max-w-lg"
            >
              Installation, entretien et dépannage par des techniciens confirmés.
              Obtenez une estimation précise en 2 minutes grâce à notre
              assistant intelligent.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
              >
                Estimation gratuite
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/33667432767"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-2xl border border-white/15 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                WhatsApp
              </a>
            </motion.div>

            {/* Google rating badge (server-rendered, passed as prop) */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              {ratingBadge}
            </motion.div>
          </div>

          {/* Right — Photo + Chat card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="hidden lg:block relative"
          >
            {/* Photo principale — cliquable pour ouvrir Alex */}
            <div
              className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/40 cursor-pointer group/img"
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
              role="button"
              aria-label="Obtenir une estimation gratuite"
            >
              <Image
                src="/images/hero.jpg"
                alt="Intérieur moderne climatisé"
                fill
                className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                priority
              />
              {/* Overlay dégradé bas */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/70 via-transparent to-transparent" />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-start justify-center pt-8">
                <div className="bg-white/90 backdrop-blur-sm text-slate-900 text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg -translate-y-2 group-hover/img:translate-y-0 transition-transform duration-300">
                  <Zap className="w-4 h-4 text-sky-500" />
                  Estimation gratuite en 2 min
                </div>
              </div>
            </div>

            {/* Chat card flottante */}
            <div className="absolute -bottom-6 -left-8 w-72 bg-[#0B1120]/95 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">Assistant ClimExpert</p>
                  <p className="text-slate-500 text-[10px]">Estimation instantanée</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-[10px]">En ligne</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-slate-700/60 text-slate-200 text-xs px-3 py-2 rounded-xl rounded-tl-sm">
                  Bonjour 👋 Quel est votre projet ?
                </div>
                <div className="bg-sky-500/20 border border-sky-500/25 text-sky-200 text-xs px-3 py-2 rounded-xl rounded-tr-sm ml-4">
                  Installation 2 pièces, Paris 16e
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
                  <p className="text-sky-300 text-[10px] font-semibold">Estimation 🎯</p>
                  <p className="text-white text-sm font-bold">3 000 - 4 500 €</p>
                  <p className="text-slate-500 text-[10px]">Pose incluse · Devis gratuit</p>
                </div>
              </div>
            </div>

            {/* Badge en haut à droite */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
              Estimation en 2 min
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#0B1120] px-6 py-5 flex flex-col gap-1">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-slate-500 text-sm">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { MessageCircle, ArrowRight, CheckCircle2, Zap } from "lucide-react";

const steps = [
  { q: "Quel est votre projet ?", a: "Installation / Entretien / Dépannage" },
  { q: "Type de bien ?", a: "Appartement, maison ou local professionnel" },
  { q: "Combien d'unités ?", a: "1, 2, 3 ou plus" },
];

const advantages = [
  "Estimation précise et personnalisée",
  "Sans engagement",
  "Réponse en moins de 2 minutes",
  "Suivi par un technicien dédié",
];

export default function ChatPlaceholder() {
  return (
    <section
      id="devis"
      className="py-24 bg-[#0B1120] relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Assistant intelligent — Bientôt disponible
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Obtenez votre estimation
              <br />
              <span className="text-gradient">en 2 minutes</span>
            </h2>

            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Notre assistant conversationnel analyse votre situation, vous
              pose les bonnes questions et vous donne une estimation précise
              — sans attendre un rappel.
            </p>

            {/* Advantages */}
            <ul className="space-y-3 mb-10">
              {advantages.map((a) => (
                <li key={a} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  {a}
                </li>
              ))}
            </ul>

            {/* CTA temporaire */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:contact@climexpert.fr"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-sky-500/25"
              >
                <MessageCircle className="w-4 h-4" />
                Nous contacter directement
              </a>
              <a
                href="tel:+33667432767"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-2xl border border-white/15 transition-all duration-200"
              >
                <ArrowRight className="w-4 h-4 text-sky-400" />
                Appeler maintenant
              </a>
            </div>
          </motion.div>

          {/* Right — Chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden glow-sky">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8 bg-white/3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">
                    Assistant ClimExpert
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400 text-xs">
                      Disponible 24h/24
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-5">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-start">
                      <div className="bg-slate-700/50 text-slate-200 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%]">
                        {step.q}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-sky-500/20 border border-sky-500/25 text-sky-200 text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                        {step.a}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Final message */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                  className="flex justify-start"
                >
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl rounded-tl-sm px-4 py-4 max-w-[85%]">
                    <p className="text-sky-300 text-sm font-medium mb-1">
                      Votre estimation 🎯
                    </p>
                    <p className="text-slate-300 text-sm">
                      Pour 2 unités en appartement :{" "}
                      <span className="text-white font-bold">3 000 – 4 500 €</span>
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Pose incluse • Devis définitif gratuit
                    </p>
                  </div>
                </motion.div>

                {/* Input */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-500 text-sm">
                    Votre message…
                  </div>
                  <button className="w-11 h-11 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/25">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

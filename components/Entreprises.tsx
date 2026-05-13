"use client";

import { motion } from "framer-motion";
import { Building2, Hotel, Users, Wrench, ArrowRight, CheckCircle2, Shield, Clock, FileText } from "lucide-react";

const clientTypes = [
  { icon: Building2, label: "Bureaux & Entreprises" },
  { icon: Hotel, label: "Hôtels & Restaurants" },
  { icon: Users, label: "Syndics & Copropriétés" },
  { icon: Wrench, label: "Commerces & Locaux" },
];

const benefits = [
  {
    icon: Shield,
    title: "Contrats de maintenance multi-sites",
    desc: "Un interlocuteur unique, un contrat global. Nous gérons l'ensemble de votre parc de climatisation avec des visites planifiées.",
  },
  {
    icon: Clock,
    title: "Intervention prioritaire 24h/7j",
    desc: "Vos locaux ne peuvent pas attendre. Nos clients professionnels bénéficient d'un accès prioritaire à notre équipe d'intervention.",
  },
  {
    icon: FileText,
    title: "Rapports & conformité réglementaire",
    desc: "Attestations d'entretien, rapports de fluides frigorigènes, carnet de suivi : tout est documenté pour vos obligations légales.",
  },
];

const stats = [
  { value: "+150", label: "Contrats pro actifs" },
  { value: "48h", label: "Délai d'intervention max" },
  { value: "10 ans", label: "D'expérience secteur pro" },
  { value: "100%", label: "Conformité réglementaire" },
];

function openChat() {
  window.dispatchEvent(new CustomEvent("open-chat", { detail: { topic: "Professionnel" } }));
}

export default function Entreprises() {
  return (
    <section id="entreprises" className="py-24 bg-[#080d18] overflow-hidden relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-sky-500/8 blur-[120px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-sm font-medium border border-sky-500/20 mb-5">
            Solutions Entreprises
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Expert climatisation<br className="hidden sm:block" />
                <span className="text-sky-400"> pour les professionnels</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-xl">
                Syndics, hôtels, restaurants, bureaux : nous assurons la gestion complète de votre parc climatisation en Île-de-France.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-auto">
              {clientTypes.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm"
                >
                  <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center"
            >
              <p className="text-3xl font-extrabold text-sky-400 tracking-tight">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{b.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gradient-to-br from-sky-600/20 to-sky-500/10 border border-sky-500/25 rounded-3xl p-8 sm:p-10"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">
                Obtenez un devis pour votre établissement
              </h3>
              <p className="text-slate-400 text-sm mb-5">
                Audit de votre parc, proposition de contrat de maintenance, tarifs dégressifs selon volume : nous nous adaptons à vos besoins.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {[
                  "Diagnostic gratuit sur site",
                  "Devis sous 48h",
                  "Tarifs dégressifs multi-unités",
                  "Contrat sur mesure",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[200px]">
              <button
                onClick={openChat}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/30 text-sm"
              >
                Demander un devis pro
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/contact"
                className="flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-slate-300 hover:text-white hover:border-white/40 rounded-xl transition-all text-sm font-medium"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

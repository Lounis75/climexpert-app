"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, PackagePlus, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

const services = [
  {
    icon: PackagePlus,
    tag: "Installation",
    title: "Pose de climatisation",
    description:
      "Monosplit, multisplit, gainable, PAC air-air et air-eau. Étude thermique gratuite et installation par des techniciens certifiés.",
    features: [
      "Toutes marques (Daikin, Mitsubishi, Samsung…)",
      "Étude de faisabilité offerte",
      "Installation soignée et discrète",
    ],
    priceLabel: "À partir de",
    priceAmount: "1 500 €",
    priceTTC: true,
    priceUnit: "",
    priceNote: "selon configuration",
    cta: "Demander un devis",
    topic: "Installation",
    accent: "sky",
    href: "/installation",
    photo: "/images/services-installation.jpg",
    photoAlt: "Installation de climatisation",
  },
  {
    icon: Wrench,
    tag: "Entretien",
    title: "Contrat de maintenance",
    description:
      "Nettoyage, vérification des fluides frigorigènes, contrôle des performances. Conformité réglementaire garantie.",
    features: [
      "Nettoyage complet des filtres et évaporateurs",
      "Contrôle du niveau de frigorigène",
      "Rapport d'intervention détaillé",
    ],
    priceLabel: "À partir de",
    priceAmount: "180 €",
    priceTTC: true,
    priceUnit: "/ unité",
    priceNote: "par an, tout inclus",
    cta: "Souscrire un contrat",
    topic: "Entretien",
    accent: "emerald",
    href: "/entretien",
    photo: "/images/services-maintenance.jpg",
    photoAlt: "Entretien de climatisation",
  },
  {
    icon: Zap,
    tag: "Dépannage",
    title: "Intervention rapide",
    description:
      "Diagnostic toutes marques, 7j/7. Prise en charge rapide pour remettre votre système en état dans les meilleurs délais.",
    features: [
      "Diagnostic gratuit sur devis",
      "Intervention sous 24 à 48h",
      "Techniciens disponibles 7j/7",
    ],
    priceLabel: "Tarif",
    priceAmount: "Sur devis",
    priceTTC: false,
    priceUnit: "",
    priceNote: "diagnostic offert",
    cta: "Décrire ma panne",
    topic: "Dépannage",
    accent: "amber",
    href: "/depannage",
    photo: "/images/services-depannage.jpg",
    photoAlt: "Dépannage climatisation",
  },
];

const accentMap: Record<string, { bg: string; text: string; border: string; amount: string }> = {
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-600",
    border: "border-sky-500/20",
    amount: "text-sky-600",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    amount: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    amount: "text-amber-600",
  },
};

export default function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
            Nos prestations
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Tout pour votre climatisation
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Une expertise complète pour les particuliers et les professionnels
            en Île-de-France.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            const colors = accentMap[service.accent];
            return (
              <motion.div
                key={service.tag}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group relative flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm card-hover"
              >
                {/* Photo header — cliquable vers la page service */}
                <Link href={service.href} className="block relative h-48 overflow-hidden">
                  {/* TODO: remplacer par photo chantier réelle */}
                  <Image
                    src={service.photo}
                    alt={service.photoAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm bg-white/80 ${colors.text} ${colors.border}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {service.tag}
                    </span>
                  </div>
                </Link>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6">
                  <Link href={service.href}>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-sky-600 transition-colors">
                      {service.title}
                    </h3>
                  </Link>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Price block */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {service.priceLabel}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-extrabold tracking-tight ${colors.amount}`}>
                        {service.priceAmount}
                        {service.priceTTC && (
                          <span className="text-base font-semibold ml-1 opacity-60">TTC</span>
                        )}
                      </span>
                      {service.priceUnit && (
                        <span className="text-slate-500 text-base font-medium">
                          {service.priceUnit}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{service.priceNote}</p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("open-chat", { detail: { topic: service.topic } }))}
                      className={`inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80`}
                    >
                      {service.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <Link
                      href={service.href}
                      className="inline-flex items-center justify-center gap-1 w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors"
                    >
                      En savoir plus
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

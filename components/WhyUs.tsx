"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  Wrench,
  FileText,
  Leaf,
  MapPin,
} from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Techniciens certifiés",
    description:
      "Nos techniciens sont formés et certifiés à la manipulation des fluides frigorigènes (attestation de capacité catégorie I). Nos installations respectent les normes en vigueur et la réglementation F-Gaz.",
    // TODO: une fois certif RGE entreprise confirmée, réintégrer le libellé exact + numéro + lien france-renov.gouv.fr
  },
  {
    icon: Clock,
    title: "Intervention sous 48h",
    description:
      "Dépannage et devis rapides. Nous nous engageons à intervenir dans les 48h pour toute demande urgente en Île-de-France.",
  },
  {
    icon: Wrench,
    title: "Toutes marques",
    description:
      "Daikin, Mitsubishi, Samsung, Toshiba, LG, Fujitsu... Nous intervenons sur l'ensemble des marques et modèles du marché.",
  },
  {
    icon: FileText,
    title: "Devis détaillé et gratuit",
    description:
      "Nous établissons un devis précis et transparent sans frais cachés. Aucun engagement avant votre validation.",
  },
  {
    icon: Leaf,
    title: "Éco-responsables",
    description:
      "Nous récupérons les fluides frigorigènes selon les normes environnementales et vous orientons vers les solutions les plus économes.",
  },
  {
    icon: MapPin,
    title: "Couverture Île-de-France",
    description:
      "Paris et toute la région parisienne : 75, 77, 78, 91, 92, 93, 94, 95. Délais optimisés grâce à nos équipes locales.",
  },
];

export default function WhyUs() {
  return (
    <section id="pourquoi" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: Image + Intro texte côte à côte */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Photo technicien */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative pt-8 pl-8 pb-8 pr-8 sm:pt-6 sm:pl-6 sm:pb-8 sm:pr-8"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl shadow-slate-200">
              <Image
                src="/images/whyus.jpg"
                alt="Technicien ClimExpert en intervention"
                fill
                className="object-cover"
              />
            </div>
            {/* Badge flottant */}
            <div className="absolute bottom-0 right-0 bg-white rounded-2xl px-5 py-4 shadow-lg shadow-slate-200 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm">100% certifiés</p>
                  <p className="text-slate-400 text-xs">fluides frigorigènes cat. I</p>
                </div>
              </div>
            </div>
            {/* Second badge */}
            <div className="absolute top-0 left-0 bg-[#0B1120] rounded-2xl px-5 py-4 shadow-lg">
              <p className="text-sky-400 font-bold text-2xl">10+</p>
              <p className="text-slate-400 text-xs">ans d&apos;expérience cumulée</p>
            </div>
          </motion.div>

          {/* Intro texte */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
              Pourquoi nous choisir
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              L&apos;exigence du haut de gamme,
              <br />
              au service de votre confort
            </h2>
            <p className="text-slate-500 text-lg mb-6 leading-relaxed">
              Nous sélectionnons nos techniciens pour leur expertise et leur
              rigueur. Chaque intervention est documentée, garantie et assurée.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Nous mettons l&apos;exigence d&apos;artisans confirmés au service de chaque
              projet, particuliers comme entreprises en Île-de-France.
            </p>
          </motion.div>
        </div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {b.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 bg-[#0B1120] rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Prêt à passer à l&apos;action ?
            </h3>
            <p className="text-slate-400">
              Obtenez votre estimation personnalisée en moins de 2 minutes.
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
            className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 whitespace-nowrap"
          >
            Obtenir mon estimation
          </button>
        </motion.div>
      </div>
    </section>
  );
}

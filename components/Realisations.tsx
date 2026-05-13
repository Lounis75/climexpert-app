"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const photos = [
  {
    src: "/images/real-1.jpg",
    alt: "Installation climatisation salon moderne appartement Paris 8e",
    label: "Appartement, Paris 8e",
    type: "Monosplit mural design",
  },
  {
    src: "/images/real-2.jpg",
    alt: "Pose cassette plafonnière climatisation local professionnel Paris",
    label: "Local professionnel, Paris",
    type: "Cassette plafonnière encastrée",
  },
  {
    src: "/images/real-3.jpg",
    alt: "Climatisation cassette plafond restaurant Paris 11e",
    label: "Restaurant, Paris 11e",
    type: "Cassette plafonnière",
  },
  {
    src: "/images/real-4.jpg",
    alt: "Climatisation discrète appartement haussmannien Paris 7e",
    label: "Appartement haussmannien, Paris 7e",
    type: "Monosplit mural discret",
  },
  {
    src: "/images/real-5.jpg",
    alt: "Climatisation cassette espace d'accueil entreprise Paris",
    label: "Espace d'accueil, Paris",
    type: "Cassette plafonnière",
  },
  {
    src: "/images/real-6.jpg",
    alt: "Climatisation multi-cassette bureau open space Paris",
    label: "Bureau open space, Paris 9e",
    type: "Multi-cassette plafonnière",
  },
  {
    src: "/images/real-7.jpg",
    alt: "Climatisation appartement parisien design parquet chevron",
    label: "Appartement, Paris 16e",
    type: "Monosplit mural",
  },
  {
    src: "/images/real-8.jpg",
    alt: "Climatisation double cassette plafond restaurant design Paris",
    label: "Restaurant design, Paris",
    type: "Double cassette plafonnière",
  },
  {
    src: "/images/real-9.jpg",
    alt: "Climatisation salon contemporain appartement Paris",
    label: "Appartement contemporain, Paris",
    type: "Monosplit mural",
  },
];

export default function Realisations() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
              Nos réalisations
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Nos chantiers en images
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg">
              Des installations soignées, chez les particuliers comme les
              professionnels, partout en Île-de-France.
            </p>
          </div>
          <a
            href="#devis"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Démarrer mon projet
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Grille uniforme 3×3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative w-full h-56 overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/80 via-[#0B1120]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Infos sur la photo */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="inline-block px-2.5 py-1 bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-medium rounded-lg mb-2">
                    {photo.type}
                  </span>
                  <p className="text-white font-semibold text-sm">{photo.label}</p>
                </div>

                {/* Label statique en bas */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent group-hover:opacity-0 transition-opacity duration-300">
                  <p className="text-white/90 text-xs font-medium">{photo.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { MapPin, Check, MessageCircle } from "lucide-react";
import Image from "next/image";

const departments = [
  { code: "75", name: "Paris" },
  { code: "92", name: "Hauts-de-Seine" },
  { code: "93", name: "Seine-Saint-Denis" },
  { code: "94", name: "Val-de-Marne" },
  { code: "77", name: "Seine-et-Marne" },
  { code: "78", name: "Yvelines" },
  { code: "91", name: "Essonne" },
  { code: "95", name: "Val-d'Oise" },
];

const highlights = [
  "Équipes basées en Île-de-France",
  "Délais optimisés par secteur géographique",
  "Devis possible à distance en 24h",
  "Déplacement offert sur devis accepté",
];

export default function ZoneGeo() {
  function openChatHorsIDF() {
    window.dispatchEvent(new CustomEvent("open-chat", { detail: { topic: "Hors IDF" } }));
  }

  function openChatSecteur() {
    window.dispatchEvent(new CustomEvent("open-chat", { detail: { topic: "Vérification secteur" } }));
  }

  return (
    <section id="zone" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Colonnes de même hauteur totale grâce à items-stretch */}
        <div className="grid lg:grid-cols-2 gap-12 lg:items-stretch">

          {/* Left — Texte + image qui remplit l'espace restant */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            {/* Texte */}
            <div className="mb-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                Zone d&apos;intervention
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Toute l&apos;Île-de-France
                <br />
                couverte
              </h2>
              <p className="text-slate-500 text-lg mb-8">
                Nos équipes sont réparties stratégiquement dans la région pour
                vous garantir les délais d&apos;intervention les plus courts.
              </p>
              <ul className="space-y-3 mb-8">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-sky-600" />
                    </div>
                    {h}
                  </li>
                ))}
              </ul>
              <button
                onClick={openChatSecteur}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B1120] hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                Vérifier mon secteur
              </button>
            </div>

            {/* Image — flex-1 pour remplir exactement l'espace restant */}
            <div className="relative flex-1 min-h-[160px] rounded-2xl overflow-hidden shadow-md border border-slate-100">
              <Image
                src="/images/zone-idf.jpg"
                alt="Vue aérienne de Paris et l'Île-de-France"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white text-sm font-semibold">Paris &amp; Île-de-France</p>
                <p className="text-slate-300 text-xs mt-0.5">8 départements · Délai &lt; 48h</p>
              </div>
            </div>
          </motion.div>

          {/* Right — Grille départements + bannière France en bas */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-3"
          >
            {/* Cartes départements */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              {departments.map((d, i) => (
                <motion.div
                  key={d.code}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-sky-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-slate-900">{d.code}</span>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{d.name}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-400 text-xs">Disponible</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bannière France entière — collée en bas */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="bg-[#0B1120] border border-sky-500/20 rounded-2xl p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">
                  Intervention partout en France
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  En dehors de l&apos;Île-de-France ? Contactez-nous pour étudier votre projet.
                </p>
              </div>
              <button
                onClick={openChatHorsIDF}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Parler à Alex
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

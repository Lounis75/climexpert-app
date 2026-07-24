"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  // Lien interne contextuel (maillage SEO) : rendu en fin de réponse, crawlable.
  link?: { href: string; label: string };
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
}

// IMPORTANT (SEO) : les réponses sont TOUJOURS présentes dans le DOM, seulement masquées
// visuellement (grille grid-rows 0fr/1fr + overflow hidden). L'ancienne version montait la réponse
// au clic (`{open === i && …}`), donc Googlebot et les moteurs IA ne voyaient QUE la 1re réponse :
// tout le contenu FAQ des pages était invisible au référencement. Ne jamais revenir à un démontage
// conditionnel — masquer par CSS, pas par retrait du DOM.
export default function FAQAccordion({ items, title = "Questions fréquentes" }: FAQAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
            FAQ
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
        </motion.div>

        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900 text-sm leading-snug">
                    {item.question}
                  </span>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isOpen ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Réponse TOUJOURS dans le DOM ; repliée par CSS (grid-rows) quand fermée. */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5">
                      <p className="text-slate-500 text-sm leading-relaxed">{item.answer}</p>
                      {item.link && (
                        <a
                          href={item.link.href}
                          className="inline-flex items-center gap-1 mt-3 text-sky-600 hover:text-sky-700 text-sm font-medium"
                        >
                          {item.link.label} →
                        </a>
                      )}
                    </div>
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

"use client";

import { motion } from "framer-motion";

// TODO: remplacer par de vrais fichiers SVG dans /public/brands/ quand disponibles
const brands = [
  "Daikin",
  "Mitsubishi Electric",
  "Fujitsu",
  "Panasonic",
  "LG",
  "Samsung",
  "Toshiba",
];

export default function Brands() {
  return (
    <section className="py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <p className="flex-shrink-0 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Marques compatibles
          </p>
          <div className="w-px h-5 bg-slate-200 hidden sm:block flex-shrink-0" />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap gap-3"
          >
            {brands.map((brand) => (
              <div
                key={brand}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white transition-all duration-200 group"
              >
                <span className="text-slate-500 group-hover:text-slate-700 font-semibold text-sm tracking-tight transition-colors">
                  {brand}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

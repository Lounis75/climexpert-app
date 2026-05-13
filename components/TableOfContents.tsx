"use client";

import { useState, useEffect } from "react";

const sections = [
  { id: "types", label: "Les types de climatisation" },
  { id: "choisir", label: "Comment bien choisir ?" },
  { id: "prix", label: "Combien ça coûte ?" },
  { id: "aides", label: "Les aides financières" },
  { id: "entretien", label: "L'entretien annuel" },
  { id: "installation", label: "Le déroulement de la pose" },
  { id: "faq", label: "Questions fréquentes" },
];

export default function TableOfContents() {
  const [active, setActive] = useState("types");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="hidden xl:block sticky top-28 self-start w-56 flex-shrink-0">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
        Sommaire
      </p>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`block text-sm py-1.5 px-3 rounded-lg transition-all duration-200 border-l-2 ${
                active === s.id
                  ? "text-sky-600 font-semibold border-sky-500 bg-sky-50"
                  : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

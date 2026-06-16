import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, ArrowRight } from "lucide-react";
import { VILLES } from "@/lib/villes";
import { DEPARTEMENTS } from "@/lib/departements";

const BASE = "https://climexpert.fr";

export const metadata: Metadata = {
  title: "Climatisation par ville en Île-de-France | ClimExpert",
  description:
    "Installation, entretien et dépannage de climatisation dans les principales villes d'Île-de-France : Boulogne-Billancourt, Neuilly-sur-Seine, Versailles, et bien d'autres. Techniciens RGE, devis gratuit sous 24h.",
  keywords:
    "climatisation ville ile-de-france, installateur climatisation paris banlieue, clim boulogne neuilly versailles",
  alternates: { canonical: `${BASE}/villes` },
  openGraph: {
    title: "Climatisation par ville en Île-de-France — ClimExpert",
    description: "Nos villes couvertes en Île-de-France.",
    url: `${BASE}/villes`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ClimExpert — Climatisation Île-de-France" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: BASE },
    { "@type": "ListItem", position: 2, name: "Villes", item: `${BASE}/villes` },
  ],
};

const deptName: Record<string, string> = Object.fromEntries(
  DEPARTEMENTS.map((d) => [d.code, `${d.name} (${d.code})`])
);

export default function VillesHubPage() {
  // Regroupe les villes par département
  const byDept = VILLES.reduce<Record<string, typeof VILLES>>((acc, v) => {
    (acc[v.dept] ??= []).push(v);
    return acc;
  }, {});
  const depts = Object.keys(byDept).sort();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main className="bg-[#0B1120] min-h-screen">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-4">
            <MapPin className="w-3.5 h-3.5" />
            Villes couvertes
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Climatisation par <span className="text-sky-400">ville</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mb-12">
            Retrouvez les informations spécifiques à votre commune. Installation, entretien
            et dépannage par des techniciens RGE partout en Île-de-France.
          </p>

          <div className="space-y-10">
            {depts.map((dept) => (
              <div key={dept}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                  {deptName[dept] ?? `Département ${dept}`}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {byDept[dept].map((v) => (
                    <Link
                      key={v.slug}
                      href={`/villes/${v.slug}`}
                      className="group flex items-center justify-between gap-3 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-sky-500/30 rounded-xl px-4 py-3 transition-all duration-150"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-500 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
                        <span className="text-white text-sm font-medium truncate">{v.name}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/departements" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              <MapPin className="w-4 h-4" /> Voir par département
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

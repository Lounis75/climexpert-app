import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, ArrowRight } from "lucide-react";
import { DEPARTEMENTS } from "@/lib/departements";

const BASE = "https://climexpert.fr";

export const metadata: Metadata = {
  title: "Climatisation par département en Île-de-France",
  description:
    "Installation, entretien et dépannage de climatisation dans les 8 départements d'Île-de-France : Paris (75), Hauts-de-Seine (92), Seine-Saint-Denis (93), Val-de-Marne (94), Essonne (91), Yvelines (78), Seine-et-Marne (77), Val-d'Oise (95). Techniciens RGE.",
  keywords:
    "climatisation ile-de-france, climatisation par departement, installateur clim 75 92 93 94 91 78 77 95",
  alternates: { canonical: `${BASE}/departements` },
  openGraph: {
    title: "Climatisation par département en Île-de-France, ClimExpert",
    description: "Nos zones d'intervention dans les 8 départements franciliens.",
    url: `${BASE}/departements`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ClimExpert, Climatisation Île-de-France" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: BASE },
    { "@type": "ListItem", position: 2, name: "Départements", item: `${BASE}/departements` },
  ],
};

export default function DepartementsHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main className="bg-[#0B1120] min-h-screen">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-4">
            <MapPin className="w-3.5 h-3.5" />
            Zones d&apos;intervention
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Climatisation par <span className="text-sky-400">département</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mb-12">
            Nous intervenons dans les 8 départements d&apos;Île-de-France pour l&apos;installation,
            l&apos;entretien et le dépannage de votre climatisation. Sélectionnez votre département.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPARTEMENTS.map((d) => (
              <Link
                key={d.slug}
                href={`/departements/${d.slug}`}
                className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-sky-500/30 rounded-2xl p-5 transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-lg">{d.name}</span>
                  <span className="text-slate-500 text-sm font-mono">{d.code}</span>
                </div>
                <p className="text-slate-500 text-xs mb-3">{d.population} · {d.communes} communes</p>
                <span className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium group-hover:gap-2 transition-all">
                  Voir le département <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/villes" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              <MapPin className="w-4 h-4" /> Voir aussi nos villes couvertes
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

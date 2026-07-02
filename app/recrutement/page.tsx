import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getOffresActives } from "@/lib/emplois";
import RecrutementClient from "./RecrutementClient";
import { HeartHandshake, GraduationCap, MapPin, TrendingUp } from "lucide-react";

export const revalidate = 300; // ISR : page marketing, offres qui changent rarement (CDN, TTFB ~50ms)

export const metadata: Metadata = {
  title: "Nous recrutons, ClimExpert | Emplois climatisation en Île-de-France",
  description: "Rejoignez ClimExpert : technicien frigoriste, installateur, alternance... Une équipe à taille humaine, certifiée RGE, en Île-de-France. Postulez en ligne.",
  alternates: { canonical: "/recrutement" },
  openGraph: {
    title: "Nous recrutons | ClimExpert",
    description: "Technicien frigoriste, installateur, alternance : rejoignez une équipe climatisation à taille humaine en Île-de-France.",
    url: "https://climexpert.fr/recrutement",
  },
};

// Balisage Google for Jobs : fait apparaître les offres dans le bloc « Offres d'emploi »
// des résultats Google (gratuit, très visible).
const EMPLOYMENT_TYPE: Record<string, string> = {
  CDI: "FULL_TIME", CDD: "TEMPORARY", "Intérim": "TEMPORARY",
  Alternance: "INTERN", Stage: "INTERN", Freelance: "CONTRACTOR",
};

const ATOUTS = [
  { icon: HeartHandshake, titre: "Équipe à taille humaine", texte: "Une entreprise familiale et indépendante, où chacun compte et où l'ambiance prime." },
  { icon: GraduationCap, titre: "Montée en compétences", texte: "Techniciens RGE, matériel de qualité, et de vraies perspectives d'évolution." },
  { icon: MapPin, titre: "Toute l'Île-de-France", texte: "Des chantiers variés, particuliers et professionnels, sur les 8 départements." },
  { icon: TrendingUp, titre: "Activité en croissance", texte: "Un secteur porteur et un carnet de commandes qui se remplit, du travail toute l'année." },
];

export default async function RecrutementPage() {
  const offres = await getOffresActives();
  const jobPostingsLd = offres.map((o) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: o.titre,
    description: [o.description, o.profil ? `Profil recherché : ${o.profil}` : ""].filter(Boolean).join("\n\n"),
    datePosted: new Date(o.createdAt).toISOString().slice(0, 10),
    validThrough: new Date(new Date(o.createdAt).getTime() + 60 * 86400000).toISOString().slice(0, 10),
    employmentType: EMPLOYMENT_TYPE[o.contrat] ?? "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: "CLIM EXPERT", sameAs: "https://climexpert.fr" },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", streetAddress: "200 rue de la Croix Nivert", addressLocality: "Paris", postalCode: "75015", addressRegion: "Île-de-France", addressCountry: "FR" },
    },
    directApply: true,
  }));
  return (
    <>
      {jobPostingsLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-[#0B1120] overflow-hidden pt-28 pb-16">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block text-sky-400 text-xs font-semibold uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-5">Recrutement</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Rejoignez <span className="text-sky-400">ClimExpert</span>
            </h1>
            <p className="text-slate-300 text-lg mt-5 max-w-2xl mx-auto">
              On grandit, et on cherche des personnes sérieuses et passionnées pour installer, entretenir et dépanner la climatisation en Île-de-France. Débutant motivé ou pro confirmé, parlons-en.
            </p>
            <a href="#postes" className="inline-block mt-7 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors">Voir les postes ouverts</a>
          </div>
        </section>

        {/* Pourquoi nous rejoindre */}
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">Pourquoi nous rejoindre</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {ATOUTS.map((a) => (
                <div key={a.titre} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3">
                    <a.icon className="w-5 h-5 text-sky-600" />
                  </div>
                  <p className="font-semibold text-slate-900">{a.titre}</p>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{a.texte}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Postes + candidature */}
        <div id="postes">
          <RecrutementClient offres={offres.map((o) => ({ id: o.id, titre: o.titre, resume: o.resume, contrat: o.contrat, lieu: o.lieu, description: o.description, profil: o.profil }))} />
        </div>
      </main>
      <Footer />
    </>
  );
}

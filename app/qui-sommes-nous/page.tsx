import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import PageCTA from "@/components/PageCTA";
import Realisations from "@/components/Realisations";
import StatsCounter, { type Stat } from "@/components/StatsCounter";
import { Award, ShieldCheck, Scale, BadgeCheck, Wrench, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Qui sommes-nous — ClimExpert, entreprise familiale de climatisation en Île-de-France",
  description:
    "ClimExpert : entreprise familiale et indépendante de climatisation en Île-de-France. Techniciens RGE Qualibat, attestation fluides frigorigènes cat. I, médiateur de la consommation. Installation, entretien et dépannage.",
  keywords:
    "qui sommes nous climexpert, entreprise climatisation ile-de-france, installateur climatisation rge paris, climaticien familial paris, entreprise clim independante",
  alternates: { canonical: "https://climexpert.fr/qui-sommes-nous" },
  openGraph: {
    title: "Qui sommes-nous — ClimExpert",
    description: "Entreprise familiale et indépendante de climatisation en Île-de-France. Techniciens RGE certifiés.",
    url: "https://climexpert.fr/qui-sommes-nous",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ClimExpert — Qui sommes-nous" }],
  },
};

// ⚙️ Chiffres animés — à ajuster librement quand tu auras les vrais.
const STATS: Stat[] = [
  { value: 50, suffix: "+", label: "Installations", sub: "réalisées cette année" },
  { value: 10, suffix: "+", label: "Ans d'expérience", sub: "cumulée des fondateurs" },
  { value: 8, label: "Départements", sub: "couverts en Île-de-France" },
  { value: 48, suffix: "h", label: "Délai d'intervention", sub: "garanti en dépannage" },
];

const ENGAGEMENTS = [
  {
    icon: Award, title: "Certifiés RGE Qualibat",
    text: "Nos techniciens sont certifiés RGE Qualibat. Vos travaux sont éligibles aux aides : prime CEE, MaPrimeRénov' et TVA réduite à 5,5 % pour les PAC air-eau.",
  },
  {
    icon: ShieldCheck, title: "Attestation fluides cat. I",
    text: "Manipulation des fluides frigorigènes encadrée par l'attestation de capacité catégorie I. Des installations conformes à la réglementation F-Gaz.",
  },
  {
    icon: Scale, title: "Médiateur de la consommation",
    text: "En cas de litige, les particuliers peuvent saisir gratuitement notre médiateur, la Société de la Médiation Professionnelle (SMP). Une vraie garantie de transparence.",
  },
  {
    icon: BadgeCheck, title: "Assurés en RC professionnelle",
    text: "Nous sommes couverts en responsabilité civile professionnelle : vous êtes protégé à chaque intervention chez vous.",
  },
  {
    icon: Wrench, title: "Toutes les grandes marques",
    text: "Daikin, Mitsubishi Electric, Fujitsu, Panasonic, LG — monosplit, multisplit, gainable et pompe à chaleur air-eau.",
  },
  {
    icon: MapPin, title: "Toute l'Île-de-France",
    text: "Paris et toute la petite et grande couronne (75, 77, 78, 91, 92, 93, 94, 95), avec un délai d'intervention garanti sous 48 h.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  name: "ClimExpert",
  legalName: "Clim Expert SAS",
  url: "https://climexpert.fr",
  telephone: "+33667432767",
  email: "contact@climexpert.fr",
  description: "Entreprise familiale et indépendante de climatisation en Île-de-France : installation, entretien et dépannage par des techniciens RGE certifiés.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "200 rue de la Croix Nivert",
    postalCode: "75015",
    addressLocality: "Paris",
    addressCountry: "FR",
  },
  areaServed: "Île-de-France",
  vatID: "FR77992975862",
};

export default function QuiSommesNousPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main>
        <PageHero
          badge="Qui sommes-nous"
          title="Une entreprise familiale,"
          titleAccent="indépendante et certifiée"
          subtitle="Derrière ClimExpert, deux associés passionnés et des techniciens RGE qui installent, entretiennent et dépannent votre climatisation en Île-de-France — avec un vrai savoir-faire et zéro pression commerciale."
          ctaLabel="Demander un devis gratuit"
          photo="/images/real-2.jpg"
          photoAlt="Réalisation ClimExpert — climatisation en cassette plafonnière dans un local professionnel à Paris"
          stats={[
            { value: "RGE", label: "Qualibat certifié" },
            { value: "Cat. I", label: "Fluides frigorigènes" },
            { value: "8", label: "départements IDF" },
          ]}
        />

        {/* Chiffres animés */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                ClimExpert en chiffres
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Une équipe à taille humaine, des résultats concrets
              </h2>
            </div>
            <StatsCounter stats={STATS} />
            <p className="text-center text-slate-400 text-xs mt-6">
              Chiffres indicatifs mis à jour régulièrement.
            </p>
          </div>
        </section>

        {/* Notre histoire */}
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-5">
              Notre histoire
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
              Une histoire de famille, deux savoir-faire complémentaires
            </h2>
            <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
              <p>
                ClimExpert est née d&apos;une histoire de famille. Entreprise <strong className="text-slate-900">indépendante</strong>,
                elle a été fondée par deux associés aux profils complémentaires.
              </p>
              <p>
                L&apos;un est un <strong className="text-slate-900">passionné de technique</strong> : des années sur le terrain à installer,
                entretenir et dépanner. C&apos;est lui qui veille à la qualité d&apos;exécution et à la conformité de chaque chantier.
              </p>
              <p>
                L&apos;autre est tourné vers la <strong className="text-slate-900">relation client et l&apos;organisation</strong> : il
                structure l&apos;entreprise, l&apos;accompagnement et la transparence — du premier appel au devis, jusqu&apos;au suivi après travaux.
              </p>
              <p>
                Ce duo, c&apos;est notre force : un vrai savoir-faire technique, doublé d&apos;un accompagnement clair et sans pression.
                Pas de sous-traitance en cascade, pas de commerciaux agressifs — juste une <strong className="text-slate-900">entreprise
                familiale</strong> qui répond, conseille et tient ses engagements.
              </p>
            </div>
          </div>
        </section>

        {/* Nos engagements / certifications */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                Nos garanties
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Ce qui vous garantit la tranquillité
              </h2>
              <p className="text-slate-500 text-lg">
                Des certifications, des assurances et des engagements concrets — pour confier votre climatisation en toute confiance.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ENGAGEMENTS.map((e) => (
                <div key={e.title} className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                    <e.icon className="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-2">{e.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Photos de chantiers */}
        <Realisations />

        <PageCTA
          title="Un projet de climatisation ?"
          subtitle="Parlez-en à une équipe qui connaît son métier. Devis gratuit et sans engagement."
          ctaLabel="Demander un devis gratuit"
        />
      </main>
      <Footer />
    </>
  );
}

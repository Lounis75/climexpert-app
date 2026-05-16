import { Suspense } from "react";
import { Wind, Award, Wrench, MapPin } from "lucide-react";
import Image from "next/image";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { GoogleBadge } from "@/components/GoogleBadge";
import Services from "@/components/Services";
import Calculator from "@/components/Calculator";
import Brands from "@/components/Brands";
import Entreprises from "@/components/Entreprises";
import Realisations from "@/components/Realisations";
import WhyUs from "@/components/WhyUs";
import { ReviewsSection } from "@/components/ReviewsSection";
import ZoneGeo from "@/components/ZoneGeo";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero
          ratingBadge={
            <Suspense fallback={null}>
              <GoogleBadge />
            </Suspense>
          }
        />
        <Services />
        <Brands />

        {/* Section calculateur homepage */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
              <div className="lg:w-2/5 flex-shrink-0">
                <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-5">
                  Outil gratuit
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                  Quelle puissance<br />pour votre logement ?
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-6">
                  Surface, hauteur sous plafond, isolation, exposition solaire : notre calculateur dimensionne votre installation en quelques secondes.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Estimation basée sur les normes thermiques françaises",
                    "Recommandation monosplit, multisplit ou gainable",
                    "Fourchette de prix TTC indicative incluse",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                {/* Photo chantier */}
                <div className="rounded-2xl overflow-hidden relative aspect-[16/9] shadow-sm border border-slate-100">
                  <Image
                    src="/images/calculator.jpg"
                    alt="Appartement climatisé Paris — installation ClimExpert"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                    <p className="text-white text-xs font-medium">Installation réalisée · Paris 16e</p>
                  </div>
                </div>
              </div>
              <div className="w-full lg:flex-1">
                <Calculator />
              </div>
            </div>
          </div>
        </section>

        <Entreprises />
        <Realisations />
        <WhyUs />
        <ReviewsSection />
        <ZoneGeo />

        {/* Section SEO */}
        <section className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                Pourquoi ClimExpert ?
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Votre installateur climatisation<br />en Île-de-France
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: Wind,
                  color: "sky",
                  title: "Toutes installations",
                  body: "Monosplit, multisplit, gainable et PAC air-eau. Toutes marques : Daikin, Mitsubishi Electric, Fujitsu, Panasonic, LG.",
                },
                {
                  icon: Award,
                  color: "emerald",
                  title: "Certifiés RGE",
                  body: "Techniciens RGE Qualibat et attestation fluides frigorigènes cat. I. Accès garanti à MaPrimeRénov', CEE et TVA 5,5 %.",
                },
                {
                  icon: Wrench,
                  color: "amber",
                  title: "Entretien & dépannage",
                  body: "Contrats de maintenance annuelle à partir de 180 € TTC/unité (Paris intramuros) et interventions de dépannage sous 48h, 7j/7 en IDF.",
                },
                {
                  icon: MapPin,
                  color: "violet",
                  title: "8 départements IDF",
                  body: "Paris et toute la petite et grande couronne (92, 93, 94, 91, 77, 78, 95). Délai d'intervention garanti < 48h.",
                },
              ].map(({ icon: Icon, color, title, body }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    color === "sky"    ? "bg-sky-50 border border-sky-100"    :
                    color === "emerald"? "bg-emerald-50 border border-emerald-100" :
                    color === "amber"  ? "bg-amber-50 border border-amber-100"  :
                                         "bg-violet-50 border border-violet-100"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      color === "sky"    ? "text-sky-600"    :
                      color === "emerald"? "text-emerald-600" :
                      color === "amber"  ? "text-amber-600"  :
                                           "text-violet-600"
                    }`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

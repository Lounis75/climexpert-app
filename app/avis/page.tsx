import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReviewsSection } from "@/components/ReviewsSection";

// Rafraîchi toutes les heures (les avis Google évoluent lentement).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Avis clients ClimExpert | Climatisation en Île-de-France",
  description: "Les avis Google de nos clients sur nos installations, entretiens et dépannages de climatisation en Île-de-France. Avis authentiques, vérifiés par Google.",
  alternates: { canonical: "/avis" },
  openGraph: {
    title: "Avis clients | ClimExpert",
    description: "Ce que nos clients disent de nos installations et entretiens de climatisation en Île-de-France.",
    url: "https://climexpert.fr/avis",
  },
};

export default function AvisPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-[#0B1120] overflow-hidden pt-28 pb-14">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block text-sky-400 text-xs font-semibold uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-5">Avis clients</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Ce que disent <span className="text-sky-400">nos clients</span>
            </h1>
            <p className="text-slate-300 text-lg mt-5 max-w-2xl mx-auto">
              Des avis authentiques, publiés sur Google par de vrais clients après leur installation, entretien ou dépannage.
            </p>
          </div>
        </section>
        <ReviewsSection />
      </main>
      <Footer />
    </>
  );
}

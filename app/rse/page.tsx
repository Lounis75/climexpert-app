import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Leaf, Users, MapPin, ShieldCheck, Recycle, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique RSE, ClimExpert | Engagements responsables",
  description: "Les engagements responsables de ClimExpert : récupération et recyclage des fluides frigorigènes, équipements performants, emploi local en Île-de-France, transparence et sécurité.",
  alternates: { canonical: "/rse" },
  openGraph: {
    title: "Politique RSE | ClimExpert",
    description: "Fluides récupérés et recyclés, équipements performants, emploi local : les engagements concrets de ClimExpert, sans greenwashing.",
    url: "https://climexpert.fr/rse",
  },
};

const PILIERS = [
  {
    icon: Leaf, titre: "Environnement",
    points: [
      { i: Recycle, t: "Récupération et recyclage des fluides frigorigènes", d: "Nous sommes habilités à la manipulation des fluides (catégorie I). À chaque dépose, les fluides sont récupérés et confiés à une filière de recyclage agréée, jamais relâchés." },
      { i: Zap, t: "Des équipements performants", d: "Nous installons des systèmes réversibles à haut rendement (jusqu'à 5 fois plus efficaces qu'un radiateur électrique), qui réduisent la consommation et l'empreinte de nos clients." },
      { i: Leaf, t: "Juste dimensionnement", d: "Nous dimensionnons au plus juste pour éviter la surconsommation : un matériel surdimensionné gaspille, un sous-dimensionné s'use. Le bon calcul, c'est aussi écologique." },
    ],
  },
  {
    icon: Users, titre: "Social & humain",
    points: [
      { i: Users, t: "Une équipe à taille humaine", d: "Entreprise familiale et indépendante : conditions de travail soignées, écoute, et zéro pression commerciale imposée à nos équipes." },
      { i: ShieldCheck, t: "Sécurité et formation", d: "Techniciens RGE, formés et équipés. La sécurité sur les chantiers (travail en hauteur, électricité, fluides) est une priorité non négociable." },
    ],
  },
  {
    icon: MapPin, titre: "Ancrage local",
    points: [
      { i: MapPin, t: "Emploi et activité en Île-de-France", d: "Nous recrutons et travaillons localement, sur les 8 départements franciliens. Nos déplacements sont optimisés par zone pour limiter les trajets." },
      { i: ShieldCheck, t: "Transparence et éthique", d: "Devis clairs et détaillés, prix justes, aucune surfacturation cachée. Vos données personnelles ne sont jamais revendues (voir notre politique de confidentialité)." },
    ],
  },
];

export default function RSEPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-[#0B1120] overflow-hidden pt-28 pb-16">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-5">Notre démarche</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">Politique <span className="text-emerald-400">RSE</span></h1>
            <p className="text-slate-300 text-lg mt-5 max-w-2xl mx-auto">
              Le confort thermique a un impact. Chez ClimExpert, nous assumons notre responsabilité, sur l&apos;environnement, nos équipes et notre territoire, sans greenwashing : des engagements concrets, au quotidien.
            </p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
            {PILIERS.map((p) => (
              <div key={p.titre}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><p.icon className="w-5 h-5 text-emerald-600" /></div>
                  <h2 className="text-2xl font-bold text-slate-900">{p.titre}</h2>
                </div>
                <div className="space-y-4">
                  {p.points.map((pt) => (
                    <div key={pt.t} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <pt.i className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">{pt.t}</p>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">{pt.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-slate-400 text-xs text-center pt-2">Une question sur nos engagements ? Écrivez-nous à contact@climexpert.fr.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

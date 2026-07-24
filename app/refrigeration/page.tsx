import type { Metadata } from "next";
import Image from "next/image";
import { Snowflake, Wrench, PackagePlus, CheckCircle2, Store, Building2, ShoppingCart, UserCheck } from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import FAQAccordion from "@/components/FAQAccordion";
import PageCTA from "@/components/PageCTA";

export const metadata: Metadata = {
  title: "Réfrigération professionnelle Paris & Île-de-France, Chambres froides",
  description:
    "Installation et entretien de chambres froides et d'équipements frigorifiques pour les professionnels en Île-de-France : restaurants, hôtels, commerces. Un seul interlocuteur, intervention sur devis.",
  keywords:
    "réfrigération professionnelle paris, chambre froide paris, installation chambre froide, entretien froid commercial, frigoriste paris, vitrine réfrigérée, meuble froid",
  alternates: { canonical: "https://climexpert.fr/refrigeration" },
  openGraph: {
    title: "Réfrigération professionnelle, ClimExpert",
    description:
      "Chambres froides et froid commercial pour les professionnels en Île-de-France. Installation et entretien, un seul interlocuteur.",
    url: "https://climexpert.fr/refrigeration",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

// Les DEUX prestations proposées (installation + entretien), un seul interlocuteur.
const prestations = [
  {
    icon: PackagePlus,
    title: "Installation",
    desc: "Étude, dimensionnement et pose de votre production de froid : chambre froide positive ou négative, groupe frigorifique, meuble ou vitrine réfrigérés. Mise en service et raccordements compris.",
    points: ["Chambres froides positives et négatives", "Groupes et centrales frigorifiques", "Vitrines, meubles et labos réfrigérés"],
  },
  {
    icon: Wrench,
    title: "Entretien",
    desc: "Contrat de maintenance et dépannage de vos équipements frigorifiques : contrôle des fluides, des performances et de la chaîne du froid, avec les rapports réglementaires.",
    points: ["Contrôle des fluides frigorigènes", "Vérification de la chaîne du froid", "Rapport et conformité réglementaire"],
  },
];

// Deux EXEMPLES de besoins, sans tarif : tout est chiffré sur mesure.
const exemples = [
  {
    icon: Snowflake,
    tag: "Chambre froide",
    title: "Chambre froide de restaurant",
    desc: "Une chambre froide positive pour la réserve, ou négative pour la surgélation. Dimensionnée selon votre volume, votre local et votre activité.",
    prix: "Sur devis",
    note: "étude et chiffrage sur mesure",
  },
  {
    icon: Store,
    tag: "Équipement frigorifique",
    title: "Vitrine ou meuble réfrigéré",
    desc: "Vitrine réfrigérée, meuble froid, arrière-comptoir ou laboratoire : installation et entretien du petit équipement frigorifique de votre commerce.",
    prix: "Sur devis",
    note: "selon le matériel et le nombre d'unités",
  },
];

const clients = [
  { icon: Store, label: "Restaurants & traiteurs" },
  { icon: Building2, label: "Hôtels" },
  { icon: ShoppingCart, label: "Commerces & centres commerciaux" },
];

const faq = [
  {
    question: "Pour qui est ce service de réfrigération ?",
    answer:
      "Uniquement pour les professionnels : restaurants, traiteurs, hôtels, commerces alimentaires et centres commerciaux. Nous installons et entretenons vos chambres froides et vos équipements frigorifiques.",
  },
  {
    question: "Vous faites l'installation ET l'entretien ?",
    answer:
      "Oui, et avec un seul interlocuteur : la même équipe pose votre production de froid puis en assure la maintenance. Vous n'avez pas à jongler entre plusieurs prestataires.",
  },
  {
    question: "Pourquoi n'y a-t-il pas de prix affiché ?",
    answer:
      "Chaque installation frigorifique est unique (volume, température, local, matériel). Le prix se détermine après une étude sur place : nous établissons un devis clair et détaillé, gratuitement et sans engagement.",
  },
  {
    question: "Intervenez-vous en urgence sur une panne de froid ?",
    answer:
      "Oui. Une panne de froid met en jeu vos marchandises : nous intervenons rapidement pour rétablir la chaîne du froid, puis nous vous proposons la remise en état.",
  },
];

export default function RefrigerationPage() {
  return (
    <>
      <Header />
      <PageHero
        badge="Réfrigération professionnelle"
        title="Chambres froides &"
        titleAccent="froid commercial"
        subtitle="Installation et entretien de vos équipements frigorifiques en Île-de-France. Un seul interlocuteur pour les restaurants, hôtels et commerces. Étude et devis sur mesure."
        ctaLabel="Décrire mon besoin"
        topic="Réfrigération"
        photo="/images/chambre-froide.jpg"
        photoAlt="Technicien frigoriste sur un équipement de réfrigération"
        stats={[
          { value: "Pros", label: "Restaurants, hôtels, commerces" },
          { value: "2 en 1", label: "Installation + entretien" },
          { value: "Sur devis", label: "Étude sur mesure" },
        ]}
      />

      <main>
        {/* Deux prestations, un seul interlocuteur */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-sm font-medium border border-cyan-100 mb-4">
                <UserCheck className="w-4 h-4" /> Un seul interlocuteur
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Installation et entretien</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">La même équipe pose votre production de froid, puis en assure la maintenance.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {prestations.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{p.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-5">{p.desc}</p>
                    <ul className="space-y-2">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-600" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Exemples (sans tarif : sur devis) */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Quelques exemples</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">De la chambre froide au petit équipement, chaque besoin est chiffré sur mesure.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {exemples.map((ex) => {
                const Icon = ex.icon;
                return (
                  <div key={ex.title} className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-cyan-600" />
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-100">{ex.tag}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{ex.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1">{ex.desc}</p>
                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-2xl font-extrabold tracking-tight text-cyan-600">{ex.prix}</span>
                      <p className="text-slate-400 text-xs mt-1">{ex.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <OpenChatButton
                topic="Réfrigération"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-colors"
              >
                Décrire mon besoin de froid
              </OpenChatButton>
              <p className="text-slate-400 text-xs mt-3">Étude et devis gratuits, sans engagement.</p>
            </div>
          </div>
        </section>

        {/* Clients */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Ils nous font confiance pour leur froid</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {clients.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{c.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <FAQAccordion items={faq} />
      </main>

      <PageCTA
        title="Un projet de froid commercial ?"
        subtitle="Décrivez votre besoin en 2 minutes, un technicien vous rappelle pour une étude sur mesure."
        ctaLabel="Décrire mon besoin"
        topic="Réfrigération"
      />
      <Footer />
    </>
  );
}

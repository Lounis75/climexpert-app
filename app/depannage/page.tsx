import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Zap, CheckCircle2, MessageCircle, Phone } from "lucide-react";
import OpenChatButton from "@/components/OpenChatButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import FAQAccordion from "@/components/FAQAccordion";
import PageCTA from "@/components/PageCTA";

export const metadata: Metadata = {
  title: "Dépannage Climatisation Île-de-France | ClimExpert — Intervention 48h",
  description:
    "Dépannage climatisation urgent en Île-de-France. Diagnostic toutes marques, intervention sous 48h. Techniciens certifiés, disponibles 7j/7. Appelez le 06 67 43 27 67.",
  keywords:
    "dépannage climatisation ile-de-france, réparation climatisation paris, urgence clim, panne climatisation, technicien climatisation paris",
  alternates: {
    canonical: "https://climexpert.fr/depannage",
  },
  openGraph: {
    title: "Dépannage Climatisation Urgent — ClimExpert",
    description:
      "Intervention sous 48h, toutes marques, 7j/7 en Île-de-France. Appelez le 06 67 43 27 67.",
    url: "https://climexpert.fr/depannage",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const pannes = [
  {
    title: "La clim ne refroidit plus",
    desc: "Manque de gaz frigorigène, compresseur défaillant ou filtre encrassé. Diagnostic précis pour trouver la cause exacte.",
  },
  {
    title: "Unité qui fuit de l'eau",
    desc: "Bac de condensats bouché ou drain obstrué. Intervention rapide pour éviter les dégâts sur votre plafond ou vos murs.",
  },
  {
    title: "Bruit anormal",
    desc: "Vibration, sifflement ou claquement inhabituel. Peut indiquer une pièce mobile desserrée ou un problème de compresseur.",
  },
  {
    title: "La télécommande ne répond pas",
    desc: "Problème de carte électronique, de récepteur infrarouge ou simple défaillance de piles. Diagnostic inclus.",
  },
  {
    title: "Code erreur affiché",
    desc: "Chaque marque a ses propres codes. Nos techniciens maîtrisent les codes d'erreur de toutes les marques du marché.",
  },
  {
    title: "La clim ne démarre pas",
    desc: "Problème électrique, sécurité haute pression déclenchée ou défaillance de la carte mère. Nous identifions la panne rapidement.",
  },
];

const steps = [
  {
    icon: Phone,
    title: "Appelez-nous",
    desc: "Décrivez votre panne. Nous évaluons l'urgence et planifions l'intervention au plus vite.",
  },
  {
    icon: Clock,
    title: "Intervention sous 48h",
    desc: "Un technicien se déplace chez vous. Pour les urgences critiques, nous nous organisons pour intervenir le jour même.",
  },
  {
    icon: Zap,
    title: "Diagnostic & réparation",
    desc: "Diagnostic complet, devis remis sur place. Réparation effectuée si les pièces sont disponibles.",
  },
  {
    icon: CheckCircle2,
    title: "Tests et validation",
    desc: "Vérification du bon fonctionnement, conseils de prévention et rapport d'intervention remis.",
  },
];

const faqItems = [
  {
    question: "Quel est le délai d'intervention pour un dépannage en urgence ?",
    answer:
      "Notre délai d'intervention standard est de 48h en Île-de-France. Pour les situations critiques (locaux professionnels, établissements de santé, forte chaleur), nous faisons notre possible pour intervenir le jour même ou le lendemain matin. Appelez-nous directement au 06 67 43 27 67 pour évaluer votre situation.",
  },
  {
    question: "Le déplacement est-il facturé ?",
    answer:
      "Le diagnostic est offert si vous acceptez le devis de réparation. Si vous refusez l'intervention après diagnostic, seuls les frais de déplacement vous seront facturés. Ce montant vous est communiqué à l'avance.",
  },
  {
    question: "Intervenez-vous le week-end ?",
    answer:
      "Oui, nous sommes disponibles 7j/7. Les interventions le week-end peuvent faire l'objet d'une majoration selon les créneaux. Contactez-nous pour connaître les disponibilités.",
  },
  {
    question: "Mon appareil peut-il être réparé ou faut-il le remplacer ?",
    answer:
      "Nous privilégions toujours la réparation. Cependant, si le coût de réparation dépasse 50-60% du prix d'un équipement neuf équivalent, ou si l'appareil a plus de 10-12 ans, nous vous conseillons honnêtement sur l'opportunité d'un remplacement.",
  },
  {
    question: "Avez-vous les pièces détachées en stock ?",
    answer:
      "Nos techniciens embarquent un stock de pièces courantes (filtres, joints, sondes, cartes électroniques courantes). Pour les pièces spécifiques, nous les commandons et revenons pour finaliser la réparation dans les plus brefs délais.",
  },
  {
    question: "La réparation est-elle garantie ?",
    answer:
      "Oui. Toutes nos réparations bénéficient d'une garantie main-d'œuvre de 3 mois. Les pièces détachées sont couvertes par la garantie fabricant. En cas de récidive de la même panne dans ce délai, nous intervenons sans surcoût.",
  },
  {
    question: "Intervenez-vous sur toutes les marques ?",
    answer:
      "Oui, sans exception. Daikin, Mitsubishi, Samsung, Toshiba, LG, Fujitsu, Atlantic, Panasonic, Carrier, Gree… Nos techniciens sont formés sur l'ensemble des marques et disposent des outils de diagnostic adaptés à chacune.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Dépannage climatisation Île-de-France — Intervention sous 48h",
  serviceType: "Dépannage et réparation climatisation",
  description: "Dépannage de climatisation toutes marques en Île-de-France. Intervention sous 48h, 7j/7. Diagnostic et devis remis avant toute intervention.",
  provider: { "@type": "LocalBusiness", "@id": "https://climexpert.fr", name: "ClimExpert" },
  areaServed: { "@type": "AdministrativeArea", name: "Île-de-France" },
  offers: {
    "@type": "Offer",
    name: "Diagnostic de panne",
    description: "Diagnostic offert si réparation acceptée. Garantie réparation 3 mois.",
    priceCurrency: "EUR",
  },
  url: "https://climexpert.fr/depannage",
};

export default function DepannagePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Header />
      <main>
        {/* Hero avec numéro très visible */}
        <section className="relative bg-[#0B1120] overflow-hidden pt-28 pb-16">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Intervention rapide — 7j/7 Île-de-France
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                  Dépannage climatisation
                  <br />
                  <span className="text-gradient">sous 48h</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Panne, fuite, bruit anormal, code erreur… Nos techniciens diagnostiquent et réparent toutes les marques rapidement, avec un devis remis avant toute intervention.
                </p>
                <OpenChatButton topic="Dépannage" className="inline-flex items-center gap-3 self-start px-7 py-5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-amber-500/25 text-xl">
                  <MessageCircle className="w-6 h-6" />
                  Décrire ma panne
                </OpenChatButton>
                <p className="text-slate-500 text-sm">Diagnostic gratuit · Devis avant intervention · Réponse immédiate</p>
              </div>
              <div className="hidden lg:block relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/40">
                <Image
                  src="/images/services-depannage.jpg"
                  alt="Dépannage climatisation Île-de-France"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/60 via-transparent to-transparent" />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
              {[
                { value: "48h", label: "Délai max" },
                { value: "7j/7", label: "Disponibilité" },
                { value: "Toutes", label: "Marques" },
                { value: "3 mois", label: "Garantie réparation" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0B1120] px-6 py-5">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pannes courantes */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-sm font-medium border border-amber-100 mb-4">
                Pannes fréquentes
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Vous reconnaissez votre panne ?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Nos techniciens ont résolu des centaines de pannes similaires. Quelle que soit la cause, nous avons la solution.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pannes.map((p) => (
                <div
                  key={p.title}
                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-amber-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Processus */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-sm font-medium border border-amber-100 mb-4">
                Notre processus
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Comment se déroule l'intervention ?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Étape {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <FAQAccordion
          title="Questions sur le dépannage climatisation"
          items={faqItems}
        />

        {/* CTA urgence */}
        <section className="py-20 bg-[#0B1120] relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Urgence climatisation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Votre climatisation est en panne ?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Décrivez votre panne à Alex. Diagnostic offert, devis avant intervention, réparation garantie 3 mois.
            </p>
            <div className="flex justify-center">
              <OpenChatButton topic="Dépannage" className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-amber-500/25 text-lg">
                <MessageCircle className="w-5 h-5" />
                Décrire ma panne à Alex
              </OpenChatButton>
            </div>
            <p className="text-slate-600 text-sm mt-8">Disponible 7j/7 · Intervention sous 48h · Devis gratuit</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { Snowflake, Wrench, PackagePlus, CheckCircle2, Store, Building2, ShoppingCart, UserCheck, ThermometerSnowflake, Warehouse, Refrigerator, UtensilsCrossed } from "lucide-react";
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
  // Sans cet override, la page hérite du Twitter global (message climatisation), qui brouille le
  // signal thématique « froid commercial ».
  twitter: {
    card: "summary_large_image",
    title: "Réfrigération professionnelle, ClimExpert",
    description:
      "Chambres froides et froid commercial pour restaurants, hôtels et commerces en Île-de-France. Installation et entretien, sur devis.",
    images: ["/opengraph-image"],
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

// EXEMPLES de besoins, sans tarif : tout est chiffré sur mesure (sur devis).
const exemples = [
  {
    icon: Snowflake,
    tag: "Chambre froide",
    title: "Chambre froide positive",
    desc: "Réserve fraîche pour un restaurant ou un traiteur (environ +2 à +8 °C). Dimensionnée selon votre volume de stockage et votre local.",
    prix: "Sur devis",
    note: "étude et chiffrage sur mesure",
  },
  {
    icon: ThermometerSnowflake,
    tag: "Chambre froide",
    title: "Chambre froide négative",
    desc: "Surgélation et conservation longue durée (environ -18 à -25 °C). Isolation renforcée et groupe adapté au grand froid.",
    prix: "Sur devis",
    note: "selon le volume et la température visée",
  },
  {
    icon: Warehouse,
    tag: "Chambre froide",
    title: "Chambre froide modulaire",
    desc: "Panneaux démontables qui s'adaptent à un local existant, y compris en sous-sol ou dans un espace contraint. Montée sur mesure.",
    prix: "Sur devis",
    note: "selon la configuration du local",
  },
  {
    icon: Store,
    tag: "Froid commercial",
    title: "Vitrine réfrigérée",
    desc: "Vitrine de présentation pour une boulangerie, une boucherie ou une épicerie : maintien du froid et mise en valeur des produits.",
    prix: "Sur devis",
    note: "selon le modèle et le nombre d'unités",
  },
  {
    icon: Refrigerator,
    tag: "Froid commercial",
    title: "Meuble & arrière-comptoir",
    desc: "Meuble froid, arrière-bar ou table réfrigérée pour un bar, un snack ou un commerce de proximité. Installation et entretien.",
    prix: "Sur devis",
    note: "selon le matériel",
  },
  {
    icon: UtensilsCrossed,
    tag: "Cuisine pro",
    title: "Laboratoire & cuisine",
    desc: "Cellule de refroidissement, plonge froide ou labo de préparation : le froid technique d'une cuisine professionnelle, aux normes.",
    prix: "Sur devis",
    note: "étude sur place recommandée",
  },
];

const clients = [
  { icon: Store, label: "Restaurants & traiteurs" },
  { icon: Building2, label: "Hôtels" },
  { icon: ShoppingCart, label: "Commerces & centres commerciaux" },
];

// FAQ orientée requêtes réelles (chambre froide, F-Gas, HACCP), du point de vue du chercheur.
// Références réglementaires fournies et vérifiées par le gérant. Q1 SANS montant : le prix reste
// sur devis (choix du gérant) ; on répond à l'intention "combien ça coûte" par les facteurs.
const faq = [
  {
    question: "Combien coûte l'installation d'une chambre froide pour un restaurant ?",
    answer:
      "Le prix dépend surtout de trois choses : le volume (en m³), la température visée (une chambre froide négative revient plus cher qu'une positive à volume égal, à cause de l'isolation renforcée, du groupe plus puissant et du sol anti-gel) et l'accès au local. Chaque installation étant sur mesure, nous établissons un devis gratuit et détaillé après une courte étude sur place, sans engagement.",
  },
  {
    question: "Quelle est la différence entre une chambre froide positive et négative ?",
    answer:
      "Une chambre froide positive maintient une température comprise entre 0 et +8 °C : elle sert au stockage des produits frais (viandes, laitages, légumes). Une chambre froide négative descend de -18 à -25 °C pour les surgelés et la conservation longue durée. La négative demande une isolation plus épaisse, un groupe plus puissant, un sol protégé du gel, et consomme nettement plus.",
  },
  {
    question: "Quelle température doit tenir une chambre froide en restauration ?",
    answer:
      "Les seuils sont fixés par l'arrêté du 21 décembre 2009 et le règlement CE 852/2004, par catégorie de produit : +2 °C maximum pour les viandes hachées et les abats, 0 à +2 °C pour les poissons et fruits de mer crus, +4 °C maximum pour les viandes découpées, les produits laitiers et la charcuterie tranchée, 0 à +3 °C pour les préparations culinaires réfrigérées, et -18 °C pour les surgelés. Ce sont des limites critiques au sens du plan HACCP, pas des indications.",
  },
  {
    question: "Faut-il un enregistreur de température sur une chambre froide ?",
    answer:
      "L'enregistreur automatique est obligatoire uniquement sur les enceintes négatives de plus de 10 m³ destinées aux surgelés (règlement CE 37/2005). Sur les chambres froides positives, aucun texte n'impose l'enregistreur, mais l'auto-surveillance documentée reste obligatoire : relevé et traçabilité des températures dans votre plan de maîtrise sanitaire. En pratique, les inspecteurs DDPP attendent au minimum deux relevés par jour et par enceinte.",
  },
  {
    question: "L'entretien d'une chambre froide est-il obligatoire ?",
    answer:
      "Oui pour la partie frigorifique. Le règlement européen F-Gas (UE) 2024/573 impose un contrôle d'étanchéité périodique, réalisé par un opérateur titulaire de l'attestation de capacité, sur tout équipement contenant 5 tonnes équivalent CO2 de fluide ou plus : tous les 12 mois de 5 à 50 t, tous les 6 mois de 50 à 500 t, tous les 3 mois au-delà, avec système de détection de fuites permanent. Chaque intervention doit être consignée dans le registre de l'équipement.",
    link: { href: "/entretien", label: "Voir notre offre d'entretien" },
  },
  {
    question: "Comment savoir si mon installation est concernée par le contrôle d'étanchéité ?",
    answer:
      "Le seuil se calcule en tonnes équivalent CO2, pas en kilos : charge en kg × PRP du fluide ÷ 1 000. Un équipement au R-404A (PRP 3 922) dépasse les 5 tonnes dès 1,3 kg de charge, donc quasiment toutes les chambres froides sont concernées. Au R-134a (PRP 1 430), le seuil tombe à 3,5 kg. En cas de doute sur votre charge, elle figure sur la plaque signalétique du groupe.",
  },
  {
    question: "Le R-404A est-il encore autorisé en 2026 ?",
    answer:
      "L'installation existante peut continuer de fonctionner, mais depuis le 1er janvier 2025 il est interdit de la recharger avec du fluide vierge dont le PRP est supérieur ou égal à 2 500, ce qui vise directement le R-404A (PRP 3 922). Seuls les fluides recyclés ou régénérés restent tolérés jusqu'en 2030. Concrètement, après une fuite importante, la question du retrofit ou du remplacement du groupe se pose immédiatement.",
  },
  {
    question: "Ma chambre froide ne tient plus la température, que faire ?",
    answer:
      "Avant d'appeler, trois vérifications prennent deux minutes : le joint de porte (un joint écrasé ou un rideau à lanières manquant suffit à faire monter une chambre de plusieurs degrés), l'évaporateur (une prise en glace bloque l'échange) et le condenseur du groupe (encrassé, il ne dissipe plus). Si la température continue de monter, transférez les denrées sensibles et faites intervenir un frigoriste : au-delà de quelques heures hors seuil, la marchandise devient non conforme.",
    link: { href: "/depannage", label: "Voir le dépannage" },
  },
  {
    question: "Intervenez-vous en urgence sur une panne de froid ?",
    answer:
      "Oui, sur les huit départements d'Île-de-France. Une panne de froid en restauration ou en commerce alimentaire est traitée en priorité, parce que la perte de marchandise et la rupture de la chaîne du froid coûtent plus cher que l'intervention. Nos clients sous contrat de maintenance passent en tête de file. Appelez le 06 67 43 27 67 en décrivant l'équipement et la température relevée, cela nous permet d'arriver avec la bonne pièce.",
  },
  {
    question: "Peut-on installer une chambre froide en sous-sol ou dans un local existant ?",
    answer:
      "Oui, c'est même le cas le plus fréquent à Paris. Une chambre froide modulaire se monte en panneaux démontables qui passent par une porte standard, avec un groupe déporté en local technique ou en cour. Les points à traiter en amont : l'évacuation des condensats, la ventilation du local technique, l'alimentation électrique et le bruit du groupe en copropriété. Une visite sur place tranche ces quatre points en une demi-heure.",
    link: { href: "/installation", label: "Voir l'installation" },
  },
];

// Schéma FAQPage (rich result Google + reprise par les moteurs IA). Le texte DOIT correspondre à
// l'affichage visible : on le construit à partir du MÊME tableau `faq`.
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function RefrigerationPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">De la chambre froide au froid commercial, chaque besoin est chiffré sur mesure.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <FAQAccordion items={faq} title="Questions fréquentes sur la réfrigération professionnelle" />
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

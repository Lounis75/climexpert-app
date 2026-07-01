import { CheckCircle2 } from "lucide-react";

type Iv = {
  status: string;
  scheduledAt: Date | string | null;
  techName?: string | null;
  acompteRecuLe: Date | string | null;
  materielCommandeLe: Date | string | null;
  materielRecuLe: Date | string | null;
};

function d(x: Date | string | null): string {
  if (!x) return "";
  return new Date(x).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

// Suivi visuel du chantier (installation) affiché au client dans son espace : les 4 grandes étapes,
// de la signature à la mise en service, avec l'étape courante mise en avant.
export default function TimelineChantier({ iv }: { iv: Iv }) {
  const acompte = !!iv.acompteRecuLe;
  const commande = !!iv.materielCommandeLe;
  const materiel = !!iv.materielRecuLe;
  const planifie = !!iv.scheduledAt;
  const enCours = iv.status === "en_cours";
  const termine = iv.status === "terminée";

  // Étape franchie ?
  const done = [
    true,                          // 1. signature (le client est dans son espace)
    acompte,                       // 2. acompte reçu + commande matériel
    materiel && planifie,          // 3. matériel reçu + planification
    termine,                       // 4. intervention terminée
  ];
  const current = done.findIndex((x) => !x); // -1 si tout est fait

  const steps = [
    {
      titre: "Signature et ouverture de votre espace client",
      texte: "Vous avez validé le devis (30 % à la signature, 70 % à la livraison). Votre espace client est ouvert.",
    },
    {
      titre: "Réception de l'acompte et commande du matériel",
      texte: acompte
        ? `Acompte reçu le ${d(iv.acompteRecuLe)}. Nous avons commandé le matériel dimensionné pour votre projet auprès de nos fournisseurs.`
        : "Dès réception de votre acompte de 30 %, nous commandons le matériel dimensionné pour votre projet. C'est ce qui lance concrètement votre chantier.",
    },
    {
      titre: "Réception du matériel et planification",
      texte: materiel && planifie
        ? `Matériel reçu. Intervention planifiée le ${d(iv.scheduledAt)}${iv.techName ? `, avec ${iv.techName}` : ""}.`
        : materiel
          ? "Matériel reçu. Nous fixons ensemble la date d'intervention."
          : commande
            ? "Votre matériel est commandé, en cours de réception. À son arrivée, nous fixons la date ensemble."
            : "À l'arrivée des équipements, nous fixons la date d'intervention ensemble. Un technicien attitré prend en charge votre chantier.",
    },
    {
      titre: "Intervention et suivi en temps réel",
      texte: termine
        ? "Intervention terminée : pose, raccordements et mise en service réalisés. Votre attestation d'intervention vous a été remise."
        : enCours
          ? "Intervention en cours. Pose, raccordements, tirage au vide et mise en service."
          : planifie
            ? `Intervention planifiée le ${d(iv.scheduledAt)}. Vous suivrez l'avancement ici en temps réel.`
            : "Pose, raccordements, tirage au vide et mise en service. Vous suivrez l'avancement ici en temps réel.",
    },
  ];

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900 mb-5">Suivi de votre installation</h2>
      <ol className="relative">
        {steps.map((s, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          const last = i === steps.length - 1;
          return (
            <li key={i} className="flex gap-4 pb-6 last:pb-0 relative">
              {/* trait vertical */}
              {!last && <span className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${isDone ? "bg-sky-400" : "bg-slate-200"}`} />}
              {/* pastille */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                isDone ? "bg-sky-500 text-white" : isCurrent ? "bg-sky-500 text-white ring-4 ring-sky-100" : "bg-slate-100 text-slate-400"
              }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <div className={`min-w-0 ${!isDone && !isCurrent ? "opacity-60" : ""}`}>
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                  {s.titre}
                  {isCurrent && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">En cours</span>}
                </p>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{s.texte}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

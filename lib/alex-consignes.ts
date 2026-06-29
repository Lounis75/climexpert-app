import { r2GetJSON, r2PutJSON } from "@/lib/r2";

// Consignes pilotables par l'admin, lues par Alex à CHAQUE conversation (web + futur portail de
// qualification). Le délai d'intervention est un NOMBRE DE JOURS (relatif, ne périme jamais) plutôt
// qu'une date absolue. L'admin change un chiffre / quelques phrases, le discours d'Alex s'ajuste partout.

const KEY = "config/alex-consignes.json";

export type AlexConsignes = {
  delaiJours: number;   // délai d'intervention actuel, en jours (ex. 45)
  consignes: string;    // consignes libres en français (priorités, ton, relances...)
  updatedAt?: string;
};

export const DEFAULT_CONSIGNES: AlexConsignes = { delaiJours: 45, consignes: "" };

export async function getAlexConsignes(): Promise<AlexConsignes> {
  const stored = (await r2GetJSON(KEY)) as Partial<AlexConsignes> | null;
  if (!stored) return DEFAULT_CONSIGNES;
  return {
    delaiJours: typeof stored.delaiJours === "number" && stored.delaiJours > 0 ? Math.round(stored.delaiJours) : DEFAULT_CONSIGNES.delaiJours,
    consignes: typeof stored.consignes === "string" ? stored.consignes : "",
    updatedAt: stored.updatedAt,
  };
}

export async function saveAlexConsignes(c: AlexConsignes): Promise<void> {
  await r2PutJSON(KEY, {
    delaiJours: Math.max(1, Math.round(c.delaiJours || DEFAULT_CONSIGNES.delaiJours)),
    consignes: (c.consignes ?? "").slice(0, 4000),
    updatedAt: new Date().toISOString(),
  });
}

// Bloc texte injecté dans le prompt système d'Alex (contexte courant à respecter).
export function consignesPromptBlock(c: AlexConsignes): string {
  const cible = new Date(Date.now() + c.delaiJours * 86400000);
  const dateApprox = cible.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });
  const lignes = [
    `Délai d'intervention actuel : environ ${c.delaiJours} jours (soit autour de ${dateApprox}). Annonce ce délai si le client demande quand on peut intervenir ; reformule en "environ ${c.delaiJours} jours", ne donne jamais de date ferme.`,
  ];
  if (c.consignes.trim()) lignes.push(`Consignes du moment de l'équipe : ${c.consignes.trim()}`);
  return `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCONTEXTE ACTUEL (prioritaire, fixé par l'équipe ClimExpert, à respecter)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${lignes.join("\n")}`;
}

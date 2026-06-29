import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import DevisPDF from "@/components/pdf/DevisPDF";

// Helpers serveur partagés par l'envoi du devis et l'aperçu PDF : même calcul, même rendu,
// pour que le PDF téléchargé soit STRICTEMENT identique à celui reçu par le client.

export type RawLine = { d: string; q: number; pu: number; tva: number };
export type DevisLigne = { id: string; designation: string; quantite: number; prixUnitaireCt: number; tvaRate: string };

// Lignes + totaux (centimes). Un professionnel est TOUJOURS à 20 % (pas de TVA réduite) : on
// l'impose ici, quoi que l'outil ait envoyé. Taux par défaut = taux normal (20 %).
export function computeDevisLignes(rawLines: RawLine[], clientType: string): { lignes: DevisLigne[]; totalHtCt: number; totalTtcCt: number } {
  const lignes: DevisLigne[] = rawLines.map((ln, i) => ({
    id: String(i),
    designation: String(ln.d ?? ""),
    quantite: Number(ln.q) || 0,
    prixUnitaireCt: Math.round((Number(ln.pu) || 0) * 100),
    tvaRate: clientType === "pro" ? "20" : String(ln.tva ?? "20"),
  }));
  let totalHtCt = 0, totalTtcCt = 0;
  for (const l of lignes) {
    const ht = l.quantite * l.prixUnitaireCt;
    totalHtCt += ht;
    totalTtcCt += ht + Math.round(ht * (parseFloat(l.tvaRate) / 100));
  }
  return { lignes, totalHtCt, totalTtcCt };
}

// Adresse client formatée pour le PDF, à partir des champs de l'outil (adr / cp / ville).
export function clientAddressLine(client: { adr?: string; cp?: string; ville?: string } | null | undefined): string {
  if (!client) return "";
  const cpVille = `${client.cp ?? ""} ${client.ville ?? ""}`.trim();
  return [client.adr, cpVille].filter((x) => x && x.trim()).join("\n");
}

export type DevisPdfProps = {
  number: string;
  createdAt: string;
  validUntil?: string | null;
  clientName: string;
  clientAddress?: string | null;
  description?: string | null;
  lignes: DevisLigne[];
  totalHtCt: number;
  totalTtcCt: number;
};

export async function renderDevisPdf(props: DevisPdfProps): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await renderToBuffer(createElement(DevisPDF as any, props as any) as any);
  return Buffer.from(pdf);
}

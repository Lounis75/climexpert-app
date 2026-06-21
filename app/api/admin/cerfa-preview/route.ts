import { NextResponse } from "next/server";
import { generateCerfaPDF, type CerfaData } from "@/lib/cerfa-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Aperçu de la maquette du CERFA (données d'exemple) — pour valider la mise en page
// avant de brancher le formulaire technicien. Protégé par le proxy admin.
export async function GET() {
  const sample: CerfaData = {
    ficheNumero: "FI-2026-0001",
    detenteur: { nom: "Mme Genty", adresse: "107 Boulevard Murat, 75016 Paris", siret: "" },
    equipement: { identification: "DAIKIN Tri-split — Modèle 3MXM68A2V1B9 — N° Série J002481 2022/12", fluide: "32", chargeKg: "9", tonnageCO2: "1.35" },
    nature: { maintenance: true, controleEtanchPeriodique: true, autreText: "Unité extérieure" },
    detecteurManuel: "Détecteur Value", controleLe: "19/06/2026",
    systemePermanent: "non",
    fuitesConstatees: "non",
    observations: "Entretien unité extérieure uniquement. RAS.",
    signataireOperateur: { nom: "AISSAOUI", qualite: "Gérant", date: "19/06/2026" },
  };
  try {
    const pdf = await generateCerfaPDF(sample);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=\"cerfa-apercu.pdf\"", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Échec de génération" }, { status: 500 });
  }
}

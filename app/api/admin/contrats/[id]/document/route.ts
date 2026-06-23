import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateContratPDF, type ContratData } from "@/lib/contrat-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Génère le contrat d'entretien en PDF (pré-rempli depuis le client + le contrat).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ contrat: contratsEntretien, client: clients })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(eq(contratsEntretien.id, id))
    .limit(1);

  if (!row || !row.client) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }
  const { contrat, client } = row;

  const data: ContratData = {
    clientType: (client.typeClient === "professionnel" ? "professionnel" : "particulier"),
    contract: {
      number: contrat.numero ?? undefined,
      date: new Date().toISOString().slice(0, 10), // date de signature = aujourd'hui
      place: "Paris",
      startDate: contrat.startDate,
      visitsPerYear: 1,
    },
    client: {
      title: client.civilite ?? undefined,
      name: client.name,
      address: client.address ?? undefined,
      postalCodeCity: client.city ?? undefined,
      phone: client.phone,
      email: client.email ?? undefined,
      legalForm: client.formeJuridique ?? undefined,
      siret: client.siret ?? undefined,
      representative: client.representant ?? undefined,
      representativeRole: client.representantQualite ?? undefined,
    },
    equipment: {
      brand: contrat.marque ?? client.marqueModele ?? undefined,
      fluid: contrat.fluide ?? undefined,
      indoorCount: contrat.units,
      // Unité extérieure détaillée + résumé des unités intérieures (même marque).
      units: [
        {
          type: "Unité extérieure (groupe)",
          model: contrat.marque ?? undefined,
          powerKw: contrat.puissanceKw ?? undefined,
          serial: contrat.numeroSerie ?? undefined,
          location: "Extérieur",
          fluid: contrat.fluide ?? undefined,
        },
        {
          type: contrat.units > 1 ? `${contrat.units} unités intérieures` : "Unité intérieure",
          model: contrat.marque ?? undefined,
          location: "Intérieur",
          fluid: contrat.fluide ?? undefined,
        },
      ],
    },
    finance: {
      ttc: contrat.prixUnitaireCt / 100,
    },
  };

  try {
    const pdf = await generateContratPDF(data);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="contrat-${contrat.numero ?? id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[contrat document]", e);
    return NextResponse.json({ error: "Échec de génération du PDF" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDevisById, updateDevisStatus, updateDevisEnvoi, updateDevisContent, deleteDevis } from "@/lib/devis";
import { acceptDevis } from "@/lib/devis-workflow";
import type { Devis } from "@/lib/devis";
import { db } from "@/lib/db";
import { factures } from "@/lib/db/schema";
import { and, eq, ne, isNull } from "drizzle-orm";

// Modification du CONTENU d'un devis (lignes + montant + objet + PDF). Le renvoi invalide
// l'ancien lien de signature -> nouvelle signature requise. Interdit sur un devis déjà accepté
// (c'est un engagement signé : on refait un nouveau devis) ou déjà facturé.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const d = await getDevisById(id);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    if (d.status === "accepté") {
      return NextResponse.json({ error: "Ce devis est déjà accepté (signé). Pour un changement, créez un nouveau devis." }, { status: 409 });
    }
    const [facture] = await db.select({ id: factures.id }).from(factures)
      .where(and(eq(factures.devisId, id), ne(factures.status, "annulée"), isNull(factures.supprimeLe))).limit(1);
    if (facture) {
      return NextResponse.json({ error: "Une facture existe déjà pour ce devis, il n'est plus modifiable." }, { status: 409 });
    }

    const { description, validUntil, lignes, fichierUrl } = await req.json();
    if (!lignes?.length) return NextResponse.json({ error: "Au moins une ligne requise" }, { status: 400 });

    const updated = await updateDevisContent(id, { description, validUntil, fichierUrl }, lignes);
    if (!updated) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    return NextResponse.json({ devis: updated });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const d = await getDevisById(id);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    return NextResponse.json({ devis: d });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, montantHtEuros, montantTtcEuros, fichierUrl } = body;

    // Envoi : enregistre montant HT/TTC + fichier joint, et passe le devis "envoyé"
    if (montantHtEuros !== undefined || fichierUrl !== undefined) {
      const patch: Parameters<typeof updateDevisEnvoi>[1] = {};
      if (montantHtEuros !== undefined && montantHtEuros !== null && montantHtEuros !== "")
        patch.totalHtCt = Math.round(Number(montantHtEuros) * 100);
      if (montantTtcEuros !== undefined && montantTtcEuros !== null && montantTtcEuros !== "")
        patch.totalTtcCt = Math.round(Number(montantTtcEuros) * 100);
      if (fichierUrl !== undefined) patch.fichierUrl = fichierUrl || null;
      if (status) patch.status = status as Devis["status"];
      const d = await updateDevisEnvoi(id, patch);
      if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
      return NextResponse.json({ devis: d });
    }

    if (!status) return NextResponse.json({ error: "status requis" }, { status: 400 });
    if (status === "accepté") {
      // Même automatisation que la signature publique : crée l'intervention à planifier
      await acceptDevis(id);
      const d = await getDevisById(id);
      if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
      return NextResponse.json({ devis: d });
    }
    const d = await updateDevisStatus(id, status as Devis["status"]);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    return NextResponse.json({ devis: d });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteDevis(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

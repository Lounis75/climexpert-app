import { NextRequest, NextResponse } from "next/server";
import { getDevisById, updateDevisStatus, updateDevisEnvoi, deleteDevis } from "@/lib/devis";
import { acceptDevis } from "@/lib/devis-workflow";
import type { Devis } from "@/lib/devis";

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

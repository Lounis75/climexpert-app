import { NextRequest, NextResponse } from "next/server";
import { getDevisById, reviserDevis } from "@/lib/devis";
import { db } from "@/lib/db";
import { suivis } from "@/lib/db/schema";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// Crée un devis RÉVISÉ (copie en brouillon) à partir d'un devis accepté : le devis signé ne se
// modifie jamais, le nouveau est ajusté puis renvoyé pour une nouvelle signature.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const old = await getDevisById(id);
    if (!old) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

    const nouveau = await reviserDevis(id);
    if (!nouveau) return NextResponse.json({ error: "Révision impossible" }, { status: 500 });

    // Trace sur la fiche client : on saura d'où vient le nouveau devis.
    if (old.clientId) {
      await db.insert(suivis).values({
        clientId: old.clientId,
        type: "note",
        contenu: `Devis ${nouveau.number} créé en révision du devis ${old.number} (signé) : prix à ajuster suite à la visite, nouvelle signature requise.`,
      }).catch((e) => logError("devis.reviser.note", e, { devisId: id }));
    }

    return NextResponse.json({ devis: nouveau });
  } catch (e) {
    logError("devis.reviser", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

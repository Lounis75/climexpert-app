import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devis } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getDevisByToken } from "@/lib/devis";
import { acceptDevis } from "@/lib/devis-workflow";
import { logError } from "@/lib/observability";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { action } = await req.json();

    if (action !== "accepté" && action !== "refusé") {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const d = await getDevisByToken(token);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

    // Réservation ATOMIQUE de la décision (modèle /api/devis-decision) : seul le premier clic
    // fait passer "envoyé" -> décision. L'ancien check-then-act laissait passer deux clics
    // simultanés (double traitement possible).
    const [claimed] = await db
      .update(devis)
      .set({ status: action, updatedAt: new Date() })
      .where(and(eq(devis.id, d.id), eq(devis.status, "envoyé")))
      .returning({ id: devis.id });

    if (!claimed) {
      // Déjà décidé : on relit l'état RÉEL (celui chargé plus haut peut être périmé).
      const [cur] = await db.select({ status: devis.status }).from(devis).where(eq(devis.id, d.id)).limit(1);
      if (cur?.status !== action) {
        return NextResponse.json({ error: "Ce devis ne peut plus être modifié" }, { status: 409 });
      }
      // Même décision rejouée (retry réseau, double clic) : on continue, acceptDevis est
      // idempotent et RÉPARE un dossier semi-appliqué (accepté sans client/intervention).
    }

    if (action === "accepté") {
      // Signature : crée client (si prospect) + intervention à planifier + notifie. Idempotent.
      await acceptDevis(d.id);
    }
    return NextResponse.json({ success: true, status: action });
  } catch (err) {
    logError("devis.respond", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

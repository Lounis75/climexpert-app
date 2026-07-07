import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devis, leads, notifications } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDevisByToken } from "@/lib/devis";
import { acceptDevis } from "@/lib/devis-workflow";
import { logError } from "@/lib/observability";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { action, motif } = await req.json();

    if (action !== "accepté" && action !== "refusé") {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }
    const motifRefus = action === "refusé" ? String(motif ?? "").trim().slice(0, 500) : "";

    const d = await getDevisByToken(token);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

    // Garde-fous à l'ACCEPTATION (le refus d'un vieux devis reste toujours possible) :
    if (action === "accepté") {
      // 1) Expiration : au-delà de validUntil (ou 60 j après création par défaut), on n'accepte plus
      //    un devis à un prix potentiellement périmé. Aligne le comportement sur /api/devis-decision.
      const limite = d.validUntil ? new Date(d.validUntil).getTime() : new Date(d.createdAt).getTime() + 60 * 86400000;
      if (Date.now() > limite) {
        return NextResponse.json({ error: "Ce devis a expiré. Contactez-nous pour un devis à jour." }, { status: 410 });
      }
      // 2) Prospect classé/archivé : un devis rattaché à une affaire archivée ne doit pas être
      //    ré-accepté silencieusement via un vieux lien (il faut repartir d'un devis à jour).
      if (d.leadId) {
        const [ld] = await db.select({ archiveLe: leads.archiveLe }).from(leads).where(eq(leads.id, d.leadId)).limit(1);
        if (ld?.archiveLe) {
          return NextResponse.json({ error: "Ce devis n'est plus d'actualité. Contactez-nous pour un devis à jour." }, { status: 410 });
        }
      }
    }

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
    } else if (claimed) {
      // Refus (premier clic seulement) : notifier l'équipe avec le motif, précieux pour relancer.
      await db.insert(notifications).values({
        adminId: null,
        type: "devis_refuse",
        titre: `Devis ${d.number} refusé par le client`,
        contenu: motifRefus ? `Motif : ${motifRefus}` : "Aucun motif indiqué.",
        refType: "devis",
        refId: d.id,
      }).catch((e) => logError("devis.respond.notif", e, { devisId: d.id }));
      // Aligner le PROSPECT : un devis structuré refusé classe le lead en « Perdu » (motif refus),
      // comme le flux PDF. Sinon il restait indéfiniment en « devis_envoyé » dans le pipeline.
      if (d.leadId) {
        await db.update(leads).set({
          status: "perdu", motifPerdu: "refus",
          statutChangeLe: new Date(), relanceNotifieeLe: null,
          version: sql`${leads.version} + 1`, updatedAt: new Date(),
        }).where(and(eq(leads.id, d.leadId), ne(leads.status, "gagné"))).catch((e) => logError("devis.respond.leadPerdu", e, { devisId: d.id }));
      }
    }
    return NextResponse.json({ success: true, status: action });
  } catch (err) {
    logError("devis.respond", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

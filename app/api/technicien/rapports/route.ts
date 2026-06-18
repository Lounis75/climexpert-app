import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, rapportsIntervention, notifications, contratsEntretien, suivis } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";
import { createId } from "@paralleldrive/cuid2";
import { contratTotalCt } from "@/lib/contrat-pricing";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const {
    interventionId,
    installationConforme,
    notes,
    photosUrls,
    dureeReelleMinutes,
    // Champs visite technique
    dimensionsPiece,
    typeMur,
    distanceGroupes,
    contraintesElec,
    equipementRecommande,
    difficulte,
    // Entretien annuel (obligatoire) + signature du contrat
    entretienAnnuelPropose,
    entretienAnnuelAccepte,
    signatureUrl,
  } = body;

  if (!interventionId) return NextResponse.json({ error: "interventionId requis" }, { status: 400 });
  // Réponse OBLIGATOIRE : a-t-on proposé l'entretien annuel ? (Oui/Non)
  if (typeof entretienAnnuelPropose !== "boolean") {
    return NextResponse.json({ error: "Répondez à : entretien annuel proposé ? (Oui/Non)" }, { status: 400 });
  }

  const [interv] = await db
    .select()
    .from(interventions)
    .where(and(eq(interventions.id, interventionId), eq(interventions.technicienId, session.sub)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });

  // Créer le rapport
  const [rapport] = await db
    .insert(rapportsIntervention)
    .values({
      interventionId,
      technicienId:         session.sub,
      installationConforme: installationConforme ?? true,
      notes:                notes ?? null,
      photosUrls:           photosUrls ?? [],
      dimensionsPiece:      dimensionsPiece ?? null,
      typeMur:              typeMur ?? null,
      distanceGroupes:      distanceGroupes ?? null,
      contraintesElec:      contraintesElec ?? null,
      equipementRecommande: equipementRecommande ?? null,
      difficulte:           difficulte ?? null,
      entretienAnnuelPropose: entretienAnnuelPropose,
      entretienAnnuelAccepte: entretienAnnuelAccepte ?? null,
    })
    .returning();

  // Si le client a accepté l'entretien annuel et signé : crée le contrat signé
  if (entretienAnnuelPropose && entretienAnnuelAccepte && signatureUrl) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const contratId = createId();
      await db.insert(contratsEntretien).values({
        id: contratId,
        clientId: interv.clientId,
        units: 1,
        prixUnitaireCt: contratTotalCt(1), // 180 € (total annuel)
        startDate: today,
        nextVisit: nextYear.toISOString().split("T")[0],
        signatureUrl,
        signeLe: new Date(),
      });
      await db.insert(suivis).values({
        id: createId(), clientId: interv.clientId, interventionId,
        type: "note", contenu: "Contrat d'entretien annuel signé sur place (180 € TTC/an).",
      }).catch(() => {});
      await db.insert(notifications).values({
        id: createId(), type: "nouveau_contrat",
        titre: "Contrat d'entretien signé sur le terrain",
        contenu: `Le technicien ${session.name} a fait signer un contrat d'entretien annuel.`,
        refType: "contrat", refId: contratId,
      });
    } catch (e) { console.error("[rapport] création contrat:", e); }
  }

  // Mettre à jour l'intervention
  await db
    .update(interventions)
    .set({
      status:             "terminée",
      completedAt:        new Date(),
      dureeReelleMinutes: dureeReelleMinutes ?? null,
      updatedAt:          new Date(),
    })
    .where(eq(interventions.id, interventionId));

  // Notif admin
  await db.insert(notifications).values({
    type:    "rapport_requis",
    titre:   "Rapport d'intervention soumis",
    contenu: `Le technicien ${session.name} a soumis le rapport de clôture.`,
    refType: "intervention",
    refId:   interventionId,
  });

  // Si non conforme : NE PAS envoyer l'email auto — notifier admin en priorité
  if (!installationConforme) {
    await db.insert(notifications).values({
      type:    "escalade_client",
      titre:   "⚠️ Installation non conforme — action requise",
      contenu: `L'intervention ${interventionId} a été clôturée comme NON CONFORME. Vérifiez avant d'envoyer l'email au client.`,
      refType: "intervention",
      refId:   interventionId,
    });
    return NextResponse.json({ ok: true, rapport, warning: "non_conforme" });
  }

  return NextResponse.json({ ok: true, rapport });
}

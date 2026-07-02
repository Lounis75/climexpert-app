import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, rapportsIntervention, notifications, contratsEntretien, suivis, clients } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifyTechnicienToken, TECH_COOKIE_NAME, verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { createId } from "@paralleldrive/cuid2";
import { contratTotalCt } from "@/lib/contrat-pricing";
import { finalizeCerfa, requestCerfaSignature } from "@/lib/cerfa";
import { finalizeContrat } from "@/lib/contrat-finalize";
import type { CerfaData } from "@/lib/cerfa-pdf";
import { SIGNATURE_GERANT_DATAURL, GERANT_NOM, GERANT_QUALITE } from "@/lib/signature-gerant";
import { planifierSuivis } from "@/lib/interventions";
import { logError } from "@/lib/observability";
import { formatDateShortParis } from "@/lib/paris-time";

export async function POST(req: NextRequest) {
  // Clôture autorisée au technicien assigné (terrain) OU à l'administrateur (back-office,
  // quand le technicien n'a pas pu remplir sur place).
  const techToken = req.cookies.get(TECH_COOKIE_NAME)?.value;
  const techSession = techToken ? await verifyTechnicienToken(techToken) : null;
  let actor: { label: string; technicienId: string | null; isAdmin: boolean } | null = null;
  if (techSession) {
    actor = { label: `Le technicien ${techSession.name}`, technicienId: techSession.sub, isAdmin: false };
  } else {
    const adminToken = req.cookies.get(COOKIE_NAME)?.value;
    const adminSession = adminToken ? await verifyAdminToken(adminToken) : null;
    if (adminSession) actor = { label: `L'administrateur ${adminSession.nom}`, technicienId: null, isAdmin: true };
  }
  if (!actor) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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
    signatureUrl,             // signature contrat uploadée (R2) -> stockée sur le contrat
    contratClientSignature,   // data URL PNG : signature client à apposer sur le PDF du contrat
    // Attestation CERFA (fiche d'intervention fluides) : données saisies + signature DU CLIENT
    cerfa,                  // objet partiel CerfaData (nature, équipement, fuites, observations…)
    cerfaClientSignature,   // data URL PNG : signature du client (détenteur) au stylet
    cerfaEnvoiSignature,    // true = client absent : envoyer l'attestation par e-mail pour signature à distance
  } = body;

  if (!interventionId) return NextResponse.json({ error: "interventionId requis" }, { status: 400 });
  // Réponse OBLIGATOIRE : a-t-on proposé l'entretien annuel ? (Oui/Non)
  if (typeof entretienAnnuelPropose !== "boolean") {
    return NextResponse.json({ error: "Répondez à : entretien annuel proposé ? (Oui/Non)" }, { status: 400 });
  }

  const [interv] = await db
    .select()
    .from(interventions)
    .where(actor.isAdmin
      ? eq(interventions.id, interventionId)
      : and(eq(interventions.id, interventionId), eq(interventions.technicienId, actor.technicienId!)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });

  // Le rapport est rattaché au technicien assigné (FK obligatoire). L'admin clôture à sa
  // place : l'intervention doit donc avoir un technicien assigné.
  const reportTechId = actor.isAdmin ? interv.technicienId : actor.technicienId;
  if (!reportTechId) {
    return NextResponse.json({ error: "Assignez un technicien à cette intervention avant de la clôturer." }, { status: 400 });
  }

  // Idempotence : si un rapport existe déjà (intervention déjà clôturée), ne pas
  // réinsérer, la contrainte unique sur interventionId crasherait en 500. Cas réel :
  // iPad en veille / réseau coupé → 1er POST réussit serveur mais réponse perdue → re-soumission.
  const [dejaRapport] = await db
    .select({ id: rapportsIntervention.id })
    .from(rapportsIntervention)
    .where(eq(rapportsIntervention.interventionId, interventionId))
    .limit(1);
  if (dejaRapport || interv.status === "terminée") {
    // Rattrapage : un 1er POST a pu insérer le rapport puis crasher AVANT le passage en
    // "terminée" (timeout, lambda tuée). On rejoue ici les étapes idempotentes manquantes
    // au lieu de laisser l'intervention bloquée "en_cours" avec un rapport existant.
    if (interv.status !== "terminée") {
      await db.update(interventions).set({
        status: "terminée",
        completedAt: interv.completedAt ?? new Date(),
        version: sql`${interventions.version} + 1`,
        updatedAt: new Date(),
      }).where(eq(interventions.id, interventionId));
    }
    await planifierSuivis({ id: interventionId, clientId: interv.clientId, completedAt: interv.completedAt ?? new Date() })
      .catch((e) => logError("rapport.suivis.rattrapage", e, { interventionId }));
    return NextResponse.json({ ok: true, dejaCloture: true });
  }

  // Créer le rapport
  const [rapport] = await db
    .insert(rapportsIntervention)
    .values({
      interventionId,
      technicienId:         reportTechId,
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
      // Reprend l'équipement saisi sur le CERFA pour pré-remplir le contrat.
      const ce = cerfa as CerfaData | undefined;
      const fluideC = ce?.equipement?.fluide ? `R${String(ce.equipement.fluide).replace(/^R/i, "")}` : "R410A";
      const [contrat] = await db.insert(contratsEntretien).values({
        id: contratId,
        clientId: interv.clientId,
        units: 1,
        prixUnitaireCt: contratTotalCt(1), // 200 € (total annuel)
        fluide: fluideC,
        marque: ce?.equipement?.identification ?? null,
        startDate: today,
        nextVisit: nextYear.toISOString().split("T")[0],
        signatureUrl,
        signeLe: new Date(),
      }).returning();
      await db.insert(suivis).values({
        id: createId(), clientId: interv.clientId, interventionId,
        type: "note", contenu: "Contrat d'entretien annuel signé sur place (200 € TTC/an).",
      }).catch(() => {});
      await db.insert(notifications).values({
        id: createId(), type: "nouveau_contrat",
        titre: "Contrat d'entretien signé sur le terrain",
        contenu: `${actor.label} a fait signer un contrat d'entretien annuel.`,
        refType: "contrat", refId: contratId,
      });
      // PDF du contrat signé (gérant pré-signé + signature client) -> R2 + fiche client + e-mail.
      const [cli] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);
      if (contrat && cli) {
        await finalizeContrat({ contrat, client: cli, clientSignatureDataUrl: contratClientSignature });
      }
    } catch (e) {
      // Le client a PHYSIQUEMENT signé sur l'iPad : un échec ici = signature juridiquement
      // perdue si personne n'est prévenu. On alerte le gérant pour rattrapage manuel.
      logError("rapport.contrat.creation", e, { interventionId, clientId: interv.clientId });
      await db.insert(notifications).values({
        id: createId(), type: "escalade_client",
        titre: "⚠️ Contrat signé sur iPad NON enregistré, action requise",
        contenu: `Le client a signé un contrat d'entretien pendant la clôture mais l'enregistrement a échoué. Recréez le contrat manuellement (fiche client) et refaites signer si besoin.`,
        refType: "intervention", refId: interventionId,
      }).catch((e2) => logError("rapport.contrat.notif", e2, { interventionId }));
    }
  }

  // Mettre à jour l'intervention
  await db
    .update(interventions)
    .set({
      status:             "terminée",
      completedAt:        new Date(),
      dureeReelleMinutes: dureeReelleMinutes ?? null,
      version:            sql`${interventions.version} + 1`,
      updatedAt:          new Date(),
    })
    .where(eq(interventions.id, interventionId));

  // Suivis post-chantier (avis J+7, relance J+30, SMS J+365) : c'est ICI la clôture réelle,
  // sans cet appel les crons de suivi tournent sur une table vide. Idempotent.
  await planifierSuivis({ id: interventionId, clientId: interv.clientId, completedAt: new Date() })
    .catch((e) => logError("rapport.suivis", e, { interventionId }));

  // Entretien terminé : programmer la relance du client à +330 jours (nouvel entretien).
  if (["entretien", "maintenance", "contrat-pro"].includes(interv.type)) {
    const relance = new Date();
    relance.setDate(relance.getDate() + 330);
    await db.update(clients).set({
      prochainEntretienLe: relance.toISOString().split("T")[0],
      relanceEntretienNotifiee: false,
      version: sql`${clients.version} + 1`,
      updatedAt: new Date(),
    }).where(eq(clients.id, interv.clientId)).catch((e) => logError("rapport.relanceEntretien", e, { interventionId, clientId: interv.clientId }));
  }

  // Attestation CERFA : génère le PDF officiel rempli → R2 + fiche client + e-mail au client.
  // N'échoue jamais la clôture (try/catch).
  if (cerfa) {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);
      const todayFr = formatDateShortParis(); // jour civil PARIS (le serveur est en UTC)
      const cerfaData: CerfaData = {
        ...(cerfa as CerfaData),
        detenteur: (cerfa as CerfaData).detenteur ?? { nom: client?.name ?? "", adresse: [client?.address, client?.city].filter(Boolean).join(", ") },
        controleLe: (cerfa as CerfaData).controleLe || todayFr,
        // Opérateur = le gérant, pré-signé (engage ClimExpert). Le client (détenteur) signe sur place.
        signataireOperateur: {
          nom: GERANT_NOM,
          qualite: GERANT_QUALITE,
          date: todayFr,
          signatureDataUrl: SIGNATURE_GERANT_DATAURL || undefined,
        },
        signataireDetenteur: {
          nom: client?.name ?? "",
          qualite: "Client",
          date: todayFr,
          signatureDataUrl: cerfaClientSignature,
        },
      };
      if (cerfaEnvoiSignature) {
        // Client absent : on envoie l'attestation par e-mail pour signature à distance (le PDF
        // officiel sera généré et envoyé une fois le client signataire). L'intervention reste terminée.
        await requestCerfaSignature({ rapportId: rapport.id, cerfa: cerfaData, clientName: client?.name ?? "Client", clientEmail: client?.email });
      } else {
        await finalizeCerfa({
          clientId: interv.clientId,
          interventionId,
          clientName: client?.name ?? "Client",
          clientEmail: client?.email,
          cerfa: cerfaData,
        });
      }
    } catch (e) {
      // Attestation réglementaire (fluides F-Gaz) : un échec silencieux = document jamais
      // produit. On alerte pour régénérer depuis le back-office.
      logError("rapport.cerfa", e, { interventionId, clientId: interv.clientId });
      await db.insert(notifications).values({
        id: createId(), type: "escalade_client",
        titre: "⚠️ Attestation CERFA non générée, action requise",
        contenu: "La génération/l'envoi de l'attestation d'intervention a échoué à la clôture. Régénérez-la depuis la fiche intervention.",
        refType: "intervention", refId: interventionId,
      }).catch((e2) => logError("rapport.cerfa.notif", e2, { interventionId }));
    }
  }

  // Notif admin
  await db.insert(notifications).values({
    type:    "rapport_requis",
    titre:   "Rapport d'intervention soumis",
    contenu: `${actor.label} a soumis le rapport de clôture.`,
    refType: "intervention",
    refId:   interventionId,
  });

  // Si non conforme : NE PAS envoyer l'email auto, notifier admin en priorité
  if (!installationConforme) {
    await db.insert(notifications).values({
      type:    "escalade_client",
      titre:   "⚠️ Installation non conforme, action requise",
      contenu: `L'intervention ${interventionId} a été clôturée comme NON CONFORME. Vérifiez avant d'envoyer l'email au client.`,
      refType: "intervention",
      refId:   interventionId,
    });
    return NextResponse.json({ ok: true, rapport, warning: "non_conforme" });
  }

  return NextResponse.json({ ok: true, rapport });
}

import { db } from "@/lib/db";
import { devis, interventions, suivis, notifications, admins, leads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { createClientFromLead } from "@/lib/clients";

/**
 * Traitement à la SIGNATURE d'un devis (transition -> "accepté").
 * Centralisé ici pour être déclenché aussi bien depuis la page publique de
 * signature que depuis l'admin. Idempotent : ne crée pas de doublon d'intervention.
 *
 * Effets : passe le devis en "accepté", crée une intervention en brouillon liée
 * au devis (à planifier : ni date ni technicien), journalise un suivi et notifie.
 */
export async function acceptDevis(devisId: string): Promise<{ interventionId?: string }> {
  const [d] = await db.select().from(devis).where(eq(devis.id, devisId)).limit(1);
  if (!d) return {};

  await db.update(devis).set({ status: "accepté", updatedAt: new Date() }).where(eq(devis.id, devisId));

  // SIGNATURE = le prospect est GAGNÉ. On aligne le statut du lead et on enregistre le montant
  // signé (totalTtcCt) AVANT la conversion en client : le chantier créé par createClientFromLead
  // reprend lead.montantDevisCt, il faut donc qu'il soit déjà posé. Sans ça, le prospect restait
  // bloqué en « devis_envoyé » et le CA / panier moyen (calculés depuis lead.montantDevisCt des
  // gagnés) ignoraient le devis accepté -> chiffre d'affaires sous-compté. gagneLe garde la 1re
  // date de gain (idempotent).
  if (d.leadId) {
    const setLead: Record<string, unknown> = {
      status: "gagné",
      gagneLe: sql`coalesce(${leads.gagneLe}, now())`,
      statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    };
    // Montant signé -> CA de l'affaire, MAIS on ne l'écrase pas si le prospect était déjà gagné
    // (on préserve le CA de la 1re affaire ; un 2e devis passe normalement par un nouveau prospect).
    if (typeof d.totalTtcCt === "number") {
      setLead.montantDevisCt = sql`case when ${leads.gagneLe} is null then ${d.totalTtcCt} else ${leads.montantDevisCt} end`;
    }
    await db.update(leads).set(setLead).where(eq(leads.id, d.leadId));
  }

  // SIGNATURE = passage prospect -> client : si le devis vise un prospect (leadId
  // sans client), on crée le client à partir du lead et on lie le devis.
  let clientId = d.clientId;
  if (!clientId && d.leadId) {
    const client = await createClientFromLead(d.leadId);
    if (client) {
      clientId = client.id;
      await db.update(devis).set({ clientId: client.id, updatedAt: new Date() }).where(eq(devis.id, devisId));
    }
  }

  // Toujours pas de client -> rien à planifier
  if (!clientId) return {};

  // Idempotence : une seule intervention par devis
  const [existing] = await db
    .select({ id: interventions.id })
    .from(interventions)
    .where(eq(interventions.devisId, devisId))
    .limit(1);
  if (existing) return { interventionId: existing.id };

  const interventionId = createId();
  await db.insert(interventions).values({
    id: interventionId,
    clientId,
    devisId: d.id,
    type: "installation",   // valeur par défaut, ajustable lors de la planification
    status: "planifiée",    // créée, en attente de date + technicien
    notes: `Créée automatiquement à la signature du devis ${d.number}.`,
  });

  // Fil d'activité du dossier
  try {
    await db.insert(suivis).values({
      id: createId(),
      clientId,
      interventionId,
      type: "note",
      contenu: `Devis ${d.number} signé. Intervention à planifier (date + technicien).`,
    });
  } catch (e) { console.error("[acceptDevis] suivi:", e); }

  // Notification : à planifier
  try {
    const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
    if (admin) {
      await db.insert(notifications).values({
        id: createId(),
        adminId: null,
        type: "devis_signe",
        titre: `Devis ${d.number} signé, intervention à planifier`,
        contenu: "Définissez une date et affectez un technicien.",
        refType: "intervention",
        refId: interventionId,
      });
    }
  } catch (e) { console.error("[acceptDevis] notif:", e); }

  return { interventionId };
}

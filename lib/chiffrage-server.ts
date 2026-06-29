import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { ChiffrageClient } from "@/lib/catalogue";

/**
 * Retourne l'id du prospect :
 *  - celui fourni s'il existe ;
 *  - sinon, si un client existant est rattaché (clientId), le prospect déjà lié à ce client (réutilisé)
 *    ou un nouveau prospect lié à ce client (pour qu'à l'acceptation aucun doublon de fiche client
 *    ne soit créé : createClientFromLead est idempotent quand lead.clientId est posé) ;
 *  - sinon, un nouveau prospect créé à partir des infos saisies dans l'outil (gère pro + SIREN).
 */
export async function resolveLeadId(
  leadId: string | null | undefined,
  client: ChiffrageClient,
  clientType: "particulier" | "pro",
  opts?: { clientId?: string | null; project?: string | null },
): Promise<{ id: string; created: boolean }> {
  if (leadId) {
    const [l] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
    if (l) return { id: l.id, created: false };
  }
  const clientId = opts?.clientId?.trim() || null;
  if (clientId) {
    // Réutilise un prospect déjà rattaché à ce client (évite d'en empiler à chaque devis).
    const [l] = await db.select({ id: leads.id }).from(leads)
      .where(and(eq(leads.clientId, clientId), isNull(leads.supprimeLe))).limit(1);
    if (l) return { id: l.id, created: false };
  }
  const id = createId();
  const location = [client.cp?.trim(), client.ville?.trim()].filter(Boolean).join(" ").trim() || null;
  const pro = clientType === "pro";
  // `project` est un enum côté schéma (pas de "depose" → "autre"). On valide avant insertion.
  const PROJECTS = ["installation", "entretien", "depannage", "autre", "contrat-pro"] as const;
  const rawProj = opts?.project === "depose" ? "autre" : (opts?.project || "installation");
  const project = (PROJECTS as readonly string[]).includes(rawProj) ? (rawProj as typeof PROJECTS[number]) : "installation";
  await db.insert(leads).values({
    id,
    name: (client.nom || client.entreprise || "Client").trim(),
    phone: (client.tel || "").trim() || "—",
    email: (client.email || "").trim() || null,
    address: (client.adr || "").trim() || null,
    location,
    source: "autre",
    project,
    status: "contacté",
    clientId,
    typeClient: pro ? "professionnel" : "particulier",
    entreprise: pro ? (client.entreprise || "").trim() || null : null,
    siren: pro ? (client.siren || "").trim() || null : null,
  });
  return { id, created: true };
}

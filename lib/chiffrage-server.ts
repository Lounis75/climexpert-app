import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { ChiffrageClient } from "@/lib/catalogue";

/**
 * Retourne l'id du prospect : celui fourni s'il existe, sinon en crée un à partir des infos
 * client saisies dans l'outil de chiffrage (gère le cas pro avec entreprise + SIREN).
 */
export async function resolveLeadId(
  leadId: string | null | undefined,
  client: ChiffrageClient,
  clientType: "particulier" | "pro",
): Promise<{ id: string; created: boolean }> {
  if (leadId) {
    const [l] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
    if (l) return { id: l.id, created: false };
  }
  const id = createId();
  const location = [client.cp?.trim(), client.ville?.trim()].filter(Boolean).join(" ").trim() || null;
  const pro = clientType === "pro";
  await db.insert(leads).values({
    id,
    name: (client.nom || client.entreprise || "Client").trim(),
    phone: (client.tel || "").trim() || "—",
    email: (client.email || "").trim() || null,
    address: (client.adr || "").trim() || null,
    location,
    source: "autre",
    project: "installation",
    status: "contacté",
    typeClient: pro ? "professionnel" : "particulier",
    entreprise: pro ? (client.entreprise || "").trim() || null : null,
    siren: pro ? (client.siren || "").trim() || null : null,
  });
  return { id, created: true };
}

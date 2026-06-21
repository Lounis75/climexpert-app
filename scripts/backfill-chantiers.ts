/**
 * Backfill des chantiers pour les clients déjà « gagnés » (avant l'auto-création).
 * Crée 1 chantier par prospect gagné qui n'en a pas encore (idempotent via leadId).
 *
 *   Dry-run (défaut) : npx dotenv -e .env.local -- npx tsx scripts/backfill-chantiers.ts
 *   Écriture réelle  : npx dotenv -e .env.local -- npx tsx scripts/backfill-chantiers.ts --apply
 */
import { db } from "@/lib/db";
import { leads, clients } from "@/lib/db/schema";
import { eq, and, isNotNull, isNull } from "drizzle-orm";
import { getChantierByLead, createChantier } from "@/lib/chantiers";

const PROJECT_LABEL: Record<string, string> = {
  installation: "Installation", entretien: "Entretien", depannage: "Dépannage",
  "contrat-pro": "Contrat pro", autre: "Chantier",
};

const DRY = !process.argv.includes("--apply");

async function main() {
  // Mêmes critères que la création auto (createClientFromLead) : prospect gagné,
  // lié à un client, non supprimé.
  const rows = await db
    .select({ lead: leads, clientName: clients.name })
    .from(leads)
    .innerJoin(clients, eq(leads.clientId, clients.id))
    .where(and(eq(leads.status, "gagné"), isNotNull(leads.clientId), isNull(leads.supprimeLe), isNull(clients.supprimeLe)));

  let created = 0, skipped = 0;
  for (const { lead, clientName } of rows) {
    if (await getChantierByLead(lead.id)) { skipped++; continue; }
    const nom = `${PROJECT_LABEL[lead.project ?? ""] ?? "Chantier"} — ${clientName}`;
    const montant = lead.montantDevisCt ?? null;
    console.log(`${DRY ? "[DRY] " : "[OK]  "}${nom}  (montant: ${montant != null ? (montant / 100).toFixed(2) + " €" : "—"})`);
    if (!DRY) await createChantier({ clientId: lead.clientId!, leadId: lead.id, nom, montantCt: montant });
    created++;
  }

  console.log(`\n${DRY ? "DRY-RUN — rien écrit. " : "ÉCRIT en base. "}À créer: ${created} · déjà présents: ${skipped} · total gagnés: ${rows.length}`);
  if (DRY) console.log("→ Relancer avec --apply pour écrire en base.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

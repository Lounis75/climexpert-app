import { getLeads, getEnProductionLeadIds } from "@/lib/leads";
import { getClients, getClientActions } from "@/lib/clients";
import { leadAction } from "@/lib/leads-utils";

export type ActionsGlobales = { total: number; prospects: number; clients: number };

/**
 * Compteur global des « actions à faire » (repères rouges).
 * Réutilise EXACTEMENT les sources des vues (getLeads pour le Kanban, getClients pour
 * la liste clients) et la même logique de détection → le compteur colle toujours au
 * nombre de cartes rouges affichées.
 */
// Liste nominative des prospects à traiter aujourd'hui (« Mes relances du jour »).
export type Relance = { id: string; name: string; phone: string; action: string; clientId: string | null; prochaineActionLe: string | null };

export async function getRelancesDuJour(): Promise<Relance[]> {
  const leadsList = await getLeads();
  const enProduction = await getEnProductionLeadIds(leadsList);
  const out: Relance[] = [];
  for (const l of leadsList) {
    if (enProduction.has(l.id)) continue;
    const action = leadAction(l);
    if (!action) continue;
    out.push({ id: l.id, name: l.name, phone: l.phone, action, clientId: l.clientId, prochaineActionLe: l.prochaineActionLe ?? null });
  }
  // Relances datées échues en premier (plus ancienne d'abord), puis le reste.
  return out.sort((a, b) => {
    if (a.prochaineActionLe && b.prochaineActionLe) return a.prochaineActionLe.localeCompare(b.prochaineActionLe);
    if (a.prochaineActionLe) return -1;
    if (b.prochaineActionLe) return 1;
    return 0;
  });
}

export async function getActionsGlobales(): Promise<ActionsGlobales> {
  const [leadsList, clientsList] = await Promise.all([getLeads(), getClients()]);
  // Les prospects passés en production sortent du Kanban → exclus du compteur aussi.
  const enProduction = await getEnProductionLeadIds(leadsList);
  const prospects = leadsList.filter((l) => !enProduction.has(l.id) && leadAction(l) !== null).length;
  const clientActions = await getClientActions(clientsList);
  const clients = Object.keys(clientActions).length;
  return { total: prospects + clients, prospects, clients };
}

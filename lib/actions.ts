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
export async function getActionsGlobales(): Promise<ActionsGlobales> {
  const [leadsList, clientsList] = await Promise.all([getLeads(), getClients()]);
  // Les prospects passés en production sortent du Kanban → exclus du compteur aussi.
  const enProduction = await getEnProductionLeadIds(leadsList);
  const prospects = leadsList.filter((l) => !enProduction.has(l.id) && leadAction(l) !== null).length;
  const clientActions = await getClientActions(clientsList);
  const clients = Object.keys(clientActions).length;
  return { total: prospects + clients, prospects, clients };
}

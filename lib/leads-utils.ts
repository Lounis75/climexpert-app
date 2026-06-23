import type { Lead } from "@/lib/db/schema";

// Action à faire sur un prospect → repère rouge discret. null = rien à faire.
// Logique PARTAGÉE entre la carte Kanban et le compteur global (cohérence garantie).
export function leadAction(lead: Lead): string | null {
  const terminal = lead.status === "gagné" || lead.status === "perdu";

  // Manque le montant du devis (data gap), toujours prioritaire.
  if ((lead.status === "devis_envoyé" || lead.status === "gagné") && !lead.montantDevisCt) return "Devis à chiffrer";
  if (terminal) return null;

  // RDV pris mais date non fixée.
  if (lead.prochaineEtape === "rdv_pris" && !lead.rdvDate) return "Fixer le RDV";

  // Prochaine action datée : pilote l'alerte anti-oubli.
  if (lead.prochaineActionLe) {
    const due = new Date(lead.prochaineActionLe); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - due.getTime()) / 86400000);
    if (diff > 0) return `Relance en retard (${diff}j)`;
    if (diff === 0) return "Relance aujourd'hui";
    return null; // planifiée dans le futur → pas d'alerte
  }

  // Intention de relance déclarée mais sans date → inviter à planifier.
  if (lead.prochaineEtape === "a_recontacter" || lead.prochaineEtape === "devis_a_faire") return "Planifier la relance";
  return null;
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-\.]/g, "");
  if (p.startsWith("+33")) p = "0" + p.slice(3);
  return p;
}

export function detectDuplicates(allLeads: Lead[]): Map<string, Lead[]> {
  const byPhone = new Map<string, Lead[]>();
  const byEmail = new Map<string, Lead[]>();

  for (const lead of allLeads) {
    const phone = normalizePhone(lead.phone);
    if (!byPhone.has(phone)) byPhone.set(phone, []);
    byPhone.get(phone)!.push(lead);

    if (lead.email) {
      const email = lead.email.toLowerCase();
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push(lead);
    }
  }

  const result = new Map<string, Lead[]>();

  function addDuplicate(lead: Lead, others: Lead[]) {
    const dupes = others.filter((o) => o.id !== lead.id);
    if (dupes.length === 0) return;
    if (!result.has(lead.id)) result.set(lead.id, []);
    for (const d of dupes) {
      if (!result.get(lead.id)!.find((x) => x.id === d.id)) {
        result.get(lead.id)!.push(d);
      }
    }
  }

  for (const group of byPhone.values()) {
    if (group.length > 1) group.forEach((l) => addDuplicate(l, group));
  }
  for (const group of byEmail.values()) {
    if (group.length > 1) group.forEach((l) => addDuplicate(l, group));
  }

  return result;
}

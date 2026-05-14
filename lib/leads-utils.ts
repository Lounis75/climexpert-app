import type { Lead } from "@/lib/db/schema";

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

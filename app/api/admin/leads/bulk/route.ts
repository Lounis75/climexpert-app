import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { isNull, and } from "drizzle-orm";
import { createLead } from "@/lib/leads";
import { normalizePhone, formatPhone, extractPhones } from "@/lib/phone";

// Import en masse de numéros entrants à rappeler : colle une liste (texte brut), on crée un
// prospect par numéro NON déjà présent en base. Statut "nouveau", source "téléphone".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const incoming: string[] = Array.isArray(body.numbers)
    ? body.numbers.map((x: string) => normalizePhone(x)).filter((x: string | null): x is string => !!x)
    : extractPhones(String(body.text ?? ""));
  const unique = [...new Set(incoming)];
  if (unique.length === 0) {
    return NextResponse.json({ error: "Aucun numéro français valide détecté." }, { status: 400 });
  }

  // Dédup contre les prospects existants (non supprimés), sur numéro normalisé.
  const existing = await db.select({ phone: leads.phone }).from(leads).where(and(isNull(leads.supprimeLe), isNull(leads.archiveLe)));
  const seen = new Set<string>();
  for (const e of existing) { const n = normalizePhone(e.phone); if (n) seen.add(n); }

  let created = 0;
  let skipped = 0;
  for (const n of unique) {
    if (seen.has(n)) { skipped++; continue; }
    try {
      await createLead({
        name: formatPhone(n),
        phone: n,
        source: "téléphone",
        project: null,
        notes: "📞 Appel entrant à rappeler (import en masse).",
      });
      seen.add(n);
      created++;
    } catch {
      skipped++;
    }
  }
  return NextResponse.json({ created, skipped, total: unique.length });
}

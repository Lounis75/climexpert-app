import { notFound } from "next/navigation";
import { getLeadByQualifToken } from "@/lib/leads";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QualifChat from "@/app/qualif/[token]/QualifChat";

export const dynamic = "force-dynamic";

// Alias COURT de /qualif/[token] (lien SMS plus court). Même logique : le prospect décrit son besoin
// à Alex, qui qualifie et met à jour sa fiche.
export default async function QualifShortPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByQualifToken(token);
  if (!lead) notFound();
  // Funnel « envoyé → ouvert → répondu » : c'est CE lien (/q/) qui part par SMS, donc c'est ICI
  // qu'on horodate la 1re ouverture (badge « Lien ouvert » + relance des prospects chauds).
  if (!lead.qualifOuvertLe) {
    await db.update(leads).set({ qualifOuvertLe: new Date(), updatedAt: new Date() })
      .where(eq(leads.id, lead.id)).catch(() => {});
  }
  const prenom = (lead.name || "").trim().split(" ")[0] || "";
  return <QualifChat token={token} prenom={prenom} />;
}

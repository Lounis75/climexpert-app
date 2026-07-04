import { notFound } from "next/navigation";
import { getLeadByQualifToken } from "@/lib/leads";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QualifChat from "./QualifChat";

export const dynamic = "force-dynamic";

// Page PUBLIQUE : le prospect ouvre son lien personnel (reçu par SMS) et décrit son besoin à Alex,
// qui qualifie et met à jour SA fiche dans le CRM. Pas de coordonnées à ressaisir (token = identité).
export default async function QualifPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByQualifToken(token);
  if (!lead) notFound();
  // Funnel « envoyé → ouvert → répondu » : on horodate la 1re ouverture du lien (badge « Lien
  // ouvert » sur la carte prospect ; permet de relancer ceux qui ont ouvert sans répondre).
  if (!lead.qualifOuvertLe) {
    await db.update(leads).set({ qualifOuvertLe: new Date(), updatedAt: new Date() })
      .where(eq(leads.id, lead.id)).catch(() => {});
  }
  const prenom = (lead.name || "").trim().split(" ")[0] || "";
  return <QualifChat token={token} prenom={prenom} />;
}

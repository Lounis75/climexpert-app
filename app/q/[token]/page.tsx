import { notFound } from "next/navigation";
import { getLeadByQualifToken } from "@/lib/leads";
import QualifChat from "@/app/qualif/[token]/QualifChat";

export const dynamic = "force-dynamic";

// Alias COURT de /qualif/[token] (lien SMS plus court). Même logique : le prospect décrit son besoin
// à Alex, qui qualifie et met à jour sa fiche.
export default async function QualifShortPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByQualifToken(token);
  if (!lead) notFound();
  const prenom = (lead.name || "").trim().split(" ")[0] || "";
  return <QualifChat token={token} prenom={prenom} />;
}

import { notFound } from "next/navigation";
import { getLeadByQualifToken } from "@/lib/leads";
import QualifChat from "./QualifChat";

export const dynamic = "force-dynamic";

// Page PUBLIQUE : le prospect ouvre son lien personnel (reçu par SMS) et décrit son besoin à Alex,
// qui qualifie et met à jour SA fiche dans le CRM. Pas de coordonnées à ressaisir (token = identité).
export default async function QualifPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await getLeadByQualifToken(token);
  if (!lead) notFound();
  const prenom = (lead.name || "").trim().split(" ")[0] || "";
  return <QualifChat token={token} prenom={prenom} />;
}

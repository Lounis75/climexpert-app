import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { leads, devisEnvois } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DevisDecisionClient from "@/components/DevisDecisionClient";

export const dynamic = "force-dynamic";

// Page PUBLIQUE : le client ouvre le lien reçu par e-mail, lit son devis (PDF) et répond
// (accepter / décliner en 1 clic). Le token désigne un devis précis dans l'historique
// (plusieurs liens peuvent coexister) ; repli sur l'ancien champ du prospect si besoin.
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [envoi] = await db.select().from(devisEnvois).where(eq(devisEnvois.token, token)).limit(1);
  let clientName = "";
  let devisUrl: string | null = null;
  let montantCt: number | null = null;
  let decision: string | null = null;

  if (envoi) {
    const [lead] = await db.select({ name: leads.name }).from(leads).where(eq(leads.id, envoi.leadId)).limit(1);
    clientName = lead?.name ?? "";
    devisUrl = envoi.url;
    montantCt = envoi.montantCt;
    decision = envoi.decision;
  } else {
    const [lead] = await db.select().from(leads).where(eq(leads.devisToken, token)).limit(1);
    if (lead) {
      clientName = lead.name;
      devisUrl = lead.devisUrl;
      montantCt = lead.montantDevisCt;
      decision = lead.devisDecision;
    }
  }

  if (!devisUrl) notFound();

  return (
    <DevisDecisionClient
      token={token}
      clientName={clientName}
      devisUrl={devisUrl}
      montant={montantCt != null ? montantCt / 100 : null}
      decision={decision}
    />
  );
}

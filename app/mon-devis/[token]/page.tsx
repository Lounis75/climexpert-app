import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DevisDecisionClient from "@/components/DevisDecisionClient";

export const dynamic = "force-dynamic";

// Page PUBLIQUE : le client ouvre le lien reçu par e-mail, lit son devis (PDF) et répond
// (accepter / décliner en 1 clic). Réservée aux devis "PDF externe" envoyés depuis un prospect.
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [lead] = await db.select().from(leads).where(eq(leads.devisToken, token)).limit(1);
  if (!lead || !lead.devisUrl) notFound();

  return (
    <DevisDecisionClient
      token={token}
      clientName={lead.name}
      devisUrl={lead.devisUrl}
      montant={lead.montantDevisCt ? lead.montantDevisCt / 100 : null}
      decision={lead.devisDecision ?? null}
    />
  );
}

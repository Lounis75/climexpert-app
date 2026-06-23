import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SignContratClient from "@/components/SignContratClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db
    .select({ contrat: contratsEntretien, client: clients })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(eq(contratsEntretien.signatureToken, token))
    .limit(1);
  if (!row || !row.client) notFound();

  return (
    <SignContratClient
      token={token}
      alreadySigned={!!row.contrat.signeLe}
      clientName={row.client.name}
      numero={row.contrat.numero ?? ""}
      prixAn={row.contrat.prixUnitaireCt / 100}
      units={row.contrat.units}
    />
  );
}

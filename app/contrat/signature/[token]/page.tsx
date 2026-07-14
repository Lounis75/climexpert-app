import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { entretienAffichage } from "@/lib/contrat-pricing";
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

  // Le montant affiché suit la grille réelle (unités intérieures + groupes extérieurs) et la base du
  // client : une entreprise raisonne en HT. Sans ça, la page annonçait le TTC de référence alors que
  // l'e-mail de demande de signature annonçait du HT.
  const aff = entretienAffichage({
    withContract: true,
    pro: row.client.typeClient === "professionnel",
    units: row.contrat.units,
    unitsExterieures: row.contrat.unitsExterieures,
  });

  return (
    <SignContratClient
      token={token}
      alreadySigned={!!row.contrat.signeLe}
      clientName={row.client.name}
      numero={row.contrat.numero ?? ""}
      prixAn={aff.montant}
      base={aff.base}
      units={row.contrat.units}
      unitsExt={row.contrat.unitsExterieures}
    />
  );
}

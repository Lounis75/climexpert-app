import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import EntretienClient from "./EntretienClient";

export const dynamic = "force-dynamic";

// Souscription au contrat d'entretien. Le tarif dépend du TYPE DE CLIENT : une entreprise se voit
// annoncer du HORS TAXES (elle récupère la TVA), un particulier du TTC. On résout donc le client
// côté serveur avant d'afficher le moindre prix, sinon on montrerait un tarif particulier à un pro.
export default async function EntretienPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [client] = await db.select({ typeClient: clients.typeClient })
    .from(clients)
    .where(and(eq(clients.clientToken, token), isNull(clients.supprimeLe)))
    .limit(1);
  if (!client) notFound();

  return <EntretienClient token={token} pro={client.typeClient === "professionnel"} />;
}

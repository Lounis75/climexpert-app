import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, interventions } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { r2GetBytes, r2KeyFromUrl } from "@/lib/r2";

export const runtime = "nodejs";

// Sert la facture (PDF) d'un client via SON lien d'espace personnel (token), sans jamais exposer
// l'URL publique brute du fichier R2. On vérifie que la facture appartient bien au client du token,
// puis on streame le PDF. Facile côté client (un clic depuis le portail, pas d'expiration).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;

  const [client] = await db.select({ id: clients.id })
    .from(clients).where(and(eq(clients.clientToken, token), isNull(clients.supprimeLe))).limit(1);
  if (!client) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  const [iv] = await db.select({ factureUrl: interventions.factureUrl, factureEnvoyeeLe: interventions.factureEnvoyeeLe })
    .from(interventions)
    .where(and(eq(interventions.id, id), eq(interventions.clientId, client.id), isNull(interventions.supprimeLe)))
    .limit(1);
  // La facture doit exister ET avoir été envoyée au client (sinon elle n'est pas censée être visible).
  if (!iv?.factureUrl || !iv.factureEnvoyeeLe) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const key = r2KeyFromUrl(iv.factureUrl);
  const file = key ? await r2GetBytes(key) : null;
  if (!file) return NextResponse.json({ error: "Document indisponible" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType.includes("pdf") ? "application/pdf" : file.contentType,
      "Content-Disposition": "inline; filename=\"facture-climexpert.pdf\"",
      "Cache-Control": "private, no-store",
    },
  });
}

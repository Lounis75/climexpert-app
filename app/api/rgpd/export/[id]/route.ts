import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, interventions, devis, factures, savTickets, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdminRequest } from "@/lib/admin-guard";

// RGPD data portability — returns all personal data for a client as JSON
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [devisList, facturesList, interventionsList, savList, suivisList] = await Promise.all([
    db.select().from(devis).where(eq(devis.clientId, id)),
    db.select().from(factures).where(eq(factures.clientId, id)),
    db.select().from(interventions).where(eq(interventions.clientId, id)),
    db.select().from(savTickets).where(eq(savTickets.clientId, id)),
    db.select().from(suivis).where(eq(suivis.clientId, id)),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      city: client.city,
      createdAt: client.createdAt,
    },
    devis:         devisList,
    factures:      facturesList,
    interventions: interventionsList,
    sav:           savList,
    suivis:        suivisList,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="donnees-client-${id}.json"`,
    },
  });
}

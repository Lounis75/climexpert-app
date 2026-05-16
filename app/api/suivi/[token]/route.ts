import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, interventions, factures, savTickets, rapportsIntervention, techniciens } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.clientToken, token), isNull(clients.supprimeLe)))
    .limit(1);

  if (!client) return NextResponse.json({ error: "Token invalide" }, { status: 404 });

  const [allInterventions, allFactures, allTickets] = await Promise.all([
    db
      .select({
        id:          interventions.id,
        type:        interventions.type,
        status:      interventions.status,
        scheduledAt: interventions.scheduledAt,
        address:     interventions.address,
        notes:       interventions.notes,
        techName:    techniciens.name,
      })
      .from(interventions)
      .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
      .where(and(eq(interventions.clientId, client.id), isNull(interventions.supprimeLe)))
      .orderBy(desc(interventions.scheduledAt))
      .limit(10),

    db
      .select({
        id:         factures.id,
        number:     factures.number,
        totalTtcCt: factures.totalTtcCt,
        status:     factures.status,
        paidAt:     factures.paidAt,
        createdAt:  factures.createdAt,
      })
      .from(factures)
      .where(eq(factures.clientId, client.id))
      .orderBy(desc(factures.createdAt))
      .limit(10),

    db
      .select({
        id:          savTickets.id,
        status:      savTickets.status,
        subject:     savTickets.subject,
        description: savTickets.description,
        createdAt:   savTickets.createdAt,
      })
      .from(savTickets)
      .where(eq(savTickets.clientId, client.id))
      .orderBy(desc(savTickets.createdAt))
      .limit(5),
  ]);

  return NextResponse.json({
    client: {
      name:               client.name,
      equipementInstalle: client.equipementInstalle,
      marqueModele:       client.marqueModele,
      dateInstallation:   client.dateInstallation,
      garantieExpireLe:   client.garantieExpireLe,
    },
    interventions: allInterventions,
    factures: allFactures,
    savTickets: allTickets,
  });
}

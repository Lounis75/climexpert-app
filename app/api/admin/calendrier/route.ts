import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, techniciens, periodesCapacite, leads, disponibilitesBloquees } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end   = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start et end requis" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate   = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const [rows, techRows, periodes, indispoRows] = await Promise.all([
    db
      .select({
        id:            interventions.id,
        type:          interventions.type,
        status:        interventions.status,
        scheduledAt:   interventions.scheduledAt,
        address:       interventions.address,
        technicienId:  interventions.technicienId,
        duree:         interventions.dureeEstimeeMinutes,
        clientName:    clients.name,
        technicienName: techniciens.name,
      })
      .from(interventions)
      .leftJoin(clients,     eq(interventions.clientId,     clients.id))
      .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
      .where(
        and(
          gte(interventions.scheduledAt, startDate),
          lte(interventions.scheduledAt, endDate),
          isNull(interventions.supprimeLe),
        ),
      ),
    db.select({ id: techniciens.id, name: techniciens.name, color: techniciens.color, role: techniciens.role })
      .from(techniciens).where(isNull(techniciens.supprimeLe)),
    db.select().from(periodesCapacite),
    // Indisponibilités (congés, créneaux off) chevauchant la fenêtre affichée.
    db.select().from(disponibilitesBloquees).where(and(
      gte(disponibilitesBloquees.dateFin, startDate),
      lte(disponibilitesBloquees.dateDebut, endDate),
    )),
  ]);

  // Évènements commerciaux du planning, dans la plage : les RDV pris (rdvDate, créneau 2h) et
  // les Visites client (visiteClientLe, créneau 1h, indépendantes du statut). Fusionnés dans `rdvs`.
  const [rdvRows, visiteRows] = await Promise.all([
    db.select({ id: leads.id, clientName: leads.name, rdvDate: leads.rdvDate, commercialId: leads.commercialId, commercialName: techniciens.name })
      .from(leads).leftJoin(techniciens, eq(leads.commercialId, techniciens.id))
      .where(and(gte(leads.rdvDate, startDate), lte(leads.rdvDate, endDate), isNull(leads.supprimeLe), isNull(leads.archiveLe), ne(leads.status, "perdu"))),
    db.select({ id: leads.id, clientName: leads.name, visiteClientLe: leads.visiteClientLe, commercialId: leads.commercialId, commercialName: techniciens.name })
      .from(leads).leftJoin(techniciens, eq(leads.commercialId, techniciens.id))
      .where(and(gte(leads.visiteClientLe, startDate), lte(leads.visiteClientLe, endDate), isNull(leads.supprimeLe), isNull(leads.archiveLe), ne(leads.status, "perdu"))),
  ]);

  const rdvs = [
    ...rdvRows.map((r) => ({ id: r.id, leadId: r.id, clientName: r.clientName, rdvDate: r.rdvDate, commercialId: r.commercialId, commercialName: r.commercialName, kind: "rdv" as const, duree: 120 })),
    ...visiteRows.map((r) => ({ id: `${r.id}::v`, leadId: r.id, clientName: r.clientName, rdvDate: r.visiteClientLe, commercialId: r.commercialId, commercialName: r.commercialName, kind: "visite" as const, duree: 60 })),
  ];

  return NextResponse.json({ interventions: rows, techniciens: techRows, periodes, rdvs, indispos: indispoRows });
}

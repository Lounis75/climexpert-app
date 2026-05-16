import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, techniciens, periodesCapacite } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

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

  const [rows, techRows, periodes] = await Promise.all([
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
    db.select({ id: techniciens.id, name: techniciens.name, color: techniciens.color }).from(techniciens),
    db.select().from(periodesCapacite),
  ]);

  return NextResponse.json({ interventions: rows, techniciens: techRows, periodes });
}

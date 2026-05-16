import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, techniciens } from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, desc } from "drizzle-orm";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";

async function getSession(req: NextRequest) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyTechnicienToken(token);
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "upcoming"; // upcoming | today | past | all

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(startOfDay.getTime() + 86400000 - 1);

  const rows = await db
    .select({
      id:                  interventions.id,
      type:                interventions.type,
      status:              interventions.status,
      scheduledAt:         interventions.scheduledAt,
      completedAt:         interventions.completedAt,
      address:             interventions.address,
      codePostal:          interventions.codePostal,
      notes:               interventions.notes,
      dureeEstimeeMinutes: interventions.dureeEstimeeMinutes,
      dureeReelleMinutes:  interventions.dureeReelleMinutes,
      clientId:            interventions.clientId,
      clientName:          clients.name,
      clientPhone:         clients.phone,
      clientEmail:         clients.email,
      equipement:          clients.equipementInstalle,
      marqueModele:        clients.marqueModele,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(
      and(
        eq(interventions.technicienId, session.sub),
        isNull(interventions.supprimeLe),
        filter === "today"
          ? and(gte(interventions.scheduledAt, startOfDay), lte(interventions.scheduledAt, endOfDay))
          : filter === "upcoming"
          ? gte(interventions.scheduledAt, startOfDay)
          : filter === "past"
          ? lte(interventions.scheduledAt, now)
          : undefined
      )
    )
    .orderBy(desc(interventions.scheduledAt));

  return NextResponse.json(rows);
}

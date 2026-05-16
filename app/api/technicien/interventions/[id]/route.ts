import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, rapportsIntervention } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const [row] = await db
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
      technicienId:        interventions.technicienId,
      clientId:            interventions.clientId,
      clientName:          clients.name,
      clientPhone:         clients.phone,
      clientEmail:         clients.email,
      clientAddress:       clients.address,
      equipement:          clients.equipementInstalle,
      marqueModele:        clients.marqueModele,
      dateInstallation:    clients.dateInstallation,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(
      and(
        eq(interventions.id, id),
        eq(interventions.technicienId, session.sub),
        isNull(interventions.supprimeLe)
      )
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [rapport] = await db
    .select()
    .from(rapportsIntervention)
    .where(eq(rapportsIntervention.interventionId, id))
    .limit(1);

  return NextResponse.json({ ...row, rapport: rapport ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["en_cours", "terminée"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  await db
    .update(interventions)
    .set({ status, updatedAt: new Date(), ...(status === "terminée" ? { completedAt: new Date() } : {}) })
    .where(and(eq(interventions.id, id), eq(interventions.technicienId, session.sub)));

  return NextResponse.json({ ok: true });
}

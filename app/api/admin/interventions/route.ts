import { NextRequest, NextResponse } from "next/server";
import { getInterventions, createIntervention } from "@/lib/interventions";
import { sendInterventionConfirmation } from "@/lib/intervention-mail";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ interventions: await getInterventions() });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, type, scheduledAt, technicienId, devisId, address, notes, sousContrat, dureeEstimeeMinutes, chantierId, siteNom, siteAdresse } = body;
    if (!clientId || !type || !scheduledAt) {
      return NextResponse.json({ error: "clientId, type et scheduledAt requis" }, { status: 400 });
    }
    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: `Date invalide: "${scheduledAt}"` }, { status: 400 });
    }
    const duree = Number(dureeEstimeeMinutes);
    const i = await createIntervention({
      clientId,
      type,
      scheduledAt: parsedDate,
      dureeEstimeeMinutes: Number.isFinite(duree) && duree > 0 ? Math.round(duree) : 120,
      technicienId: technicienId || null,
      devisId: devisId || null,
      address: address || null,
      notes: notes || null,
      sousContrat: typeof sousContrat === "boolean" ? sousContrat : null,
      chantierId: chantierId || null,
      siteNom: siteNom || null,
      siteAdresse: siteAdresse || null,
      status: "planifiée",
    });
    // Confirmation au client (best-effort : ne bloque pas la planification si l'e-mail échoue).
    await sendInterventionConfirmation({ clientId, type, start: parsedDate, dureeMin: Number.isFinite(duree) && duree > 0 ? Math.round(duree) : 120, address: address || null });
    return NextResponse.json({ intervention: i }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/interventions]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

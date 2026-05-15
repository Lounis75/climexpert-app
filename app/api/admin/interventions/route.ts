import { NextRequest, NextResponse } from "next/server";
import { getInterventions, createIntervention } from "@/lib/interventions";

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
    const { clientId, type, scheduledAt, technicienId, devisId, address, notes } = body;
    if (!clientId || !type || !scheduledAt) {
      return NextResponse.json({ error: "clientId, type et scheduledAt requis" }, { status: 400 });
    }
    const i = await createIntervention({
      clientId,
      type,
      scheduledAt: new Date(scheduledAt),
      technicienId: technicienId || null,
      devisId: devisId || null,
      address: address || null,
      notes: notes || null,
      status: "planifiée",
    });
    return NextResponse.json({ intervention: i }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

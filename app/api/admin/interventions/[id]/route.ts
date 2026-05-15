import { NextRequest, NextResponse } from "next/server";
import { updateInterventionStatus, updateInterventionNotes, deleteIntervention } from "@/lib/interventions";
import type { Intervention } from "@/lib/interventions";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.status) {
      const i = await updateInterventionStatus(id, body.status as Intervention["status"]);
      if (!i) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      return NextResponse.json({ intervention: i });
    }
    if (body.notes !== undefined) {
      await updateInterventionNotes(id, body.notes);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteIntervention(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

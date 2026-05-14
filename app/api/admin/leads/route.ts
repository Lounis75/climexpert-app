import { NextRequest, NextResponse } from "next/server";
import { updateLead, deleteLead } from "@/lib/leads";
import type { LeadStatus } from "@/lib/leads";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    // Accepte n'importe quelle combinaison de champs : notes, status, clientId...
    const allowed: Record<string, unknown> = {};
    if (fields.notes !== undefined) allowed.notes = fields.notes;
    if (fields.status)              allowed.status = fields.status as LeadStatus;
    if (fields.clientId)            allowed.clientId = fields.clientId;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    const lead = await updateLead(id, allowed);
    if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    await deleteLead(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

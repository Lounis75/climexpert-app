import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus, updateLead, deleteLead, LeadStatus } from "@/lib/leads";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    if (body.notes !== undefined) {
      const lead = await updateLead(id, { notes: body.notes });
      if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
      return NextResponse.json({ lead });
    }

    if (!body.status) return NextResponse.json({ error: "status requis" }, { status: 400 });
    const lead = await updateLeadStatus(id, body.status as LeadStatus);
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

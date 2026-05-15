import { NextRequest, NextResponse } from "next/server";
import { updateFactureStatus, deleteFacture } from "@/lib/factures";
import type { Facture } from "@/lib/factures";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!status) return NextResponse.json({ error: "status requis" }, { status: 400 });
    const f = await updateFactureStatus(id, status as Facture["status"]);
    if (!f) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    return NextResponse.json({ facture: f });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteFacture(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

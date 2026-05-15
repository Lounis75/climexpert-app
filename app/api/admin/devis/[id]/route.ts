import { NextRequest, NextResponse } from "next/server";
import { getDevisById, updateDevisStatus, deleteDevis } from "@/lib/devis";
import type { Devis } from "@/lib/devis";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const d = await getDevisById(id);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    return NextResponse.json({ devis: d });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!status) return NextResponse.json({ error: "status requis" }, { status: 400 });
    const d = await updateDevisStatus(id, status as Devis["status"]);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    return NextResponse.json({ devis: d });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteDevis(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

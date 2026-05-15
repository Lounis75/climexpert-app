import { NextRequest, NextResponse } from "next/server";
import { getDevis, createDevis } from "@/lib/devis";

export async function GET() {
  try {
    const rows = await getDevis();
    return NextResponse.json({ devis: rows });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, description, validUntil, lignes } = await req.json();
    if (!clientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });
    if (!lignes?.length) return NextResponse.json({ error: "Au moins une ligne requise" }, { status: 400 });
    const d = await createDevis({ clientId, description, validUntil }, lignes);
    return NextResponse.json({ devis: d }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

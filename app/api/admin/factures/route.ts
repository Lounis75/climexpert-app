import { NextRequest, NextResponse } from "next/server";
import { getFactures, createFactureFromDevis } from "@/lib/factures";

export async function GET() {
  try {
    const rows = await getFactures();
    return NextResponse.json({ factures: rows });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { devisId } = await req.json();
    if (!devisId) return NextResponse.json({ error: "devisId requis" }, { status: 400 });
    const f = await createFactureFromDevis(devisId);
    return NextResponse.json({ facture: f }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

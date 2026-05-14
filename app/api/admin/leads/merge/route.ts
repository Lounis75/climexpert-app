import { NextRequest, NextResponse } from "next/server";
import { mergeLeads } from "@/lib/leads";

export async function POST(req: NextRequest) {
  try {
    const { masterId, duplicateId } = await req.json();
    if (!masterId || !duplicateId) {
      return NextResponse.json({ error: "masterId et duplicateId requis" }, { status: 400 });
    }
    if (masterId === duplicateId) {
      return NextResponse.json({ error: "Les deux IDs doivent être différents" }, { status: 400 });
    }
    const lead = await mergeLeads(masterId, duplicateId);
    if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

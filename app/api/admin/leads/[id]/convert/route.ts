import { NextRequest, NextResponse } from "next/server";
import { createClientFromLead } from "@/lib/clients";

// Convertit un prospect en client : copie TOUTES ses données (adresse, ville, notes
// enrichies…), lie le lead et le marque "gagné". Idempotent (réutilise le client
// existant si déjà converti) → aucun risque de doublon.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await createClientFromLead(id);
    if (!client) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    return NextResponse.json({ client });
  } catch (e) {
    console.error("convert lead error:", e);
    return NextResponse.json({ error: "Erreur lors de la conversion" }, { status: 500 });
  }
}

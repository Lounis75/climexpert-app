import { NextRequest, NextResponse } from "next/server";
import { getDevis, createDevis, updateDevisEnvoi } from "@/lib/devis";

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
    const { clientId, leadId, description, validUntil, lignes, fichierUrl } = await req.json();
    if (!clientId && !leadId) return NextResponse.json({ error: "Un prospect ou un client est requis" }, { status: 400 });
    if (!lignes?.length) return NextResponse.json({ error: "Au moins une ligne requise" }, { status: 400 });
    const d = await createDevis({ clientId, leadId, description, validUntil }, lignes);
    // PDF déposé à la création (devis simple) : on l'attache.
    if (fichierUrl) await updateDevisEnvoi(d.id, { fichierUrl });
    return NextResponse.json({ devis: { ...d, fichierUrl: fichierUrl ?? d.fichierUrl } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDevisByToken, updateDevisStatus } from "@/lib/devis";
import { acceptDevis } from "@/lib/devis-workflow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { action } = await req.json();

    if (action !== "accepté" && action !== "refusé") {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const d = await getDevisByToken(token);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

    if (d.status !== "envoyé") {
      return NextResponse.json({ error: "Ce devis ne peut plus être modifié" }, { status: 409 });
    }

    if (action === "accepté") {
      // Signature : passe accepté + crée l'intervention à planifier + notifie
      await acceptDevis(d.id);
    } else {
      await updateDevisStatus(d.id, action);
    }
    return NextResponse.json({ success: true, status: action });
  } catch (err) {
    console.error("Devis respond error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { demanderSignatureContrat } from "@/lib/contrat-signature";

const MESSAGES: Record<string, { msg: string; status: number }> = {
  introuvable:  { msg: "Contrat introuvable", status: 404 },
  deja_signe:   { msg: "Ce contrat est déjà signé", status: 400 },
  no_email:     { msg: "Ce client n'a pas d'adresse e-mail", status: 400 },
  echec_email:  { msg: "Échec de l'envoi de l'e-mail", status: 500 },
};

// Génère un lien de signature unique et l'envoie au client par e-mail.
// La logique est dans lib/contrat-signature (partagée avec la clôture d'intervention du technicien,
// qui propose la même chose sur le terrain quand le client n'est pas là pour signer).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await demanderSignatureContrat(id);
  if (!r.ok) {
    const e = MESSAGES[r.reason] ?? { msg: "Échec de la demande de signature", status: 500 };
    return NextResponse.json({ error: e.msg }, { status: e.status });
  }
  return NextResponse.json({ ok: true });
}

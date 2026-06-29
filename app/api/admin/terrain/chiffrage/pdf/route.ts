import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { computeDevisLignes, clientAddressLine, renderDevisPdf, type RawLine } from "@/lib/devis-pdf";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Aperçu / téléchargement du PDF de devis SANS l'envoyer (remplace l'impression HTML, qui sortait
// une page blanche). Rend exactement le même document que l'e-mail, avec un numéro provisoire pour
// ne pas consommer la séquence officielle (le vrai numéro est attribué à l'envoi).
export async function POST(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const client = body.client ?? {};
  const rawLines: RawLine[] = Array.isArray(body.lignes) ? body.lignes : [];
  const clientType = body.clientType === "pro" ? "pro" : "particulier";
  if (rawLines.length === 0) return NextResponse.json({ error: "Aucune ligne de devis." }, { status: 400 });

  try {
    const { lignes, totalHtCt, totalTtcCt } = computeDevisLignes(rawLines, clientType);
    const created = new Date();
    const valid = new Date(created.getTime() + 30 * 86400000);
    const buf = await renderDevisPdf({
      number: "Aperçu (avant envoi)",
      createdAt: created.toISOString(),
      validUntil: valid.toISOString(),
      clientName: String(client.nom ?? client.entreprise ?? "").trim() || "Client",
      clientAddress: clientAddressLine(client) || null,
      description: String(body.description ?? "").trim() || null,
      lignes, totalHtCt, totalTtcCt,
    });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"devis-climexpert-apercu.pdf\"",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    logError("chiffrage.pdf.apercu", e);
    return NextResponse.json({ error: "Échec de la génération du PDF." }, { status: 500 });
  }
}

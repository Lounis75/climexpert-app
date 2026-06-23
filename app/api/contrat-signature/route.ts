import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateContratPDF } from "@/lib/contrat-pdf";
import { buildContratData, finalizeContrat } from "@/lib/contrat-finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route PUBLIQUE (signature à distance par le client, via un token). Aucune session requise.
async function lookup(token: string) {
  const [row] = await db
    .select({ contrat: contratsEntretien, client: clients })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(eq(contratsEntretien.signatureToken, token))
    .limit(1);
  return row && row.client ? row : null;
}

// Aperçu du contrat (PDF non signé) pour que le client le lise avant de signer.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });
  const row = await lookup(token);
  if (!row) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  const pdf = await generateContratPDF(buildContratData(row.contrat, row.client!));
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=\"contrat-entretien.pdf\"", "Cache-Control": "no-store" },
  });
}

// Signature du client : génère le PDF signé (gérant pré-signé + client), le stocke + l'envoie,
// marque le contrat comme signé avec une piste d'audit (date + IP).
export async function POST(req: NextRequest) {
  const { token, signature } = await req.json().catch(() => ({}));
  if (!token || !signature) return NextResponse.json({ error: "Token et signature requis" }, { status: 400 });
  const row = await lookup(token);
  if (!row) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  if (row.contrat.signeLe) return NextResponse.json({ error: "Ce contrat est déjà signé" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await db.update(contratsEntretien)
    .set({ signeLe: new Date(), signatureIp: ip })
    .where(eq(contratsEntretien.id, row.contrat.id));

  // PDF signé -> R2 + documents de la fiche client + e-mail au client. N'échoue pas la signature.
  try {
    await finalizeContrat({ contrat: row.contrat, client: row.client!, clientSignatureDataUrl: signature });
  } catch (e) {
    console.error("[contrat-signature] finalize:", e);
  }
  return NextResponse.json({ ok: true });
}

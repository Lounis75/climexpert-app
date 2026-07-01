import { NextRequest, NextResponse } from "next/server";
import { generateCerfaPDF, type CerfaData } from "@/lib/cerfa-pdf";
import { getCerfaSignatureContext, finalizeCerfaFromSignature } from "@/lib/cerfa";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC (jeton) : aperçu de l'attestation (non signée par le client) pour qu'il la lise avant de signer.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = await getCerfaSignatureContext(token);
  if (!ctx) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  const pdf = await generateCerfaPDF(ctx.rapport.cerfaData as CerfaData);
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=\"attestation-entretien.pdf\"", "Cache-Control": "no-store" },
  });
}

// PUBLIC (jeton) : le client signe -> on appose sa signature, génère le PDF officiel, l'envoie, et
// marque le rapport signé (piste d'audit : date + IP).
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!rateLimit(`attestation:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }
  const { signature } = await req.json().catch(() => ({}));
  if (!signature || typeof signature !== "string") return NextResponse.json({ error: "Signature requise." }, { status: 400 });

  try {
    const res = await finalizeCerfaFromSignature(token, signature, clientIp(req));
    if (!res.ok) {
      if (res.reason === "already_signed") return NextResponse.json({ error: "Cette attestation a déjà été signée." }, { status: 409 });
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("attestation.sign", e);
    return NextResponse.json({ error: "La signature n'a pas pu être enregistrée, réessayez." }, { status: 500 });
  }
}

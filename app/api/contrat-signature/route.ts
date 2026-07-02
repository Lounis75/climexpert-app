import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contratsEntretien, clients, notifications } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { generateContratPDF } from "@/lib/contrat-pdf";
import { buildContratData, finalizeContrat } from "@/lib/contrat-finalize";
import { logError } from "@/lib/observability";

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

  // Réservation ATOMIQUE : seul le premier clic passe signe_le de NULL à maintenant. Un double
  // clic simultané passait la garde de lecture des deux côtés et finalisait deux fois (2 PDF,
  // 2 e-mails, 2 lignes documents).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const [claimed] = await db.update(contratsEntretien)
    .set({ signeLe: new Date(), signatureIp: ip })
    .where(and(eq(contratsEntretien.id, row.contrat.id), isNull(contratsEntretien.signeLe)))
    .returning({ id: contratsEntretien.id });
  if (!claimed) return NextResponse.json({ ok: true, deja: true });

  // PDF signé -> R2 + documents de la fiche client + e-mail au client. N'échoue pas la signature,
  // mais alerte le gérant : sinon le contrat est "signé" sans PDF et personne ne le sait.
  try {
    await finalizeContrat({ contrat: row.contrat, client: row.client!, clientSignatureDataUrl: signature });
  } catch (e) {
    logError("contratSignature.finalize", e, { contratId: row.contrat.id });
    await db.insert(notifications).values({
      id: createId(), type: "escalade_client",
      titre: "⚠️ Contrat signé à distance mais PDF non généré",
      contenu: `${row.client?.name ?? "Client"} a signé son contrat d'entretien en ligne mais la génération/l'envoi du PDF a échoué. Régénérez-le depuis la fiche client.`,
      refType: "contrat", refId: row.contrat.id,
    }).catch((e2) => logError("contratSignature.notif", e2, { contratId: row.contrat.id }));
  }
  return NextResponse.json({ ok: true });
}

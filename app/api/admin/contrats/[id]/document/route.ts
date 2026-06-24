import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contratsEntretien, clients, documents } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateContratPDF } from "@/lib/contrat-pdf";
import { buildContratData } from "@/lib/contrat-finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Génère le contrat d'entretien en PDF (pré-rempli depuis le client + le contrat).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ contrat: contratsEntretien, client: clients })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(eq(contratsEntretien.id, id))
    .limit(1);

  if (!row || !row.client) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }
  const { contrat, client } = row;

  // Contrat signé : on sert la VRAIE version signée des deux parties (gérant + client),
  // stockée sur R2, au lieu de régénérer un PDF avec la case client vide.
  if (contrat.signeLe) {
    let signedUrl = contrat.pdfSigneUrl;
    if (!signedUrl) {
      // Compat : contrats signés avant l'ajout de pdfSigneUrl -> dernier document "contrat" du client.
      const [doc] = await db
        .select({ url: documents.url })
        .from(documents)
        .where(and(eq(documents.clientId, client.id), eq(documents.type, "contrat")))
        .orderBy(desc(documents.createdAt))
        .limit(1);
      signedUrl = doc?.url ?? null;
    }
    if (signedUrl) return NextResponse.redirect(signedUrl);
  }

  // Aperçu/admin (contrat non signé) : pré-signé par le gérant, case client vide (signée sur place).
  const data = buildContratData(contrat, client);

  try {
    const pdf = await generateContratPDF(data);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="contrat-${contrat.numero ?? id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[contrat document]", e);
    return NextResponse.json({ error: "Échec de génération du PDF" }, { status: 500 });
  }
}

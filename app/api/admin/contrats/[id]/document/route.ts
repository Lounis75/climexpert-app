import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  // Aperçu/admin : contrat pré-signé par le gérant, case client vide (signée sur place).
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

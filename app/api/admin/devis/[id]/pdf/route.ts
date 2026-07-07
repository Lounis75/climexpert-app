import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getDevisById, tauxTvaLigne } from "@/lib/devis";
import DevisPDF from "@/components/pdf/DevisPDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const d = await getDevisById(id);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

    // Totaux stockés en priorité ; recalcul via tauxTvaLigne (repli 5,5 %, jamais 0) à défaut.
    const totalHtCt = d.totalHtCt ?? d.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireCt, 0);
    const totalTtcCt = d.totalTtcCt ?? d.lignes.reduce((s, l) => {
      const ht = l.quantite * l.prixUnitaireCt;
      return s + ht + Math.round(ht * (tauxTvaLigne(l.tvaRate) / 100));
    }, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(DevisPDF as any, {
      number: d.number,
      createdAt: new Date(d.createdAt).toISOString(),
      validUntil: d.validUntil ?? null,
      clientName: d.clientName ?? "-",
      description: d.description ?? null,
      lignes: d.lignes.map((l) => ({
        id: l.id,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaireCt: l.prixUnitaireCt,
        tvaRate: String(l.tvaRate ?? "10"),
      })),
      totalHtCt,
      totalTtcCt,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${d.number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF devis error:", err);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}

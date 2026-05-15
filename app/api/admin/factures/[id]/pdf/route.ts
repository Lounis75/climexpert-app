import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getFactureById } from "@/lib/factures";
import FacturePDF from "@/components/pdf/FacturePDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const f = await getFactureById(id);
    if (!f) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(FacturePDF as any, {
      number: f.number,
      createdAt: new Date(f.createdAt).toISOString(),
      dueDate: f.dueDate ?? null,
      paidAt: f.paidAt ? new Date(f.paidAt).toISOString() : null,
      clientName: f.clientName,
      devisNumber: f.devisNumber,
      totalHtCt: f.totalHtCt,
      totalTtcCt: f.totalTtcCt,
      tvaRate: String(f.tvaRate ?? "10"),
      status: f.status,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${f.number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF facture error:", err);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}

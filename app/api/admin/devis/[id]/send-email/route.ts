import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Resend } from "resend";
import { getDevisById, centimesToEuros } from "@/lib/devis";
import DevisPDF from "@/components/pdf/DevisPDF";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const d = await getDevisById(id);
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    if (!d.clientEmail) return NextResponse.json({ error: "Ce client n'a pas d'email" }, { status: 400 });

    const totalHtCt = d.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireCt, 0);
    const totalTtcCt = d.lignes.reduce((s, l) => {
      const ht = l.quantite * l.prixUnitaireCt;
      return s + ht + Math.round(ht * (Number(l.tvaRate) / 100));
    }, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(DevisPDF as any, {
      number: d.number,
      createdAt: new Date(d.createdAt).toISOString(),
      validUntil: d.validUntil ?? null,
      clientName: d.clientName ?? "—",
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "ClimExpert <onboarding@resend.dev>",
      to: [d.clientEmail],
      subject: `Votre devis ${d.number} — ClimExpert`,
      attachments: [
        {
          filename: `${d.number}.pdf`,
          content: Buffer.from(buffer).toString("base64"),
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
          <div style="background: #0B1120; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: #38BDF8; margin: 0; font-size: 20px;">Votre devis ClimExpert</h1>
            <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">${d.number}</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
            <p style="color: #0F172A; margin: 0 0 12px; font-size: 15px;">Bonjour ${d.clientName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Veuillez trouver ci-joint votre devis <strong>${d.number}</strong>
              d'un montant de <strong>${centimesToEuros(totalTtcCt)} TTC</strong>.
            </p>
            ${d.validUntil ? `<p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Ce devis est valable jusqu'au <strong>${new Date(d.validUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>` : ""}
            <p style="color: #475569; font-size: 14px; margin: 0;">
              Pour l'accepter, il vous suffit de nous retourner le document signé avec la mention <em>«&nbsp;Bon pour accord&nbsp;»</em>.
            </p>
          </div>

          <div style="background: #0EA5E9; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: white; font-size: 14px; font-weight: bold;">Une question ? Appelez-nous</p>
            <a href="tel:0667432767" style="display: inline-block; margin-top: 8px; background: white; color: #0EA5E9; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
              06 67 43 27 67
            </a>
          </div>

          <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 16px;">
            CLIM EXPERT SAS · 200 rue de la Croix Nivert, 75015 Paris
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send email devis error:", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

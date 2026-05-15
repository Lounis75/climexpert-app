import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Resend } from "resend";
import { getFactureById, centimesToEuros } from "@/lib/factures";
import FacturePDF from "@/components/pdf/FacturePDF";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const f = await getFactureById(id);
    if (!f) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

    // Récupérer l'email du client
    const { db } = await import("@/lib/db");
    const { clients } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const [client] = await db.select({ email: clients.email }).from(clients).where(eq(clients.id, f.clientId));

    if (!client?.email) return NextResponse.json({ error: "Ce client n'a pas d'email" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(FacturePDF as any, {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = f.status === "payée"
      ? `Votre reçu ${f.number} — ClimExpert`
      : `Votre facture ${f.number} — ClimExpert`;

    await resend.emails.send({
      from: "ClimExpert <onboarding@resend.dev>",
      to: [client.email],
      subject,
      attachments: [
        {
          filename: `${f.number}.pdf`,
          content: Buffer.from(buffer).toString("base64"),
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
          <div style="background: #0B1120; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: #34D399; margin: 0; font-size: 20px;">${f.status === "payée" ? "✓ Reçu de paiement" : "Votre facture ClimExpert"}</h1>
            <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">${f.number}</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
            <p style="color: #0F172A; margin: 0 0 12px; font-size: 15px;">Bonjour ${f.clientName},</p>
            ${f.status === "payée"
              ? `<p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                  Nous vous confirmons la bonne réception de votre règlement de <strong>${centimesToEuros(f.totalTtcCt)} TTC</strong>.
                  Vous trouverez votre reçu en pièce jointe.
                </p>`
              : `<p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                  Veuillez trouver ci-joint votre facture <strong>${f.number}</strong>
                  d'un montant de <strong>${centimesToEuros(f.totalTtcCt)} TTC</strong>.
                </p>
                ${f.dueDate ? `<p style="color: #475569; font-size: 14px; margin: 0 0 16px;">
                  Date d'échéance : <strong>${new Date(f.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>
                </p>` : ""}
                <p style="color: #475569; font-size: 14px; margin: 0;">
                  Règlement par virement, chèque ou espèces à l'ordre de <strong>CLIM EXPERT SAS</strong>.
                </p>`
            }
          </div>

          <div style="background: #059669; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: white; font-size: 14px; font-weight: bold;">Une question ?</p>
            <a href="tel:0667432767" style="display: inline-block; margin-top: 8px; background: white; color: #059669; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
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
    console.error("Send email facture error:", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

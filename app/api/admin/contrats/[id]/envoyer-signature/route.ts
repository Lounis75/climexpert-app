import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";

// Génère un lien de signature unique et l'envoie au client par e-mail.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ contrat: contratsEntretien, client: clients })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(eq(contratsEntretien.id, id))
    .limit(1);
  if (!row || !row.client) return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  if (row.contrat.signeLe) return NextResponse.json({ error: "Ce contrat est déjà signé" }, { status: 400 });
  if (!row.client.email) return NextResponse.json({ error: "Ce client n'a pas d'adresse e-mail" }, { status: 400 });

  const token = randomBytes(32).toString("hex");
  await db.update(contratsEntretien)
    .set({ signatureToken: token, signatureDemandeeLe: new Date() })
    .where(eq(contratsEntretien.id, id));

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/contrat/signature/${token}`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: process.env.EMAIL_TEST_OVERRIDE || row.client.email,
      subject: "Votre contrat d'entretien à signer, ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${row.client.name},</h2>
        <p>Votre <strong>contrat d'entretien annuel</strong> est prêt. Il ne vous reste qu'à le signer en ligne, en 2 minutes, depuis votre téléphone ou votre ordinateur.</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Lire et signer mon contrat</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer. Une fois signé, le contrat vous est renvoyé automatiquement et déposé sur votre espace client.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe Clim Expert</p>
      </div>`,
    });
  } catch (e) {
    console.error("[envoyer-signature]", e);
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

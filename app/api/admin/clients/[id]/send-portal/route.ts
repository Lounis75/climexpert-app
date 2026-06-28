import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// Envoie au client l'accès à son espace client (lien tokenisé /suivi/[token]). Crée le
// token s'il manque (anciens clients). Déclenché par le bouton "Envoyer l'accès" sur la fiche.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (!client.email) return NextResponse.json({ error: "Ce client n'a pas d'adresse e-mail." }, { status: 400 });

  let token = client.clientToken;
  if (!token) {
    token = randomBytes(24).toString("hex");
    await db.update(clients).set({ clientToken: token, version: sql`${clients.version} + 1` }).where(eq(clients.id, id));
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/suivi/${token}`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(client.email),
      subject: "Votre espace client ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${client.name},</h2>
        <p>Voici l'accès à votre <strong>espace client ClimExpert</strong>. Vous y retrouvez à tout moment vos interventions, vos documents (CERFA, contrats) et vos factures.</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Accéder à mon espace</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert<br>contact@climexpert.fr</p>
      </div>`,
    });
  } catch (e) {
    logError("client.sendPortal", e, { clientId: id });
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

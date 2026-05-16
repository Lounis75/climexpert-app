import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { techniciens, magicLinkTokens } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const [tech] = await db
    .select()
    .from(techniciens)
    .where(eq(techniciens.email, email.toLowerCase().trim()))
    .limit(1);

  // Réponse identique pour éviter l'énumération d'emails
  if (!tech || tech.supprimeLe) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await db.insert(magicLinkTokens).values({
    technicienId: tech.id,
    token,
    expiresAt,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const magicUrl = `${siteUrl}/technicien/activation?token=${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "ClimExpert <noreply@climexpert.fr>",
    to: [tech.email],
    subject: "Votre lien de connexion ClimExpert Technicien",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0B1120;">Bonjour ${tech.prenom ?? tech.name},</h2>
        <p style="color: #475569;">Cliquez sur le bouton ci-dessous pour vous connecter à votre espace technicien. Ce lien est valable <strong>15 minutes</strong>.</p>
        <a href="${magicUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#0ea5e9;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;">
          Accéder à mon espace
        </a>
        <p style="color:#94a3b8;font-size:12px;">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}

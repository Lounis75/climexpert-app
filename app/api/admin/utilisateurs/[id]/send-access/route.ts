import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { Resend } from "resend";
import { getUtilisateurById, setActivationToken } from "@/lib/utilisateurs";
import { ROLES, isRole } from "@/lib/roles";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const u = await getUtilisateurById(id);
    if (!u) return NextResponse.json({ error: "Salarié introuvable" }, { status: 404 });

    // Génère un lien d'activation à usage unique (72 h). Le salarié CHOISIT son
    // mot de passe, aucun mot de passe en clair ne transite par email.
    const token = await setActivationToken(id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://climexpert.fr";
    const activationUrl = `${siteUrl}/activer/${token}`;
    const rolesLabels = (u.roles ?? [])
      .filter(isRole)
      .map((r) => ROLES[r].label)
      .join(", ");

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: [mailRecipient(u.email)],
      subject: "Activez votre accès à l'espace ClimExpert",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color:#0B1120;">Bonjour ${u.prenom ?? u.nom},</h2>
          <p style="color:#475569;">Votre accès à l'espace ClimExpert est prêt${rolesLabels ? ` (rôle : <strong>${rolesLabels}</strong>)` : ""}.</p>
          <p style="color:#475569;">Cliquez ci-dessous pour <strong>choisir votre mot de passe</strong> et activer votre compte. Votre identifiant est votre email : <strong>${u.email}</strong></p>
          <a href="${activationUrl}" style="display:inline-block;margin:16px 0;padding:14px 28px;background:#0ea5e9;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;">
            Activer mon compte
          </a>
          <p style="color:#94a3b8;font-size:12px;">Ce lien est valable 72 heures et à usage unique. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, sentTo: u.email });
  } catch (e) {
    console.error("send-access error:", e);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}

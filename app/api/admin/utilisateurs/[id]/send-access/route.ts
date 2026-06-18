import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getUtilisateurById, setUtilisateurPassword } from "@/lib/utilisateurs";
import { hashPassword, generatePassword } from "@/lib/password";
import { ROLES, isRole } from "@/lib/roles";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const u = await getUtilisateurById(id);
    if (!u) return NextResponse.json({ error: "Salarié introuvable" }, { status: 404 });

    // Génère un nouveau mot de passe, le hache et l'enregistre
    const password = generatePassword(12);
    await setUtilisateurPassword(id, hashPassword(password));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://climexpert.fr";
    const loginUrl = `${siteUrl}/connexion`;
    const rolesLabels = (u.roles ?? [])
      .filter(isRole)
      .map((r) => ROLES[r].label)
      .join(", ");

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: [process.env.EMAIL_TEST_OVERRIDE || u.email],
      subject: "Vos accès à l'espace ClimExpert",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color:#0B1120;">Bonjour ${u.prenom ?? u.nom},</h2>
          <p style="color:#475569;">Votre accès à l'espace ClimExpert est prêt${rolesLabels ? ` (rôle : <strong>${rolesLabels}</strong>)` : ""}.</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Identifiant</p>
            <p style="margin:0 0 16px;color:#0B1120;font-weight:bold;">${u.email}</p>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Mot de passe</p>
            <p style="margin:0;color:#0B1120;font-weight:bold;font-family:monospace;font-size:18px;letter-spacing:1px;">${password}</p>
          </div>
          <a href="${loginUrl}" style="display:inline-block;margin:8px 0 16px;padding:14px 28px;background:#0ea5e9;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;">
            Accéder à mon espace
          </a>
          <p style="color:#94a3b8;font-size:12px;">Conservez ce mot de passe en lieu sûr. Vous pourrez le modifier après connexion.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, sentTo: u.email });
  } catch (e) {
    console.error("send-access error:", e);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}

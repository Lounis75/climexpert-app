import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Envoi MANUEL d'un e-mail de confirmation de rendez-vous au client (déclenché par un bouton dans
// la fiche prospect). Nécessite un e-mail client et une date de RDV posée.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  const email = (lead.email || "").trim();
  if (!email) return NextResponse.json({ error: "Ce prospect n'a pas d'e-mail." }, { status: 400 });
  if (!lead.rdvDate) return NextResponse.json({ error: "Aucun rendez-vous n'est posé sur ce prospect." }, { status: 400 });

  const d = new Date(lead.rdvDate);
  const jour = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const lieu = (lead.address || lead.location || "").trim();
  const prenom = (lead.name || "").trim().split(" ")[0] || "";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(email),
      subject: `Confirmation de votre rendez-vous, le ${jour}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#0284c7;">Votre rendez-vous est confirmé</h2>
        <p>Bonjour${prenom ? ` ${prenom}` : ""},</p>
        <p>Nous vous confirmons votre rendez-vous avec <strong>ClimExpert</strong> :</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 12px 6px 0;color:#64748b;">Date</td><td style="padding:6px 0;font-weight:bold;">${jour}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b;">Heure</td><td style="padding:6px 0;font-weight:bold;">${heure}</td></tr>
          ${lieu ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;">Adresse</td><td style="padding:6px 0;font-weight:bold;">${lieu}</td></tr>` : ""}
        </table>
        <p>Si vous avez un empêchement ou une question, contactez-nous au <strong>06 67 43 27 67</strong> ou répondez à cet e-mail.</p>
        <p>À très bientôt,<br>L'équipe ClimExpert</p>
        <p style="color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:16px;">CLIM EXPERT &middot; 200 rue de la Croix Nivert, 75015 Paris &middot; contact@climexpert.fr</p>
      </div>`,
    });
  } catch (e) {
    logError("rdv.confirmer.email", e, { leadId: id });
    return NextResponse.json({ error: "L'e-mail n'a pas pu être envoyé. Réessaie." }, { status: 502 });
  }

  await db.insert(suivis).values({
    leadId: id, type: "rdv",
    contenu: `Confirmation de RDV envoyée au client par e-mail (${jour} à ${heure}).`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

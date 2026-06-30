import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// PUBLIC : un candidat postule depuis la page « Nous recrutons ». On envoie la candidature (+ CV)
// par e-mail à l'équipe et on dépose une notification dans le CRM. Pas de compte requis.
export async function POST(req: NextRequest) {
  if (!rateLimit(`recrutement:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans quelques minutes." }, { status: 429 });
  }

  const form = await req.formData();
  const nom = String(form.get("nom") ?? "").trim().slice(0, 120);
  const email = String(form.get("email") ?? "").trim().slice(0, 200);
  const telephone = String(form.get("telephone") ?? "").trim().slice(0, 40);
  const poste = String(form.get("poste") ?? "Candidature spontanée").trim().slice(0, 200);
  const message = String(form.get("message") ?? "").trim().slice(0, 4000);
  const cv = form.get("cv");

  if (!nom || !email || !telephone) {
    return NextResponse.json({ error: "Nom, e-mail et téléphone sont requis." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  }

  // CV optionnel (PDF/image), 10 Mo max
  let attachment: { filename: string; content: Buffer } | null = null;
  if (cv instanceof File && cv.size > 0) {
    const okTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!okTypes.includes(cv.type)) return NextResponse.json({ error: "CV au format PDF, JPEG ou PNG." }, { status: 400 });
    if (cv.size > 10 * 1024 * 1024) return NextResponse.json({ error: "CV trop lourd (10 Mo maximum)." }, { status: 400 });
    attachment = { filename: cv.name || "cv.pdf", content: Buffer.from(await cv.arrayBuffer()) };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_NOTIF_EMAIL || "contact@climexpert.fr";
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(adminEmail),
      replyTo: email,
      subject: `Candidature : ${poste} — ${nom}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#0284c7;">Nouvelle candidature</h2>
        <table style="border-collapse:collapse;margin:12px 0;">
          <tr><td style="padding:5px 12px 5px 0;color:#64748b;">Poste</td><td style="padding:5px 0;font-weight:bold;">${escapeHtml(poste)}</td></tr>
          <tr><td style="padding:5px 12px 5px 0;color:#64748b;">Nom</td><td style="padding:5px 0;font-weight:bold;">${escapeHtml(nom)}</td></tr>
          <tr><td style="padding:5px 12px 5px 0;color:#64748b;">E-mail</td><td style="padding:5px 0;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:5px 12px 5px 0;color:#64748b;">Téléphone</td><td style="padding:5px 0;">${escapeHtml(telephone)}</td></tr>
        </table>
        ${message ? `<p style="white-space:pre-wrap;">${escapeHtml(message)}</p>` : ""}
        <p style="color:#94a3b8;font-size:12px;">${attachment ? "CV joint à cet e-mail." : "Aucun CV joint."} Répondez à cet e-mail pour contacter le candidat.</p>
      </div>`,
      ...(attachment ? { attachments: [attachment] } : {}),
    });
  } catch (e) {
    logError("recrutement.email", e);
    return NextResponse.json({ error: "Votre candidature n'a pas pu être envoyée, réessayez." }, { status: 502 });
  }

  await db.insert(notifications).values({
    type: "candidature",
    titre: `Candidature : ${poste}`,
    contenu: `${nom} · ${telephone} · ${email}`,
  }).catch((e) => logError("recrutement.notif", e));

  return NextResponse.json({ ok: true });
}

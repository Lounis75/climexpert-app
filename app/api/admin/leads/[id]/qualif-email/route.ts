import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";
import { ensureQualifToken, qualifLink } from "@/lib/qualif";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Envoi DIRECT du lien de qualification Alex au client par e-mail (depuis la fiche, sans copier-coller).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  const email = (lead.email || "").trim();
  if (!email) return NextResponse.json({ error: "Ce prospect n'a pas d'e-mail." }, { status: 400 });

  const token = await ensureQualifToken(id, lead.qualifToken);
  const link = qualifLink(token);
  const prenom = (lead.name || "").trim().split(" ")[0] || "";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(email),
      subject: "Décrivez votre besoin en 2 minutes, ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#0284c7;">Bonjour${prenom ? ` ${escapeHtml(prenom)}` : ""},</h2>
        <p>C'est <strong>Alex de ClimExpert</strong>. Suite à votre appel et à un afflux de demandes, on met tout en œuvre pour vous répondre au plus vite.</p>
        <p>Pour gagner du temps, décrivez votre besoin en 2 minutes, je vous donnerai une première estimation :</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${link}" style="background:#0ea5e9;color:white;padding:13px 26px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Décrire mon besoin</a>
        </p>
        <p style="color:#64748b;font-size:13px;">Ou copiez ce lien : <a href="${link}">${link}</a></p>
        <p>À très vite !<br>Alex &middot; ClimExpert</p>
        <p style="color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:16px;">CLIM EXPERT &middot; 200 rue de la Croix Nivert, 75015 Paris &middot; contact@climexpert.fr</p>
      </div>`,
    });
  } catch (e) {
    logError("qualif.email", e, { leadId: id });
    return NextResponse.json({ error: "L'e-mail n'a pas pu être envoyé, réessayez." }, { status: 502 });
  }

  await db.insert(suivis).values({ leadId: id, type: "note", contenu: "Lien de qualification Alex envoyé au client par e-mail." }).catch(() => {});

  return NextResponse.json({ ok: true });
}

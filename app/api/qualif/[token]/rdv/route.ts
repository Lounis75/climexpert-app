import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, notifications } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { qualifTokenValid } from "@/lib/qualif";
import { getOpenSlots, bookSlot, labelCreneau } from "@/lib/creneaux-alex";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function leadFromToken(token: string) {
  const [lead] = await db.select().from(leads).where(and(eq(leads.qualifToken, token), isNull(leads.supprimeLe))).limit(1);
  if (!lead || !qualifTokenValid(lead.qualifTokenLe)) return null;
  return lead;
}

// Liste des créneaux de visite proposables (pour afficher les boutons dans le portail).
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await leadFromToken(token);
  if (!lead) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  const slots = await getOpenSlots(6);
  return NextResponse.json({ creneaux: slots.map((s) => ({ id: s.id, label: labelCreneau(s.debut, s.fin) })) });
}

// Réservation d'un créneau par le prospect depuis le portail (réservation immédiate).
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit(`qualifrdv:${clientIp(req)}`, 15, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }
  const lead = await leadFromToken(token);
  if (!lead) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const slotId = body?.slotId ? String(body.slotId) : null;
  if (!slotId) return NextResponse.json({ error: "Créneau manquant" }, { status: 400 });

  const slot = await bookSlot(slotId, lead.id);
  if (!slot) return NextResponse.json({ error: "Ce créneau vient d'être pris, choisissez-en un autre.", taken: true }, { status: 409 });

  const label = labelCreneau(slot.debut, slot.fin);

  // Notification équipe
  await db.insert(notifications).values({
    type: "rdv_alex", titre: `RDV de visite posé par Alex : ${lead.name}`,
    contenu: `${label}. Prospect ${lead.name} (${lead.phone}).`, refType: "lead", refId: lead.id,
  }).catch((e) => logError("qualifrdv.notif", e, { leadId: lead.id }));

  // Confirmation au client (best-effort)
  const email = (lead.email ?? "").trim();
  if (email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ClimExpert <noreply@climexpert.fr>",
        to: mailRecipient(email),
        subject: `Votre rendez-vous de visite ClimExpert : ${label}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
          <h2 style="color:#0284c7;">Rendez-vous confirmé</h2>
          <p>Bonjour ${escapeHtml((lead.name ?? "").split(" ")[0] || "")},</p>
          <p>Votre rendez-vous de visite avec <strong>ClimExpert</strong> est confirmé :</p>
          <p style="font-size:18px;font-weight:bold;color:#0f172a;">${escapeHtml(label)}</p>
          ${lead.address ? `<p style="color:#64748b;">Adresse : ${escapeHtml(lead.address)}</p>` : ""}
          <p>Un conseiller viendra faire le point sur votre projet et préparer un devis précis. Pour toute question, appelez-nous au <strong>06 67 43 27 67</strong>.</p>
          <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert &middot; contact@climexpert.fr</p>
        </div>`,
      });
    } catch (e) { logError("qualifrdv.email", e, { leadId: lead.id }); }
  }

  return NextResponse.json({ ok: true, label });
}

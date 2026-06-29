import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { db } from "@/lib/db";
import { interventions, clients, techniciens, leads } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, ne } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Intervention",
};

function tomorrowRange(): { start: Date; end: Date } {
  const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setHours(23, 59, 59, 999);
  return { start, end };
}
const fmtJour = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const fmtHeure = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

async function send(to: string, subject: string, html: string) {
  await resend.emails.send({ from: "ClimExpert <noreply@climexpert.fr>", to: mailRecipient(to), subject, html });
}

// Rappel J-1 : la veille, on prévient le client de son intervention / rendez-vous du lendemain.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { start, end } = tomorrowRange();
  const r = { interventions: 0, rdvs: 0 };

  // Interventions de demain -> rappel au client
  const interv = await db.select({
    id: interventions.id, scheduledAt: interventions.scheduledAt, type: interventions.type,
    address: interventions.address, clientName: clients.name, clientEmail: clients.email,
    clientAddress: clients.address, techName: techniciens.name,
  }).from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .where(and(
      gte(interventions.scheduledAt, start), lte(interventions.scheduledAt, end),
      ne(interventions.status, "annulée"), isNull(interventions.supprimeLe),
    ));
  for (const i of interv) {
    if (!i.clientEmail || !i.scheduledAt) continue;
    const d = new Date(i.scheduledAt);
    const lieu = i.address || i.clientAddress || "";
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#0f172a;">Bonjour ${i.clientName ?? ""},</h2>
      <p>Petit rappel : votre <strong>${TYPE_LABELS[i.type] ?? "intervention"}</strong> est prévue <strong>demain ${fmtJour(d)} à ${fmtHeure(d)}</strong>.</p>
      ${lieu ? `<p>Adresse : ${lieu}</p>` : ""}
      ${i.techName ? `<p>Intervenant : ${i.techName}</p>` : ""}
      <p>Un imprévu ? Répondez à cet email ou appelez-nous au 06 67 43 27 67.</p>
      <p style="color:#94a3b8;font-size:12px;">L'équipe Clim Expert</p>
    </div>`;
    try { await send(i.clientEmail, `Rappel : votre intervention demain à ${fmtHeure(d)}, Clim Expert`, html); r.interventions++; } catch { /* on continue */ }
  }

  // Rendez-vous commerciaux de demain -> rappel au prospect
  const rdv = await db.select({
    id: leads.id, name: leads.name, email: leads.email, rdvDate: leads.rdvDate, address: leads.address, location: leads.location,
  }).from(leads).where(and(
    gte(leads.rdvDate, start), lte(leads.rdvDate, end),
    ne(leads.status, "perdu"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
  ));
  for (const l of rdv) {
    if (!l.email || !l.rdvDate) continue;
    const d = new Date(l.rdvDate);
    const lieu = l.address || l.location || "";
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#0f172a;">Bonjour ${l.name ?? ""},</h2>
      <p>Petit rappel : nous avons rendez-vous <strong>demain ${fmtJour(d)} à ${fmtHeure(d)}</strong>.</p>
      ${lieu ? `<p>Lieu : ${lieu}</p>` : ""}
      <p>Un imprévu ? Répondez à cet email ou appelez-nous au 06 67 43 27 67.</p>
      <p style="color:#94a3b8;font-size:12px;">L'équipe Clim Expert</p>
    </div>`;
    try { await send(l.email, `Rappel : notre rendez-vous demain à ${fmtHeure(d)}, Clim Expert`, html); r.rdvs++; } catch { /* on continue */ }
  }

  return NextResponse.json({ ok: true, ...r });
}

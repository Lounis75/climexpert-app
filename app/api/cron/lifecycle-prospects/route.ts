import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, notifications } from "@/lib/db/schema";
import { eq, and, isNull, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { updateLead } from "@/lib/leads";

// Cycle de vie automatique des prospects (rappels + transitions). Lancé chaque jour.
function daysAgo(n: number): Date { const d = new Date(); d.setDate(d.getDate() - n); return d; }

async function notifier(type: string, titre: string, contenu: string, leadId: string) {
  await db.insert(notifications).values({ id: createId(), type, titre, contenu, refType: "lead", refId: leadId });
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const r = { rappelPasReponse: 0, autoPerdu: 0, rappelDevis: 0, archives: 0 };

  // 1) « Pas de réponse » depuis 5 j, pas encore relancé -> rappel (que faire de ce prospect ?)
  const rappelPR = await db.select().from(leads).where(and(
    eq(leads.status, "pas_de_reponse"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    isNull(leads.relanceNotifieeLe), lte(leads.statutChangeLe, daysAgo(5)),
  ));
  for (const l of rappelPR) {
    await notifier("relance_prospect", "Prospect sans réponse",
      `${l.name} est sans réponse depuis 5 jours. Que faire ? Sans action, il passera automatiquement en « Perdu » dans 2 jours.`, l.id);
    await db.update(leads).set({ relanceNotifieeLe: now }).where(eq(leads.id, l.id));
    r.rappelPasReponse++;
  }

  // 2) « Pas de réponse » depuis 7 j (rien fait) -> passe automatiquement en « Perdu »
  const toPerdu = await db.select().from(leads).where(and(
    eq(leads.status, "pas_de_reponse"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    lte(leads.statutChangeLe, daysAgo(7)),
  ));
  for (const l of toPerdu) {
    await updateLead(l.id, { status: "perdu" }); // remet statutChangeLe + reset relanceNotifieeLe
    r.autoPerdu++;
  }

  // 3) « Devis envoyé » depuis 30 j, pas encore relancé -> rappel
  const rappelDevis = await db.select().from(leads).where(and(
    eq(leads.status, "devis_envoyé"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    isNull(leads.relanceNotifieeLe), lte(leads.statutChangeLe, daysAgo(30)),
  ));
  for (const l of rappelDevis) {
    await notifier("relance_devis", "Devis à relancer",
      `Le devis de ${l.name} a été envoyé il y a 30 jours, sans réponse. Pensez à le relancer.`, l.id);
    await db.update(leads).set({ relanceNotifieeLe: now }).where(eq(leads.id, l.id));
    r.rappelDevis++;
  }

  // 4) « Perdu » depuis 7 j -> archivé (sort du Kanban, conservé en base pour recontact)
  const toArchive = await db.select().from(leads).where(and(
    eq(leads.status, "perdu"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    lte(leads.statutChangeLe, daysAgo(7)),
  ));
  for (const l of toArchive) {
    await db.update(leads).set({ archiveLe: now }).where(eq(leads.id, l.id));
    r.archives++;
  }

  return NextResponse.json({ ok: true, ...r });
}

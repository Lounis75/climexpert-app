import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, notifications } from "@/lib/db/schema";
import { eq, and, or, isNull, isNotNull, lte, gte } from "drizzle-orm";
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
  const r = { rappelInjoignable: 0, autoPerdu: 0, rappelContacte: 0, rappelDevis: 0, rappelDevis2: 0, devisPerdu: 0, archives: 0, relanceQualif: 0 };
  // Seuil « injoignable » : nombre d'appels sans réponse à partir duquel un prospect resté en
  // « Nouveau » est considéré comme injoignable (aligné sur le badge de la file d'appels).
  const SEUIL_INJOIGNABLE = 4;

  // 0) Qualification Alex abandonnée : le prospect a OUVERT son lien /q/ il y a plus de 24 h sans
  // aller au bout (pas de qualifLe) -> notification « à relancer » (une seule fois). Prospect
  // chaud : il a cliqué, il s'est arrêté en route.
  const abandonsQualif = await db.select().from(leads).where(and(
    isNull(leads.supprimeLe), isNull(leads.archiveLe),
    isNull(leads.qualifLe), isNull(leads.qualifRelanceLe),
    lte(leads.qualifOuvertLe, daysAgo(1)),
  ));
  for (const l of abandonsQualif) {
    await notifier("relance_qualif", `Qualification abandonnée : ${l.name}`,
      `${l.name} a ouvert son lien de qualification sans le terminer. Prospect chaud : relancez-le (SMS du lien à renvoyer depuis sa fiche, ou appel).`, l.id);
    await db.update(leads).set({ qualifRelanceLe: now }).where(eq(leads.id, l.id));
    r.relanceQualif++;
  }

  // 1) Prospect INJOIGNABLE : resté en « Nouveau » avec 4 appels sans réponse ou plus, et sans
  // nouvelle tentative depuis 5 j -> rappel (que faire ?). NB : les actions de la file d'appels
  // n'ont jamais changé le statut (le prospect reste « nouveau », on incrémente tentativesAppel),
  // donc l'ancien filtre sur status='pas_de_reponse' ne capturait plus RIEN. On cible désormais le
  // vrai état vécu. On garde le statut legacy 'pas_de_reponse' pour d'anciennes fiches éventuelles.
  const rappelPR = await db.select().from(leads).where(and(
    isNull(leads.supprimeLe), isNull(leads.archiveLe), isNull(leads.relanceNotifieeLe),
    or(
      and(eq(leads.status, "nouveau"), gte(leads.tentativesAppel, SEUIL_INJOIGNABLE), lte(leads.dernierAppelLe, daysAgo(5))),
      and(eq(leads.status, "pas_de_reponse"), lte(leads.statutChangeLe, daysAgo(5))),
    ),
  ));
  for (const l of rappelPR) {
    await notifier("relance_prospect", "Prospect injoignable",
      `${l.name} est injoignable (${l.tentativesAppel} appels sans réponse, dernier il y a 5 j). Que faire ? Sans action, il passera automatiquement en « Perdu » dans 2 jours.`, l.id);
    await db.update(leads).set({ relanceNotifieeLe: now }).where(eq(leads.id, l.id));
    r.rappelInjoignable++;
  }

  // 2) Prospect injoignable depuis 7 j (rien fait) -> passe automatiquement en « Perdu » (injoignable)
  const toPerdu = await db.select().from(leads).where(and(
    isNull(leads.supprimeLe), isNull(leads.archiveLe),
    or(
      and(eq(leads.status, "nouveau"), gte(leads.tentativesAppel, SEUIL_INJOIGNABLE), lte(leads.dernierAppelLe, daysAgo(7))),
      and(eq(leads.status, "pas_de_reponse"), lte(leads.statutChangeLe, daysAgo(7))),
    ),
  ));
  for (const l of toPerdu) {
    await updateLead(l.id, { status: "perdu", motifPerdu: "injoignable" }); // remet statutChangeLe + reset relanceNotifieeLe
    r.autoPerdu++;
  }

  // 2bis) « Contacté » sans prochaine étape définie depuis 3 j -> rappel (le prospect risque l'oubli :
  // il a été joint mais aucune suite n'a été planifiée, il n'apparaît dans aucune alerte d'action).
  const contacteSansSuite = await db.select().from(leads).where(and(
    eq(leads.status, "contacté"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    isNull(leads.relanceNotifieeLe), isNull(leads.prochaineEtape), isNull(leads.prochaineActionLe),
    lte(leads.statutChangeLe, daysAgo(3)),
  ));
  for (const l of contacteSansSuite) {
    await notifier("relance_prospect", "Prospect à cadrer",
      `${l.name} a été contacté il y a 3 jours mais aucune prochaine étape n'est définie. Précisez la suite (RDV, devis à faire, à recontacter…) pour ne pas le perdre de vue.`, l.id);
    await db.update(leads).set({ relanceNotifieeLe: now }).where(eq(leads.id, l.id));
    r.rappelContacte++;
  }

  // 3) « Devis envoyé » depuis 30 j, jamais relancé -> 1re relance. relanceNotifieeLe sert de date de
  // dernière relance (permet une 2e relance espacée sans nouvelle colonne).
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

  // 3bis) « Devis envoyé » depuis ~55 j, 1re relance déjà faite il y a plus de 25 j -> 2e (et dernière)
  // relance avant abandon. Évite l'impasse où un devis sans réponse restait bloqué indéfiniment.
  const rappelDevis2 = await db.select().from(leads).where(and(
    eq(leads.status, "devis_envoyé"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    isNotNull(leads.relanceNotifieeLe), lte(leads.relanceNotifieeLe, daysAgo(25)),
    lte(leads.statutChangeLe, daysAgo(55)),
  ));
  for (const l of rappelDevis2) {
    await notifier("relance_devis", "Devis à relancer (2e fois)",
      `Le devis de ${l.name} est sans réponse depuis près de 2 mois. Dernière relance conseillée avant de le classer perdu (abandon automatique à 90 jours).`, l.id);
    await db.update(leads).set({ relanceNotifieeLe: now }).where(eq(leads.id, l.id));
    r.rappelDevis2++;
  }

  // 3ter) « Devis envoyé » depuis 90 j sans réponse -> passe en « Perdu » (sans réponse). Sort de
  // l'impasse : le devis a été relancé deux fois, le prospect ne répond pas.
  const devisPerdu = await db.select().from(leads).where(and(
    eq(leads.status, "devis_envoyé"), isNull(leads.supprimeLe), isNull(leads.archiveLe),
    lte(leads.statutChangeLe, daysAgo(90)),
  ));
  for (const l of devisPerdu) {
    await updateLead(l.id, { status: "perdu", motifPerdu: "sans_reponse" });
    await notifier("relance_prospect", "Devis classé perdu",
      `Le devis de ${l.name} est sans réponse depuis 90 jours : le prospect passe automatiquement en « Perdu ». Vous pouvez le relancer manuellement s'il refait surface.`, l.id);
    r.devisPerdu++;
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

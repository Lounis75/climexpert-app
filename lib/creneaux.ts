import { db } from "@/lib/db";
import { interventions, disponibilitesBloquees, techniciens, periodesCapacite } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, inArray } from "drizzle-orm";
import {
  getDuреeDeplacement,
  calculerDureeTotale,
  CAPACITE_JOURNALIERE,
  isJourOuvre,
  formatCreneau,
  getWeekKey,
  type Creneau,
} from "./creneaux-pure";

export { getDuреeDeplacement, calculerDureeTotale, type Creneau };

function addWorkDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (isJourOuvre(d)) added++;
  }
  return d;
}

export async function trouverCreneaux(
  codePostal: string,
  dureeInterventionMinutes: number,
  maxCreneaux = 3,
): Promise<Creneau[]> {
  const dureeTotale = calculerDureeTotale(codePostal, dureeInterventionMinutes);

  const techs = await db
    .select({ id: techniciens.id, name: techniciens.name })
    .from(techniciens)
    .where(and(eq(techniciens.active, true), isNull(techniciens.supprimeLe)));

  if (techs.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = addWorkDays(today, 14);

  const existing = await db
    .select({
      technicienId: interventions.technicienId,
      scheduledAt:  interventions.scheduledAt,
      dureeMin:     interventions.dureeEstimeeMinutes,
    })
    .from(interventions)
    .where(
      and(
        inArray(interventions.status, ["planifiée", "en_cours"] as ("planifiée" | "en_cours" | "terminée" | "annulée")[]),
        gte(interventions.scheduledAt, today),
        lte(interventions.scheduledAt, horizon),
        isNull(interventions.supprimeLe),
      )
    );

  const indispos = await db
    .select()
    .from(disponibilitesBloquees)
    .where(and(gte(disponibilitesBloquees.dateFin, today), lte(disponibilitesBloquees.dateDebut, horizon)));

  const periodes = await db
    .select()
    .from(periodesCapacite)
    .where(and(gte(periodesCapacite.dateFin, today.toISOString().split("T")[0]), lte(periodesCapacite.dateDebut, horizon.toISOString().split("T")[0])));

  const creneaux: Creneau[] = [];
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1);

  while (creneaux.length < maxCreneaux) {
    if (cursor > horizon) break;

    if (!isJourOuvre(cursor)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    const semaine = getWeekKey(cursor);
    const periode = periodes.find((p) => cursor >= new Date(p.dateDebut) && cursor <= new Date(p.dateFin));
    if (periode) {
      const intervsThisWeek = existing.filter((i) => i.scheduledAt && getWeekKey(new Date(i.scheduledAt)) === semaine);
      if (intervsThisWeek.length >= periode.maxInterventionsSemaine) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
    }

    for (const tech of techs) {
      if (creneaux.length >= maxCreneaux) break;

      const techIndispos = indispos.filter(
        (i) => i.technicienId === tech.id && new Date(i.dateDebut) <= cursor && new Date(i.dateFin) >= cursor
      );
      if (techIndispos.length > 0) continue;

      const journeeTech = existing.filter(
        (i) => i.technicienId === tech.id && i.scheduledAt && new Date(i.scheduledAt).toDateString() === cursor.toDateString()
      );
      const minutesOccupees = journeeTech.reduce((sum, i) => sum + (i.dureeMin ?? 0), 0);
      if (CAPACITE_JOURNALIERE - minutesOccupees < dureeTotale) continue;

      const occupied = journeeTech
        .filter((i) => i.scheduledAt)
        .map((i) => ({
          debut: new Date(i.scheduledAt!),
          fin: new Date(new Date(i.scheduledAt!).getTime() + (i.dureeMin ?? 0) * 60000),
        }))
        .sort((a, b) => a.debut.getTime() - b.debut.getTime());

      let slotDebut = new Date(cursor);
      slotDebut.setHours(9, 0, 0, 0);
      let found = false;

      for (const occ of occupied) {
        const slotFin = new Date(slotDebut.getTime() + dureeTotale * 60000);
        if (slotFin <= occ.debut) { found = true; break; }
        slotDebut = new Date(occ.fin);
      }

      if (!found) {
        const slotFin = new Date(slotDebut.getTime() + dureeTotale * 60000);
        const endLimit = new Date(cursor);
        endLimit.setHours(18, 0, 0, 0);
        if (slotFin <= endLimit) found = true;
      }

      if (found) {
        const slotFin = new Date(slotDebut.getTime() + dureeTotale * 60000);
        creneaux.push({ technicienId: tech.id, technicienName: tech.name, debut: new Date(slotDebut), fin: new Date(slotFin), label: formatCreneau(slotDebut, slotFin) });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return creneaux.slice(0, maxCreneaux);
}

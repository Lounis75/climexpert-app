import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { logError } from "@/lib/observability";
import { updateInterventionStatus, updateInterventionNotes, deleteIntervention, getInterventionById } from "@/lib/interventions";
import type { Intervention } from "@/lib/interventions";
import { db } from "@/lib/db";
import { interventions, clients, notifications, admins } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Resend } from "resend";
import { createId } from "@paralleldrive/cuid2";
import { randomBytes } from "crypto";
import { auditAction } from "@/lib/audit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // Verrou optimiste : version attendue envoyée par le client (si fournie).
    const expectedVersion = typeof body.version === "number" ? body.version : undefined;

    // Annulation admin
    if (body.action === "annuler") {
      const [interv] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
      if (!interv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

      await db.update(interventions).set({
        status: "annulée", annulePar: "admin", motifAnnulation: body.motif || null, version: sql`${interventions.version} + 1`, updatedAt: new Date(),
      }).where(eq(interventions.id, id));

      const [client] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);

      // Email client
      if (client?.email) {
        await resend.emails.send({
          from: "ClimExpert <noreply@climexpert.fr>",
          to: mailRecipient(client.email),
          subject: "Votre rendez-vous Clim Expert a été annulé",
          html: `<p>Bonjour ${client.name},</p><p>Votre intervention a été annulée par notre équipe.</p><p>Motif : ${body.motif || "Non précisé"}</p><p>Nous allons vous proposer un nouveau créneau prochainement.</p>`,
        });
      }

      // Notif technicien
      if (interv.technicienId) {
        await db.insert(notifications).values({
          id: createId(), adminId: interv.technicienId, type: "annulation",
          titre: "Intervention annulée par l'admin",
          contenu: body.motif || "Aucun motif",
          refType: "intervention", refId: id,
        });
      }
      await auditAction({
        action: "annuler_intervention",
        tableCible: "interventions",
        idCible: id,
        avant: { status: interv.status },
        apres: { status: "annulée", motif: body.motif },
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      });
      return NextResponse.json({ ok: true });
    }

    // Report : crée une nouvelle intervention liée
    if (body.action === "reporter") {
      const [interv] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
      if (!interv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

      await db.update(interventions).set({
        status: "annulée", annulePar: "admin", motifAnnulation: "Report", version: sql`${interventions.version} + 1`, updatedAt: new Date(),
      }).where(eq(interventions.id, id));

      const newId = createId();
      const rdvToken = randomBytes(32).toString("hex");
      await db.insert(interventions).values({
        id: newId,
        clientId:             interv.clientId,
        technicienId:         interv.technicienId,
        devisId:              interv.devisId,
        type:                 interv.type,
        status:               "planifiée",
        address:              interv.address,
        codePostal:           interv.codePostal,
        notes:                interv.notes,
        dureeEstimeeMinutes:  interv.dureeEstimeeMinutes,
        rdvToken,
        interventionOrigineId: id,
      });

      const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
      if (admin) {
        await db.insert(notifications).values({
          id: createId(), adminId: admin.id, type: "intervention_planifiee",
          titre: "Intervention reportée, nouvelle intervention créée",
          contenu: `Ancienne ID: ${id}`, refType: "intervention", refId: newId,
        });
      }

      return NextResponse.json({ ok: true, newInterventionId: newId, rdvToken });
    }

    // Planification : définit date + technicien (et type éventuel) sur une intervention
    if (body.action === "planifier") {
      const [interv] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
      if (!interv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

      const patch: Record<string, unknown> = { status: "planifiée", version: sql`${interventions.version} + 1`, updatedAt: new Date() };
      if (body.scheduledAt) patch.scheduledAt = new Date(body.scheduledAt);
      if (body.technicienId !== undefined) patch.technicienId = body.technicienId || null;
      if (body.type) patch.type = body.type;
      if (body.address !== undefined) patch.address = body.address || null;
      if (body.dureeEstimeeMinutes !== undefined) {
        const d = Number(body.dureeEstimeeMinutes);
        if (Number.isFinite(d) && d > 0) patch.dureeEstimeeMinutes = Math.round(d);
      }
      const conds = [eq(interventions.id, id)];
      if (expectedVersion !== undefined) conds.push(eq(interventions.version, expectedVersion));
      const updated = await db.update(interventions).set(patch).where(and(...conds)).returning();
      if (updated.length === 0 && expectedVersion !== undefined) {
        return NextResponse.json({ error: "Cette intervention vient d'être modifiée par quelqu'un d'autre. La page a été rechargée.", conflict: true }, { status: 409 });
      }

      // Notifie le technicien affecté (table notifications polymorphe : adminId = technicienId)
      if (body.technicienId) {
        try {
          await db.insert(notifications).values({
            id: createId(), adminId: body.technicienId, type: "nouvelle_intervention",
            titre: "Nouvelle intervention planifiée",
            contenu: body.scheduledAt ? `Le ${new Date(body.scheduledAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}` : "Date à confirmer",
            refType: "intervention", refId: id,
          });
        } catch (e) { console.error("[planifier] notif technicien:", e); }
      }
      return NextResponse.json({ ok: true });
    }

    if (body.status) {
      // La clôture (terminée) n'est JAMAIS un simple flip de statut : elle passe par le
      // rapport du technicien (photos obligatoires + CERFA signé par le client + contrat).
      if (body.status === "terminée") {
        return NextResponse.json({ error: "La clôture se fait via le rapport du technicien (photos + CERFA signé). Impossible de terminer manuellement." }, { status: 400 });
      }
      const i = await updateInterventionStatus(id, body.status as Intervention["status"], expectedVersion);
      if (!i) {
        if (expectedVersion !== undefined && (await getInterventionById(id))) {
          return NextResponse.json({ error: "Cette intervention vient d'être modifiée par quelqu'un d'autre. La page a été rechargée.", conflict: true }, { status: 409 });
        }
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      return NextResponse.json({ intervention: i });
    }
    if (body.notes !== undefined) {
      const ok = await updateInterventionNotes(id, body.notes, expectedVersion);
      if (!ok) {
        if (expectedVersion !== undefined && (await getInterventionById(id))) {
          return NextResponse.json({ error: "Cette intervention vient d'être modifiée par quelqu'un d'autre. Rechargez la page.", conflict: true }, { status: 409 });
        }
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteIntervention(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    logError("intervention.delete.route", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

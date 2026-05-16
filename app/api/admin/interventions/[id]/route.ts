import { NextRequest, NextResponse } from "next/server";
import { updateInterventionStatus, updateInterventionNotes, deleteIntervention } from "@/lib/interventions";
import type { Intervention } from "@/lib/interventions";
import { db } from "@/lib/db";
import { interventions, clients, notifications, admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { createId } from "@paralleldrive/cuid2";
import { randomBytes } from "crypto";
import { auditAction } from "@/lib/audit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Annulation admin
    if (body.action === "annuler") {
      const [interv] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
      if (!interv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

      await db.update(interventions).set({
        status: "annulée", annulePar: "admin", motifAnnulation: body.motif || null, updatedAt: new Date(),
      }).where(eq(interventions.id, id));

      const [client] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);

      // Email client
      if (client?.email) {
        await resend.emails.send({
          from: "ClimExpert <noreply@climexpert.fr>",
          to: process.env.EMAIL_TEST_OVERRIDE || client.email,
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
        status: "annulée", annulePar: "admin", motifAnnulation: "Report", updatedAt: new Date(),
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
          titre: "Intervention reportée — nouvelle intervention créée",
          contenu: `Ancienne ID: ${id}`, refType: "intervention", refId: newId,
        });
      }

      return NextResponse.json({ ok: true, newInterventionId: newId, rdvToken });
    }

    if (body.status) {
      const i = await updateInterventionStatus(id, body.status as Intervention["status"]);
      if (!i) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      return NextResponse.json({ intervention: i });
    }
    if (body.notes !== undefined) {
      await updateInterventionNotes(id, body.notes);
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
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

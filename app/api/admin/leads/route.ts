import { NextRequest, NextResponse } from "next/server";
import { createLead, updateLead, deleteLead, findActiveLeadByNamePhone, getLeadsByStatusPaged, getLeadsPaginated, getLastActivityByLead, getLeadById } from "@/lib/leads";
import { createClientFromLead } from "@/lib/clients";
import { logError } from "@/lib/observability";
import type { LeadStatus } from "@/lib/leads";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    // « Charger plus » d'une colonne du Kanban
    if (status) {
      const offset = Number(searchParams.get("offset")) || 0;
      const limit = Number(searchParams.get("limit")) || 50;
      const items = await getLeadsByStatusPaged({ status: status as LeadStatus, offset, limit });
      const lastActivity = await getLastActivityByLead(items.map((l) => l.id));
      return NextResponse.json({ leads: items, lastActivity });
    }
    // Vue Liste paginée + recherche serveur
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;
    const search = searchParams.get("q") ?? "";
    const { items, total, pageSize } = await getLeadsPaginated({ search, page, limit });
    const lastActivity = await getLastActivityByLead(items.map((l) => l.id));
    return NextResponse.json({ leads: items, total, page, pageSize, lastActivity });
  } catch (e) {
    logError("leads.GET", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, source, project, location, address, email, notes, consentementMarketing, typeClient } = body;
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Nom et téléphone requis" }, { status: 400 });
    }
    // Garde anti-doublon : refuse un prospect identique (nom + téléphone) déjà présent.
    const existing = await findActiveLeadByNamePhone(name, phone);
    if (existing) {
      return NextResponse.json(
        { error: "Un prospect avec ce nom et ce téléphone existe déjà.", duplicateId: existing.id },
        { status: 409 },
      );
    }
    const lead = await createLead({
      name: name.trim(),
      phone: phone.trim(),
      source: source ?? "téléphone",
      project: project || undefined,
      location: location?.trim() || undefined,
      address: address?.trim() || undefined,
      email: email?.trim() || undefined,
      notes: notes?.trim() || undefined,
      consentementMarketing: consentementMarketing === true,
      consentementLe: consentementMarketing === true ? new Date() : undefined,
      typeClient: ["professionnel", "sous_traitance"].includes(typeClient) ? typeClient : "particulier",
    });
    return NextResponse.json({ lead });
  } catch (e) {
    logError("leads.POST", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    // Accepte n'importe quelle combinaison de champs : notes, status, clientId, coordonnées...
    const allowed: Record<string, unknown> = {};
    if (fields.notes !== undefined)        allowed.notes = fields.notes;
    if (fields.favori !== undefined)       allowed.favori = !!fields.favori;
    if (fields.qualification !== undefined) allowed.qualification = fields.qualification;
    if (fields.status)                     allowed.status = fields.status as LeadStatus;
    if (fields.clientId)                   allowed.clientId = fields.clientId;
    if (fields.commercialId !== undefined) allowed.commercialId = fields.commercialId || null;
    // Champs éditables des coordonnées (name/phone sont NOT NULL : ignorés si vides)
    if (typeof fields.name === "string" && fields.name.trim())   allowed.name = fields.name.trim();
    if (typeof fields.phone === "string" && fields.phone.trim()) allowed.phone = fields.phone.trim();
    if (fields.email !== undefined)        allowed.email = (fields.email?.trim() || null);
    if (fields.location !== undefined)     allowed.location = (fields.location?.trim() || null);
    if (fields.address !== undefined)      allowed.address = (fields.address?.trim() || null);
    if (fields.project !== undefined)      allowed.project = (fields.project || null);
    if (fields.consentementMarketing !== undefined) {
      allowed.consentementMarketing = fields.consentementMarketing === true;
      allowed.consentementLe = fields.consentementMarketing === true ? new Date() : null;
    }
    if (fields.montantDevisCt !== undefined) {
      const n = Number(fields.montantDevisCt);
      allowed.montantDevisCt = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }
    if (fields.prochaineEtape !== undefined) {
      allowed.prochaineEtape = ["rdv_pris", "a_recontacter", "en_reflexion", "devis_a_faire", "aucune_opportunite"].includes(fields.prochaineEtape)
        ? fields.prochaineEtape : null;
      // « Aucune opportunité » est terminal → le prospect passe automatiquement en "perdu".
      if (fields.prochaineEtape === "aucune_opportunite") allowed.status = "perdu";
    }
    if (fields.prochaineActionLe !== undefined) {
      const v = typeof fields.prochaineActionLe === "string" ? fields.prochaineActionLe.slice(0, 10) : null;
      allowed.prochaineActionLe = v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    }
    if (fields.rdvDate !== undefined) {
      const d = fields.rdvDate ? new Date(fields.rdvDate) : null;
      allowed.rdvDate = d && !isNaN(d.getTime()) ? d : null;
    }
    if (fields.dateSouhaiteeIntervention !== undefined) {
      const d = fields.dateSouhaiteeIntervention ? new Date(fields.dateSouhaiteeIntervention) : null;
      allowed.dateSouhaiteeIntervention = d && !isNaN(d.getTime()) ? d : null;
    }

    // Passage en "gagné" → conversion auto en client (idempotent : copie l'adresse/
    // notes, lie le lead). Couvre TOUS les chemins (panneau, glisser-déposer Kanban…).
    // On NE l'avale plus en silence : si elle échoue, on remonte un avertissement.
    let conversionWarning: string | undefined;
    if (fields.status === "gagné") {
      try {
        const client = await createClientFromLead(id);
        if (!client) conversionWarning = "Prospect introuvable lors de la création de la fiche client.";
      } catch (e) {
        logError("leads.conversionAuto", e, { leadId: id });
        conversionWarning = "Le prospect est passé en « gagné » mais la fiche client n'a pas pu être créée. À vérifier (les relances d'entretien risquent de ne pas être planifiées).";
      }
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    // Verrou optimiste : le client envoie la version qu'il a sous les yeux.
    const expectedVersion = typeof fields.version === "number" ? fields.version : undefined;
    const lead = await updateLead(id, allowed, expectedVersion);
    if (!lead) {
      if (expectedVersion !== undefined) {
        const current = await getLeadById(id);
        if (current) {
          return NextResponse.json(
            { error: "Ce prospect vient d'être modifié par quelqu'un d'autre. Vos changements n'ont pas été appliqués — la fiche a été rechargée.", conflict: true, lead: current },
            { status: 409 },
          );
        }
      }
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }
    return NextResponse.json({ lead, ...(conversionWarning ? { warning: conversionWarning } : {}) });
  } catch (e) {
    logError("leads.PATCH", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    await deleteLead(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

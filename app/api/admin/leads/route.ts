import { NextRequest, NextResponse } from "next/server";
import { createLead, updateLead, deleteLead } from "@/lib/leads";
import type { LeadStatus } from "@/lib/leads";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, source, project, location, address, email, notes, consentementMarketing, typeClient } = body;
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Nom et téléphone requis" }, { status: 400 });
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
      typeClient: typeClient === "professionnel" ? "professionnel" : "particulier",
    });
    return NextResponse.json({ lead });
  } catch {
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

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
    }

    const lead = await updateLead(id, allowed);
    if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch {
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

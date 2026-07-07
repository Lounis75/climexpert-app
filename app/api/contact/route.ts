import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createLead, findActiveLeadByPhone } from "@/lib/leads";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";
import { suivis } from "@/lib/db/schema";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";

interface ContactFormData {
  type: string;
  bien: string;
  ville: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
  societe?: string;
  photosUrls?: string[];
  consent?: boolean;
  typeClient?: string;
}

const typeLabels: Record<string, string> = {
  installation: "Installation",
  entretien: "Entretien / Maintenance",
  depannage: "Dépannage",
  "contrat-pro": "Contrat professionnel",
  autre: "Autre demande",
};

const bienLabels: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  local: "Local professionnel",
  "local-professionnel": "Local professionnel",
  "hotel-restaurant": "Hôtel / Restaurant",
  copropriete: "Copropriété / Immeuble",
};

export async function POST(req: NextRequest) {
  try {
    // Rate-limit : 5 envois / minute / IP (anti-spam formulaire + quota email)
    if (!(await rateLimit(`contact:${clientIp(req)}`, 5, 60_000))) {
      return NextResponse.json({ error: "Trop de demandes, réessayez dans un instant." }, { status: 429 });
    }

    const body: ContactFormData = await req.json();

    if (!body.nom || !body.telephone || !body.type || !body.bien) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    // Validation : téléphone plausible + type de projet dans la liste connue (sinon 500 Postgres).
    if (String(body.telephone).replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    }
    const VALID_PROJECTS = ["installation", "entretien", "depannage", "contrat-pro", "depose", "autre"] as const;
    const project = (VALID_PROJECTS as readonly string[]).includes(body.type) ? (body.type as typeof VALID_PROJECTS[number]) : "autre";
    // Type de bien du formulaire -> qualification structurée (avant : perdu, seulement dans l'e-mail).
    const TYPE_BIEN: Record<string, string> = { appartement: "Appartement", maison: "Maison", local: "Local commercial", "local-professionnel": "Local commercial", "hotel-restaurant": "Local commercial", copropriete: "Appartement" };
    const NATURE: Record<string, string> = { installation: "Installation", entretien: "Entretien", "contrat-pro": "Entretien", depannage: "Dépannage", depose: "Dépose" };
    const typeBien = TYPE_BIEN[body.bien];
    const qualification = typeBien ? { typeBien, ...(NATURE[project] ? { natureProjet: NATURE[project] } : {}) } : undefined;

    // ── 1) Persister le lead EN PRIORITÉ (donnée critique). Avant, l'e-mail partait d'abord :
    // une panne Resend d'une heure = tous les prospects du formulaire perdus sans trace.
    // Photos jointes : on ne garde que les URLs de NOTRE stockage R2 (une valeur arbitraire dans
    // photosUrls serait sinon réinjectée en src=/href= dans l'e-mail interne = vecteur d'abus).
    const R2_PREFIX = process.env.R2_PUBLIC_URL ?? "";
    const validPhotos = (Array.isArray(body.photosUrls) ? body.photosUrls : [])
      .filter((u: unknown): u is string => typeof u === "string" && (!R2_PREFIX || u.startsWith(R2_PREFIX)));
    const photosUrls = validPhotos.length > 0 ? validPhotos : undefined;

    // Le champ "Adresse / Ville / CP" est autocomplété -> on récupère l'adresse complète.
    // On la stocke dans `address` (carte « Adresse d'intervention », comme Alex) et on garde
    // juste « CP Ville » pour `location` (affichage court sur les cartes du Kanban).
    const adresseComplete = (body.ville || "").trim() || undefined;
    const cpMatch = adresseComplete ? adresseComplete.match(/\b\d{5}\b.*$/) : null;
    const villeCp = cpMatch ? cpMatch[0].trim() : adresseComplete;

    // Anti-doublon : si un prospect ACTIF porte déjà ce numéro, on met à jour son dossier
    // (nouvelle demande en note) au lieu de créer une 2e fiche.
    const dejaConnu = await findActiveLeadByPhone(body.telephone).catch(() => null);
    const lead = dejaConnu ?? await createLead({
      source: "formulaire",
      name: body.nom,
      phone: body.telephone,
      email: body.email || undefined,
      project,
      qualification,
      address: adresseComplete && /\d/.test(adresseComplete) ? adresseComplete : undefined,
      location: villeCp,
      message: (body.message || "").trim() || undefined,
      photosUrls,
      consentementMarketing: body.consent === true,
      consentementLe: body.consent === true ? new Date() : undefined,
      typeClient: ["professionnel", "sous_traitance"].includes(body.typeClient ?? "") ? body.typeClient : "particulier",
    });

    if (dejaConnu) {
      await db.insert(suivis).values({ leadId: lead.id, type: "note", contenu: `Nouvelle demande via le formulaire (${typeLabels[project] ?? project})${body.message ? " : " + body.message.slice(0, 300) : ""}.` }).catch((e) => logError("contact.suivi", e, { leadId: lead.id }));
    }

    await createNotification({
      type: "nouveau_lead",
      titre: dejaConnu ? `Prospect déjà connu : ${lead.name}` : `Nouveau lead, ${body.nom}`,
      contenu: dejaConnu ? "Nouvelle demande via le formulaire (aucun doublon créé)." : `${body.telephone}${body.ville ? ` · ${body.ville}` : ""}`,
      refType: "lead",
      refId: lead.id,
    }).catch((e) => logError("contact.notif", e, { leadId: lead.id }));

    // ── 2) E-mail interne : best-effort, le lead est déjà en base. ──
    // Toutes les valeurs saisies par le visiteur sont ÉCHAPPÉES avant d'entrer dans le HTML :
    // sinon un visiteur pouvait injecter du HTML/phishing dans un e-mail qui paraît venir de
    // notre propre système.
    const eNom = escapeHtml(body.nom);
    const eTel = escapeHtml(body.telephone);
    const eSociete = escapeHtml(body.societe ?? "");
    const eEmail = escapeHtml(body.email ?? "");
    const eVille = escapeHtml(body.ville ?? "");
    const eMessage = escapeHtml(body.message ?? "");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const date = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
    });

    try {
    await resend.emails.send({
      from: "Contact ClimExpert <noreply@climexpert.fr>",
      to: ["contact@climexpert.fr"],
      subject: `📩 Nouveau contact, ${eNom}, ${typeLabels[body.type] ?? body.type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
          <div style="background: #0B1120; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: #38BDF8; margin: 0; font-size: 20px;">📩 Nouveau contact via le site</h1>
            <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">${date}</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
            <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #0EA5E9; padding-bottom: 8px;">Détails de la demande</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748B; width: 40%; font-size: 14px;">Nom</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${eNom}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; font-weight: bold; color: #0EA5E9; font-size: 16px;"><a href="tel:${eTel}" style="color: #0EA5E9; text-decoration: none;">${eTel}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Type de demande</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${typeLabels[body.type] ?? body.type}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Type de bien</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${bienLabels[body.bien] ?? body.bien}</td></tr>
              ${body.societe ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Société</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${eSociete}</td></tr>` : ""}
              ${body.email ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Email</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;"><a href="mailto:${eEmail}" style="color: #0EA5E9; text-decoration: none;">${eEmail}</a></td></tr>` : ""}
              ${body.ville ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Localisation</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${eVille}</td></tr>` : ""}
              ${body.message ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #0F172A; font-size: 14px; white-space: pre-wrap;">${eMessage}</td></tr>` : ""}
            </table>
          </div>

          ${validPhotos.length > 0 ? `
          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
            <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #0EA5E9; padding-bottom: 8px;">📸 Fichiers joints (${validPhotos.length})</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
              ${validPhotos.map((url, i) => `<a href="${url}" target="_blank" style="display: block;"><img src="${url}" alt="Fichier ${i + 1}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0;" /></a>`).join("")}
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${validPhotos.map((url, i) => `<a href="${url}" target="_blank" style="color: #0EA5E9; font-size: 13px; text-decoration: none;">→ Voir fichier ${i + 1}</a>`).join("")}
            </div>
          </div>
          ` : ""}

          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #C2410C; font-weight: bold; font-size: 14px;">⏱️ À rappeler rapidement</p>
            <a href="tel:${body.telephone}" style="display: inline-block; margin-top: 8px; background: #EA580C; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Appeler ${eNom}</a>
          </div>

          <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 16px;">Formulaire de contact · climexpert.fr</p>
        </div>
      `,
    });
    } catch (e) {
      logError("contact.email", e, { leadId: lead.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("contact", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}

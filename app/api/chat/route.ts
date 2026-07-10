import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createLead, findActiveLeadByPhone } from "@/lib/leads";
import { db } from "@/lib/db";
import { savTickets, clients, notifications, admins, logsAlex, leads, suivis } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAlexConsignes, consignesPromptBlock } from "@/lib/alex-consignes";
import { qualifTokenValid } from "@/lib/qualif";
import { type Qualification } from "@/lib/qualification";
import { getOpenSlots } from "@/lib/creneaux-alex";
import { SYSTEM_PROMPT, CONTACT_SYSTEM_PROMPT } from "@/lib/alex-prompt";
import { ALEX_TOOLS, PROSPECT_TOOL, TOOL_PROSPECT, TOOL_SAV, TOOL_CRENEAUX } from "@/lib/alex-tools";
import { contratTotalEuros } from "@/lib/contrat-pricing";
import { escapeHtml } from "@/lib/escape-html";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });


interface LeadData {
  name: string;
  phone: string;
  email?: string;
  project: string;
  property: string;
  location: string;
  address?: string;
  estimate: string;
  notes: string;
  rooms?: string;            // nombre de pièces à climatiser / d'unités (chiffre)
  refuseContact?: boolean;   // true UNIQUEMENT si la personne refuse le démarchage
  typeClient?: string;       // "particulier" | "professionnel"
  // ── Champs de la QUALIFICATION APPROFONDIE (remplis seulement si le prospect accepte les 2 min) ──
  budget?: string;           // budget approximatif
  delai?: string;            // urgence / échéance
  copro?: string;            // copropriété (installation) : oui / non / ne sait pas
  syndic?: string;           // nom du syndic si copro
  hauteur?: string;          // accès / hauteur de l'unité extérieure
  emplacementUE?: string;    // emplacement de l'unité extérieure
  marque?: string;           // marque souhaitée / existante
  problem?: string;          // description du problème (dépannage)
  qualifPlus?: boolean;      // true si la qualification approfondie a été menée
  dernierEntretien?: string; // entretien : ancienneté du dernier entretien (ex : 2 ans, plus de 3 ans, jamais)
  disponibilites?: string;   // jours/horaires de préférence pour l'intervention (à confirmer par l'équipe)
}

function mapOuiNon(v?: string): string | undefined {
  const s = (v ?? "").toLowerCase();
  if (!s) return undefined;
  if (s.includes("oui")) return "Oui";
  if (s.includes("non")) return "Non";
  return "Ne sait pas";
}
function mapDelai(v?: string): string | undefined {
  const s = (v ?? "").toLowerCase();
  if (!s) return undefined;
  if (s.includes("urgen") || s.includes("vite") || s.includes("rapide") || s.includes("dès que")) return "Urgent";
  if (s.includes("mois") && (s.includes("1") || s.includes("moins") || s.includes("un"))) return "Moins d'1 mois";
  if (s.includes("pas pressé") || s.includes("pas presse") || s.includes("plus tard") || s.includes("aucune")) return "Pas pressé";
  if (s.includes("mois") || s.includes("trimestre")) return "1 à 3 mois";
  return v;
}
function mapEmplacement(v?: string): string | undefined {
  const s = (v ?? "").toLowerCase();
  if (!s) return undefined;
  if (s.includes("balcon")) return "Balcon";
  if (s.includes("jardin")) return "Jardin";
  if (s.includes("façade") || s.includes("facade") || s.includes("mur")) return "Façade";
  if (s.includes("toit")) return "Toiture";
  if (s.includes("cour")) return "Cour";
  return "À voir sur place";
}

// Construit la QUALIFICATION structurée (panneau « Qualification des besoins ») à partir de ce
// qu'Alex a collecté. Sans ça, les infos ne vivaient que dans le transcript, jamais dans le
// formulaire pré-rempli pour le commercial/technicien.
function buildQualifFromAlex(lead: LeadData): Qualification {
  const q: Qualification = { qualifieLe: new Date().toISOString() };
  const projNorm = (lead.project ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const projMap: Record<string, string> = { installation: "Installation", entretien: "Entretien", depannage: "Dépannage", depose: "Dépose" };
  if (projMap[projNorm]) q.natureProjet = projMap[projNorm];

  const prop = (lead.property ?? "").toLowerCase();
  if (prop.includes("apparteme")) q.typeBien = "Appartement";
  else if (prop.includes("maison")) q.typeBien = "Maison";
  else if (prop.includes("bureau")) q.typeBien = "Bureau";
  else if (prop.includes("local") || prop.includes("commerc") || prop.includes("pro")) q.typeBien = "Local commercial";

  q.clientType = String(lead.typeClient ?? "").toLowerCase().includes("pro") ? "Professionnel" : "Particulier";

  const rooms = String(lead.rooms ?? "").match(/\d+/)?.[0];
  if (rooms) {
    if (q.natureProjet === "Entretien") q.entretienNbUnites = rooms;
    else if (q.natureProjet === "Dépose") q.deposeNbUnites = rooms;
    else q.nbUnites = rooms; // installation par défaut
  }

  // ── Champs approfondis (présents seulement si Alex a fait le tour long) ──
  if (lead.budget) q.budget = lead.budget.slice(0, 100);
  if (lead.disponibilites) q.plagesHoraires = lead.disponibilites.slice(0, 200);
  const delai = mapDelai(lead.delai);
  if (delai) q.delai = delai;
  const marque = lead.marque?.trim();
  const hauteur = lead.hauteur?.trim();
  const emplacement = mapEmplacement(lead.emplacementUE);

  if (q.natureProjet === "Installation") {
    const copro = mapOuiNon(lead.copro);
    if (copro) q.copropriete = copro;
    if (lead.syndic) q.syndic = lead.syndic.slice(0, 200);
  } else if (q.natureProjet === "Entretien") {
    if (lead.dernierEntretien) q.dernierEntretien = lead.dernierEntretien.slice(0, 100);
    if (hauteur) q.entretienHauteur = hauteur;
    if (emplacement) q.entretienEmplacementUE = emplacement;
    if (marque) q.entretienMarque = marque;
  } else if (q.natureProjet === "Dépose") {
    if (hauteur) q.deposeHauteur = hauteur;
    if (emplacement) q.deposeEmplacementUE = emplacement;
    if (marque) q.deposeMarque = marque;
  } else if (q.natureProjet === "Dépannage") {
    if (marque) q.depannageMarque = marque;
    if (lead.problem) q.problemeDescription = lead.problem.slice(0, 500);
    else if (lead.notes) q.problemeDescription = lead.notes.slice(0, 500);
  }
  if (lead.qualifPlus) q.qualifPlus = true;
  return q;
}

// Quand Alex a qualifié EN PROFONDEUR une installation OU un entretien, on prévient l'équipe qu'un
// devis peut être préparé : l'outil de chiffrage s'ouvrira déjà pré-rempli depuis la qualification.
// Jamais d'envoi auto : c'est un brouillon à vérifier par un humain.
async function notifyDevisBrouillon(leadId: string, name: string, qualif: Qualification) {
  if (!qualif.qualifPlus) return;
  let titre: string, contenu: string;
  if (qualif.natureProjet === "Installation") {
    const detail = qualif.nbUnites ? `${qualif.nbUnites} unité(s)` : "installation";
    titre = `Devis à préparer, ${name}`;
    contenu = `${name} a été qualifié en détail par Alex (${detail}). Le chiffrage est pré-rempli : vérifiez et envoyez.`;
  } else if (qualif.natureProjet === "Entretien") {
    const units = Math.max(1, parseInt(qualif.entretienNbUnites || "1", 10) || 1);
    const prix = contratTotalEuros(units);
    titre = `Contrat d'entretien à préparer, ${name}`;
    contenu = `${name} qualifié par Alex : entretien ${units} unité(s), soit environ ${prix} € TTC/an avec contrat. Le chiffrage est pré-rempli : vérifiez et envoyez.`;
  } else return;
  await db.insert(notifications).values({
    adminId: null, type: "devis_brouillon", titre, contenu, refType: "chiffrage", refId: leadId,
  }).catch((e) => console.error("[chat] devisBrouillon notif:", e));
}

// ── Garde-fou prix : planchers TTC de la grille (source de vérité : section TARIFS & PRIX du
// prompt). Si Alex annonce en dessous, on flague la fiche « estimation à vérifier » : filet
// anti-sous-estimation, invisible pour le client. ──
function estimateFloorEuros(lead: LeadData): number | null {
  const proj = (lead.project ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const rooms = parseInt(String(lead.rooms ?? "").match(/\d+/)?.[0] ?? "", 10);
  if (proj === "installation") {
    if (!Number.isFinite(rooms) || rooms <= 1) return 3000;
    if (rooms === 2) return 5000;
    if (rooms === 3) return 7000;
    return 9000;
  }
  if (proj === "entretien") return 200;
  if (proj === "depose") return 250;
  return null;
}

function parseEstimateEuros(estimate: string | undefined): number | null {
  if (!estimate) return null;
  // "à partir de 7 000 € TTC" -> 7000 (espaces normales, fines ou insécables tolérées)
  const m = estimate.replace(/[\s  ]/g, "").match(/(\d{3,6})/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

async function flagEstimationBasse(leadId: string, name: string, lead: LeadData) {
  const floor = estimateFloorEuros(lead);
  const est = parseEstimateEuros(lead.estimate);
  if (floor == null || est == null || est >= floor) return;
  await db.insert(notifications).values({
    adminId: null, type: "estimation_flag",
    titre: `Estimation à vérifier : ${name}`,
    contenu: `Alex a annoncé ${est.toLocaleString("fr-FR")} € alors que le plancher de la grille est ${floor.toLocaleString("fr-FR")} € (${lead.project}${lead.rooms ? `, ${lead.rooms} pièce(s)` : ""}). Vérifiez avant d'envoyer le devis.`,
    refType: "lead", refId: leadId,
  }).catch((e) => console.error("[chat] flag estimation:", e));
}

const FALLBACK_MESSAGE = "Je rencontre un petit souci technique. Pour ne pas vous faire attendre, laissez-moi votre nom et votre numéro de téléphone : un conseiller vous rappelle rapidement.";

// Alerte équipe en cas de panne IA, throttlée à 1 notification / 15 min (un incident ne doit
// pas noyer la cloche). Le client, lui, voit le formulaire de secours (flag fallback).
async function notifyPannePublic() {
  try {
    if (await rateLimit("alex:panne:notif", 1, 15 * 60 * 1000)) {
      await db.insert(notifications).values({
        adminId: null, type: "alex_panne",
        titre: "⚠️ Alex est en difficulté (erreur IA)",
        contenu: "Le chatbot rencontre des erreurs. Les visiteurs voient un formulaire de secours (nom + téléphone) : les contacts sont préservés.",
      });
    }
  } catch (e2) { console.error("[chat] notif panne:", e2); }
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildTranscript(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role === "user" ? "👤 Client" : "🤖 Alex"} : ${typeof m.content === "string" ? m.content : ""}`)
    .join("\n\n");
}

function buildTranscriptHtml(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const isUser = m.role === "user";
      const content = typeof m.content === "string" ? escapeHtml(m.content).replace(/\n/g, "<br>") : "";
      return `<div style="margin-bottom:12px;">
        <span style="font-size:11px;font-weight:bold;color:${isUser ? "#0EA5E9" : "#10B981"};text-transform:uppercase;letter-spacing:0.05em;">${isUser ? "👤 Client" : "🤖 Alex"}</span>
        <p style="margin:4px 0 0;padding:10px 14px;background:${isUser ? "#F0F9FF" : "#F0FDF4"};border-radius:8px;font-size:13px;color:#1e293b;line-height:1.5;">${content}</p>
      </div>`;
    })
    .join("");
}

async function sendLeadEmails(lead: LeadData, messages: ChatMessage[]) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const date = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Valeurs échappées : le contenu du lead provient de la conversation (donc du visiteur).
  const eName = escapeHtml(lead.name ?? "");
  const ePhone = escapeHtml(lead.phone ?? "");
  const eEmail = escapeHtml(lead.email ?? "");
  const eProject = escapeHtml(lead.project ?? "");
  const eProperty = escapeHtml(lead.property ?? "");
  const eLocation = escapeHtml(lead.location ?? "");
  const eAddress = escapeHtml(lead.address ?? "");
  const eEstimate = escapeHtml(lead.estimate ?? "");
  const eNotes = escapeHtml(lead.notes ?? "");
  const transcriptHtml = buildTranscriptHtml(messages);

  await resend.emails.send({
    from: "Alex ClimExpert <noreply@climexpert.fr>",
    to: ["contact@climexpert.fr"],
    subject: `⚡ Nouveau lead, ${eName}, ${eProject}, ${eLocation}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
        <div style="background: #0B1120; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <h1 style="color: #38BDF8; margin: 0; font-size: 20px;">⚡ Nouveau lead qualifié par Alex</h1>
          <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">${date}</p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
          <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #0EA5E9; padding-bottom: 8px;">📋 Récapitulatif du prospect</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748B; width: 38%; font-size: 14px;">Nom</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${eName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; font-size: 16px;"><a href="tel:${ePhone}" style="color: #0EA5E9; font-weight: bold; text-decoration: none;">${ePhone}</a></td></tr>
            ${lead.email ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${eEmail}" style="color: #0EA5E9; text-decoration: none;">${eEmail}</a></td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Projet</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px; text-transform: capitalize;">${eProject}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Bien</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px; text-transform: capitalize;">${eProperty}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Ville / CP</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${eLocation}</td></tr>
            ${lead.address ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Adresse chantier</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;"><a href="https://maps.google.com/?q=${encodeURIComponent(lead.address)}" style="color:#0EA5E9;text-decoration:none;">${eAddress} 📍</a></td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Estimation</td><td style="padding: 8px 0; font-weight: bold; color: #16A34A; font-size: 15px;">${eEstimate}</td></tr>
            ${lead.notes ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px; vertical-align: top;">Notes</td><td style="padding: 8px 0; color: #0F172A; font-size: 14px;">${eNotes}</td></tr>` : ""}
          </table>
        </div>

        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 16px;">
          <p style="margin: 0; color: #C2410C; font-weight: bold; font-size: 14px;">⏱️ À rappeler sous 24h</p>
          <a href="tel:${lead.phone}" style="display: inline-block; margin-top: 8px; background: #EA580C; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">📞 Appeler ${eName}</a>
        </div>

        ${transcriptHtml ? `
        <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #E2E8F0;">
          <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #10B981; padding-bottom: 8px;">💬 Conversation avec Alex</h2>
          ${transcriptHtml}
        </div>
        ` : ""}

        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 16px;">Lead qualifié par Alex · climexpert.fr</p>
      </div>
    `,
  });
}

// Met à jour un prospect EXISTANT à partir de la qualification Alex (portail / lien personnel),
// au lieu d'en créer un nouveau. Remplit projet/localisation/notes, passe en "contacté" + "RDV à
// convenir", trace la conversation et notifie l'équipe ("prospect qualifié").
async function updateLeadFromQualif(existing: typeof leads.$inferSelect, lead: LeadData, messages: ChatMessage[], viaPortail = true) {
  const VALID_PROJECTS = ["installation", "entretien", "depannage", "depose", "contrat-pro", "autre"] as const;
  const normalized = lead.project ? lead.project.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() : "";
  const project = (VALID_PROJECTS as readonly string[]).includes(normalized) ? (normalized as typeof VALID_PROJECTS[number]) : undefined;

  const transcript = buildTranscript(messages);
  const noteAjout = [
    viaPortail ? "Qualifié par Alex (portail de qualification)." : "A reparlé à Alex sur le site (fiche mise à jour).",
    lead.estimate ? `Estimation : ${lead.estimate}` : "",
    lead.notes ? `Détails : ${lead.notes}` : "",
    transcript ? `\n--- Conversation Alex ---\n${transcript}` : "",
  ].filter(Boolean).join("\n");
  const newNotes = [existing.notes, noteAjout].filter(Boolean).join("\n\n").slice(0, 8000);

  // Le nom de la fiche est-il un simple placeholder (vide, ou égal au numéro de téléphone) ?
  // Dans ce cas on le remplace par le nom collecté par Alex ; sinon on garde le nom existant.
  const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
  const nameIsPlaceholder = !existing.name?.trim()
    || onlyDigits(existing.name) === onlyDigits(existing.phone)
    || /^\+?[\d\s().-]{6,}$/.test(existing.name.trim());

  // Qualification structurée : on FUSIONNE ce qu'Alex a déduit avec ce qui aurait déjà été saisi
  // à la main (les valeurs d'Alex complètent/actualisent, sans écraser par du vide).
  const qualifAlex = buildQualifFromAlex(lead);
  const mergedQualif = { ...((existing.qualification as Qualification) ?? {}), ...qualifAlex };

  try {
    await db.update(leads).set({
      ...(project ? { project } : {}),
      ...(lead.name?.trim() && nameIsPlaceholder ? { name: lead.name.trim() } : {}),
      ...(lead.phone?.trim() && !existing.phone?.trim() ? { phone: lead.phone.trim() } : {}),
      ...(lead.location ? { location: lead.location } : {}),
      ...(lead.address ? { address: lead.address } : {}),
      ...(lead.email ? { email: lead.email } : {}),
      qualification: mergedQualif,
      notes: newNotes,
      status: existing.status === "nouveau" ? "contacté" : existing.status,
      prochaineEtape: "rdv_a_convenir",
      ...(viaPortail ? { qualifLe: new Date() } : {}),
      statutChangeLe: new Date(),
      relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`,
      updatedAt: new Date(),
    }).where(eq(leads.id, existing.id));
  } catch (e) {
    console.error("[chat] échec updateLeadFromQualif:", e);
    await db.insert(notifications).values({
      adminId: null, type: "alex_panne",
      titre: `Qualif Alex NON enregistrée : ${existing.name ?? "prospect"}`,
      contenu: "Le client a répondu à Alex mais la mise à jour de sa fiche a échoué. Recontactez-le / vérifiez le transcript.",
      refType: "lead", refId: existing.id,
    }).catch(() => {});
    return;
  }
  await db.insert(suivis).values({ leadId: existing.id, type: "note", contenu: noteAjout.slice(0, 4000) }).catch(() => {});
  const displayName = (lead.name?.trim() && nameIsPlaceholder ? lead.name.trim() : existing.name?.trim()) || lead.name?.trim() || existing.phone || "Prospect";
  await db.insert(notifications).values({
    type: "lead_qualifie",
    titre: `Prospect qualifié par Alex : ${displayName}`,
    contenu: `${displayName} a décrit son besoin via le lien.${lead.estimate ? ` Estimation : ${lead.estimate}.` : ""} À recontacter pour caler un rendez-vous.`,
    refType: "lead", refId: existing.id,
  }).catch(() => {});
}

// ── Lecture de la réponse du modèle (texte + appels d'outils) ──────────────────────────────
function texteDe(msg: Anthropic.Message): string {
  return msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
}
function outilAppele(msg: Anthropic.Message, nom: string): Record<string, unknown> | null {
  const b = msg.content.find((x): x is Anthropic.ToolUseBlock => x.type === "tool_use" && x.name === nom);
  return b ? (b.input as Record<string, unknown>) : null;
}

// Ancien protocole de marqueur texte : Haiku écrivait le marqueur EN FIN de réponse (et se faisait
// tronquer par max_tokens), donc `startsWith` ne matchait jamais et le prospect était perdu. On ne
// demande plus ce format, mais si un modèle en émet un par habitude, on le récupère quand même :
// on cherche le marqueur N'IMPORTE OÙ (y compris tronqué en "LEAD_READ") et on parse le JSON.
const MARQUEUR_LEGACY = /(LEAD_?READ(?:Y)?|SAV_READY|CRENEAUX_READY)/;
function leadLegacy(raw: string): LeadData | null {
  if (!/LEAD_?READ/.test(raw)) return null;
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const d = JSON.parse(m[0]) as LeadData;
    return d?.phone ? d : null;
  } catch { return null; }
}

// Un numéro de téléphone français apparaît-il dans ce que le CLIENT a écrit ?
const TEL_RE = /(?:\+33|0)\s*[1-9](?:[\s.\-]?\d{2}){4}/;
function telephoneDonne(messages: ChatMessage[]): string | null {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const t = m.content.match(TEL_RE);
    if (t) return t[0];
  }
  return null;
}
// Alex a-t-il refusé la demande (clim mobile hors périmètre) ? Dans ce cas, pas de prospect.
function refusPerimetre(raw: string): boolean {
  return /mobile|portable/i.test(raw) && /(ne prenons pas|pas en charge|spécialis)/i.test(raw);
}
// Le modèle renvoie parfois "<UNKNOWN>" / "inconnu" au lieu de laisser le champ vide.
const NOM_INCONNU = /^(<?unknown>?|inconnu|n\/?a|non communiqué?|-|\?)$/i;

// FILET DE SÉCURITÉ (anti-perte de prospect). Invariant métier : dès qu'un client a laissé son
// TÉLÉPHONE, une fiche prospect DOIT exister, quoi que fasse le modèle. Si Alex conclut (ou pose
// une question facultative de plus…) sans appeler enregistrer_prospect, on relit la conversation
// avec un 2e appel Haiku dont l'outil est FORCÉ : on récupère les données et on crée la fiche.
// Dix pertes réelles constatées avant ce filet (dont Maxime PROST, Damien Harvey, Restaurant Jin).
// Le NOM n'est PAS exigé : un numéro seul est déjà un prospect rappelable (même logique que
// « Importer des numéros »). On pose alors un nom bidon contenant le numéro : updateLeadFromQualif
// le reconnaît comme placeholder et le remplace dès que le vrai nom arrive.
// Coût : un appel Haiku, uniquement sur les tours où un téléphone a été donné.
async function extraireProspectDeSecours(messages: ChatMessage[], telRepli: string): Promise<LeadData | null> {
  try {
    const r = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [PROSPECT_TOOL],
      tool_choice: { type: "tool", name: TOOL_PROSPECT },
      system:
        "Tu extrais les informations d'un prospect à partir d'une conversation avec Alex, l'assistant de ClimExpert. " +
        "Reporte FIDÈLEMENT ce que le client a donné, y compris tôt dans l'échange. N'invente RIEN : laisse vide tout ce qui n'a pas été dit. " +
        "Le nom est celui de la personne (pour un professionnel, le contact responsable ; mets la raison sociale dans notes).",
      messages: [{ role: "user", content: `Conversation :\n\n${buildTranscript(messages)}\n\nExtrais les informations de ce prospect.` }],
    });
    const b = r.content.find((x): x is Anthropic.ToolUseBlock => x.type === "tool_use");
    const d = (b?.input ?? {}) as LeadData;

    // Le téléphone du modèle, sinon celui repéré en clair dans la conversation.
    const phone = String(d.phone ?? "").trim() || telRepli;
    if (!phone.replace(/\D/g, "")) return null;

    const nomBrut = String(d.name ?? "").trim();
    const sansNom = !nomBrut || NOM_INCONNU.test(nomBrut);
    const notes = [d.notes, sansNom ? "Le client n'a pas donné son nom : rappeler le numéro." : ""].filter(Boolean).join("\n");

    return { ...d, phone, name: sansNom ? `Prospect Alex ${phone}` : nomBrut, notes };
  } catch (e) {
    // On n'échoue JAMAIS en silence : le transcript reste dans logs_alex, et l'équipe est alertée.
    console.error("[chat] filet de secours: échec extraction", e);
    await db.insert(notifications).values({
      adminId: null, type: "alex_panne",
      titre: "Prospect à récupérer à la main (filet en échec)",
      contenu: `Un client a laissé le numéro ${telRepli} mais la fiche n'a pas pu être créée automatiquement. Rappelez-le et vérifiez la conversation Alex.`,
    }).catch(() => {});
    return null;
  }
}

// Mode « contact » : Alex aide le visiteur à DÉCRIRE SON BESOIN depuis le formulaire de
// contact (les coordonnées sont déjà saisies). Il ne crée AUCUN lead / créneau / SAV -
// c'est le formulaire qui crée le lead à l'envoi. Prompt isolé + court-circuit.

export async function POST(req: NextRequest) {
  try {
    // Rate-limit : 20 requêtes / minute / IP (borne le coût Anthropic et le spam)
    if (!(await rateLimit(`chat:${clientIp(req)}`, 20, 60_000))) {
      return NextResponse.json({ error: "Trop de messages, patientez quelques instants." }, { status: 429 });
    }

    const body: { messages: ChatMessage[]; sessionId?: string; mode?: string; qualifToken?: string; stream?: boolean } = await req.json();
    const wantStream = body.stream === true;
    const sid = body.sessionId ?? "unknown";
    const mode = body.mode;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Messages invalides" }, { status: 400 });
    }

    // Mode « qualif » : conversation rattachée à un prospect EXISTANT via son lien personnel (SMS).
    // Alex connaît déjà son identité et met à jour SA fiche au lieu d'en créer une nouvelle.
    const qualifToken = typeof body.qualifToken === "string" ? body.qualifToken : null;
    const [qualifRow] = qualifToken
      ? await db.select().from(leads).where(eq(leads.qualifToken, qualifToken)).limit(1)
      : [];
    // Lien de qualif expiré (> 60 j) : on ignore le contexte prospect (Alex repart en mode normal).
    const qualifLead = qualifRow && qualifTokenValid(qualifRow.qualifTokenLe) ? qualifRow : undefined;

    // Borne la taille de l'historique envoyé au modèle (coût d'entrée + DB)
    const messages = body.messages.slice(-40);

    // Contexte courant pilotable par l'équipe (délai d'intervention en jours, consignes du moment).
    const consignes = await getAlexConsignes();
    const baseSystem = mode === "contact" ? CONTACT_SYSTEM_PROMPT : SYSTEM_PROMPT;
    let extraSystem = consignesPromptBlock(consignes);
    if (qualifLead) {
      extraSystem += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROSPECT DÉJÀ IDENTIFIÉ (qualification via lien personnel envoyé par l'équipe)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCe client t'a été adressé par ClimExpert suite à sa demande (appel ou formulaire sur le site). Tu connais déjà : nom = ${qualifLead.name ?? "?"}, téléphone = ${qualifLead.phone ?? "?"}${qualifLead.email ? `, e-mail = ${qualifLead.email}` : ", e-mail = INCONNU (demande-le : c'est là que le devis et le lien de signature seront envoyés)"}${qualifLead.location ? `, ville = ${qualifLead.location}` : ""}${qualifLead.project ? `, projet pressenti = ${qualifLead.project}` : ""}. NE REDEMANDE JAMAIS son nom ni son téléphone. Concentre-toi sur la qualification du BESOIN. Ce prospect est venu via un lien personnel, il est donc MOTIVÉ : fais directement le TOUR APPROFONDI (voir section QUALIFICATION APPROFONDIE) sans redemander la permission des 2 minutes, pose les questions pertinentes à son projet une par une, puis conclus. Mets qualifPlus à true dans l'outil enregistrer_prospect. Sois chaleureux et efficace (pas besoin de redemander les coordonnées avant d'appeler l'outil).

INTERFACE MOBILE À BOUTONS (très important) : le client est sur son téléphone. À CHAQUE FOIS que ta question a des réponses courtes et prévisibles (type de projet, nombre de pièces, type de logement, oui/non, étage, urgence...), termine ton message par UNE SEULE ligne tout à la fin au format exact : "OPTIONS: choix1 | choix2 | choix3" (3 à 5 options courtes). Le client cliquera dessus. Pour une question OUVERTE (décrire librement le besoin, préciser une adresse), NE mets PAS de ligne OPTIONS. Ne mets jamais d'OPTIONS sur le message final de récap.

PHOTOS : le client a un bouton pour joindre des photos, mais il n'apparaît QUE quand tu le proposes. Propose-le UNE SEULE FOIS, vers la FIN de la qualification (juste avant de conclure), et SEULEMENT pour une INSTALLATION (inutile pour un entretien ou un dépannage). Justifie le gain de temps, par exemple : "Pour gagner du temps et éviter peut-être un déplacement, vous pouvez ajouter une ou deux photos : l'emplacement souhaité, le mur, l'unité extérieure, et votre tableau électrique (ça nous dit si une simple ligne électrique suffit)." Pour faire apparaître le bouton, termine CE message précis par une ligne contenant uniquement [[PHOTO]]. Ne mets [[PHOTO]] sur aucun autre message. Le client peut refuser : dans ce cas, conclus normalement.`;

      // RDV de visite : uniquement si l'équipe a ouvert des créneaux. Alex propose, le portail
      // affiche les VRAIS créneaux (Alex n'invente jamais de date/heure).
      const slotsDispo = await getOpenSlots(1);
      if (slotsDispo.length > 0) {
        extraSystem += `\n\nRENDEZ-VOUS DE VISITE : des créneaux de visite sont disponibles. Une fois le besoin qualifié (idéalement pour une installation), propose UNE fois au client de fixer un rendez-vous de visite avec un conseiller, par exemple : "Souhaitez-vous que je vous propose un créneau de visite pour affiner votre projet sur place ?" Pour afficher les créneaux réels, termine CE message par une ligne contenant uniquement [[RDV]]. NE DONNE JAMAIS toi-même de date ou d'heure (c'est le portail qui affiche les créneaux réservables). Ne mets [[RDV]] qu'une seule fois. Le client reste libre de refuser.`;
      }
    }

    // Prompt caching : le gros prompt système STATIQUE (~4500 tokens, identique à chaque tour et
    // entre visiteurs) est marqué cache_control -> relu à ~0,1x du prix au lieu d'être refacturé
    // plein tarif à chaque message. La partie dynamique (consignes + prospect identifié) reste
    // hors cache, après.
    // max_tokens porté de 400 à 1024 : à 400, le modèle qui écrivait son message PUIS le marqueur
    // se faisait couper au milieu du marqueur ("LEAD_READ"), et le prospect était perdu. Le JSON
    // de l'outil compte aussi dans les tokens de sortie : il faut de la marge.
    const modelParams = {
      model: "claude-haiku-4-5-20251001" as const,
      max_tokens: 1024,
      system: [
        { type: "text" as const, text: baseSystem, cache_control: { type: "ephemeral" as const } },
        ...(extraSystem ? [{ type: "text" as const, text: extraSystem }] : []),
      ],
      // Les outils ne servent qu'au chat public (le mode « contact » ne crée rien).
      ...(mode === "contact" ? {} : { tools: ALEX_TOOLS }),
      messages,
    };

    // Post-traitement COMMUN aux deux modes (streaming / classique) : journalisation, APPELS
    // D'OUTILS (enregistrer_prospect / creer_ticket_sav / proposer_creneaux), filet de sécurité,
    // ou réponse normale. Retourne le payload JSON.
    const finishReply = async (msg: Anthropic.Message): Promise<Record<string, unknown>> => {
    const raw = texteDe(msg);

    // Log chaque échange (fire-and-forget)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    db.insert(logsAlex).values({
      id: createId(),
      sessionId: sid,
      action: mode === "contact" ? "message_contact" : "message",
      input: lastUserMsg?.content ?? "",
      output: raw.slice(0, 500),
    }).catch(() => {});

    // Mode contact : on renvoie juste la réponse, sans aucune logique lead/créneaux/SAV.
    if (mode === "contact") {
      return ({ message: raw });
    }

    // Détecter proposition de créneaux (outil)
    const creneauxInput = outilAppele(msg, TOOL_CRENEAUX);
    if (creneauxInput) {
      try {
        const data = creneauxInput as { interventionId?: string };
        const message = raw || "Je vous envoie les créneaux disponibles par email !";
        if (data?.interventionId) {
          const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
          await fetch(`${baseUrl}/api/proposer-creneaux`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-internal-secret": process.env.NEXTAUTH_SECRET ?? "" },
            body: JSON.stringify(data),
          });
        }
        return ({ message, creneauxSent: true });
      } catch (e) {
        console.error("[chat] erreur traitement proposer_creneaux:", e);
        return ({ message: "Les créneaux disponibles vous seront envoyés par email." });
      }
    }

    // Détecter si c'est un ticket SAV (outil)
    const savInput = outilAppele(msg, TOOL_SAV);
    if (savInput) {
      try {
        const data = savInput as { name?: string; phone?: string; subject?: string; description?: string };
        const message = raw || "Votre ticket SAV est bien enregistré, notre équipe vous rappelle en priorité.";

        if (data?.subject) {
          // Try to find existing client by phone
          let clientId: string | null = null;
          if (data.phone) {
            const [found] = await db.select({ id: clients.id }).from(clients).where(eq(clients.phone, data.phone)).limit(1);
            clientId = found?.id ?? null;
          }
          if (!clientId) {
            // Create minimal client record
            const newId = createId();
            await db.insert(clients).values({ id: newId, name: data.name ?? "Inconnu", phone: data.phone ?? "-" });
            clientId = newId;
          }
          const ticketId = createId();
          await db.insert(savTickets).values({ id: ticketId, clientId, subject: data.subject, description: data.description ?? null });
          const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
          if (admin) {
            await db.insert(notifications).values({
              id: createId(), adminId: null, type: "ticket_sav",
              titre: `SAV via Alex : ${data.subject}`,
              contenu: `${data.name}, ${data.phone}`,
              refType: "sav", refId: ticketId,
            });
          }
        }
        return ({ message, savComplete: true });
      } catch (e) {
        console.error("[chat] erreur traitement creer_ticket_sav:", e);
        return ({ message: "Votre demande SAV est bien enregistrée. Notre équipe vous rappelle en priorité." });
      }
    }

    // ── Prospect : 1) l'outil (voie normale), 2) un marqueur texte legacy, 3) le FILET ──
    let lead: LeadData | null = (outilAppele(msg, TOOL_PROSPECT) as LeadData | null) ?? leadLegacy(raw);
    let recupereParFilet = false;

    // FILET : Alex a répondu sans enregistrer, alors que le client a laissé son numéro. On relit la
    // conversation et on crée quand même la fiche (sauf refus de périmètre : clim mobile).
    const telRepere = !lead && !qualifLead ? telephoneDonne(messages) : null;
    if (telRepere && !refusPerimetre(raw)) {
      lead = await extraireProspectDeSecours(messages, telRepere);
      recupereParFilet = !!lead;
      if (lead) console.error("[chat] FILET: prospect récupéré alors qu'Alex n'a pas appelé l'outil", { sid, phone: lead.phone });
    }

    if (lead) {
      try {
        const message = raw || "Votre demande est bien enregistrée. Notre équipe vous contacte très prochainement !";

        // Mode qualif : on MET À JOUR le prospect existant (pas de doublon) + notif "qualifié".
        if (qualifLead && lead) {
          await updateLeadFromQualif(qualifLead, lead, messages);
          await notifyDevisBrouillon(qualifLead.id, qualifLead.name ?? lead.name ?? "Prospect", buildQualifFromAlex(lead));
          await flagEstimationBasse(qualifLead.id, qualifLead.name ?? "Prospect", lead);
          return ({ message, leadComplete: true, lead });
        }

        if (lead?.phone) {
          // Log lead_complete
          db.insert(logsAlex).values({
            id: createId(),
            sessionId: sid,
            action: "lead_complete",
            input: lead.phone,
            output: `${lead.project} · ${lead.location} · ${lead.estimate}`,
          }).catch(() => {});

          const transcript = buildTranscript(messages);
          const fullNotes = [
            lead.notes,
            lead.estimate ? `Estimation : ${lead.estimate}` : "",
            transcript ? `\n--- Conversation Alex ---\n${transcript}` : "",
          ].filter(Boolean).join("\n");

          // Normaliser le type de projet sur l'enum (évite l'échec d'insert si
          // l'IA renvoie "dépannage" accentué au lieu de "depannage")
          const VALID_PROJECTS = ["installation", "entretien", "depannage", "depose", "contrat-pro", "autre"] as const;
          const normalized = lead.project
            ? lead.project.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
            : "";
          const project = (VALID_PROJECTS as readonly string[]).includes(normalized)
            ? (normalized as typeof VALID_PROJECTS[number])
            : undefined;

          // Persister le lead EN PRIORITÉ : ne jamais le perdre à cause d'un
          // échec d'envoi d'email. En cas d'échec, log bruyant avec les données
          // brutes pour récupération manuelle.
          const qualifObj = buildQualifFromAlex(lead);

          // Anti-doublon : si un prospect ACTIF porte déjà ce numéro (client qui revient discuter),
          // on met à jour SA fiche (mêmes règles que le portail de qualif) au lieu d'en créer une 2e.
          const dejaConnu = await findActiveLeadByPhone(lead.phone).catch(() => null);
          if (dejaConnu) {
            // La fiche existe déjà : on l'enrichit toujours. En revanche, tant que c'est le FILET qui
            // repasse (il peut se déclencher à chaque tour tant qu'Alex n'appelle pas l'outil), on
            // reste SILENCIEUX : ni cloche, ni e-mail, ni notif de devis brouillon. Sinon le gérant
            // recevrait un e-mail et une notification à chaque message du client.
            await updateLeadFromQualif(dejaConnu, lead, messages, false); // chat public : pas une réponse au lien perso
            if (!recupereParFilet) {
              await notifyDevisBrouillon(dejaConnu.id, dejaConnu.name ?? lead.name ?? "Prospect", qualifObj);
              await flagEstimationBasse(dejaConnu.id, dejaConnu.name ?? "Prospect", lead);
              await db.insert(notifications).values({
                adminId: null, type: "nouveau_lead",
                titre: `Prospect déjà connu : ${dejaConnu.name} a reparlé à Alex`,
                contenu: "Sa fiche a été mise à jour (aucun doublon créé).",
                refType: "lead", refId: dejaConnu.id,
              }).catch((e) => console.error("[chat] notif re-contact:", e));
              sendLeadEmails(lead, messages).catch((e) => console.error("[chat] échec envoi email lead:", e));
            }
            return ({ message, leadComplete: true, lead });
          }

          try {
            const created = await createLead({
              source: "alex",
              name: lead.name,
              phone: lead.phone,
              email: lead.email || undefined,
              project,
              location: lead.location || undefined,
              address: lead.address || undefined,
              message: lead.estimate ? `Estimation : ${lead.estimate}` : undefined,
              notes: fullNotes || undefined,
              qualification: qualifObj, // pré-remplit « Qualification des besoins »
              // Consentement par défaut (opt-out) : Alex informe l'utilisateur en fin
              // d'échange qu'il sera recontacté uniquement par les équipes ClimExpert
              // sauf opposition de sa part. Permet la prospection ultérieure (cf. RGPD).
              consentementMarketing: lead.refuseContact !== true,
              consentementLe: new Date(),
              typeClient: String(lead.typeClient ?? "").toLowerCase().includes("pro") ? "professionnel" : "particulier",
            });
            // Notification équipe : un nouveau prospect vient d'être capté par Alex (le canal
            // principal du site n'alertait jamais la cloche, seul un e-mail partait).
            await db.insert(notifications).values({
              adminId: null, type: "nouveau_lead",
              titre: recupereParFilet ? `Nouveau prospect (Alex, rattrapé) : ${created.name}` : `Nouveau prospect (Alex) : ${created.name}`,
              contenu: `${created.phone}${lead.location ? ` · ${lead.location}` : ""}${lead.project ? ` · ${lead.project}` : ""}`
                + (recupereParFilet ? " · Alex n'avait pas enregistré la fiche, le filet de sécurité l'a rattrapée. Vérifiez les infos." : ""),
              refType: "lead", refId: created.id,
            }).catch((e) => console.error("[chat] notif nouveau lead:", e));
            // Qualif approfondie d'installation -> prévenir qu'un devis brouillon est prêt à valider.
            await notifyDevisBrouillon(created.id, created.name, qualifObj);
            await flagEstimationBasse(created.id, created.name, lead);
          } catch (e) {
            // Échec d'écriture (base indisponible, contrainte…). On ne perd pas le prospect en
            // silence : alerte avec le numéro à rappeler. Le transcript reste dans logs_alex.
            console.error("[chat] ÉCHEC createLead, lead potentiellement perdu:", e, JSON.stringify(lead));
            await db.insert(notifications).values({
              adminId: null, type: "alex_panne",
              titre: "Prospect à saisir à la main (échec d'enregistrement)",
              contenu: `${lead.name} · ${lead.phone}${lead.location ? ` · ${lead.location}` : ""}. La fiche n'a pas pu être créée : rappelez-le et saisissez-le manuellement.`,
            }).catch(() => {});
          }

          // Emails non bloquants (l'échec d'envoi ne doit pas masquer le succès du lead)
          sendLeadEmails(lead, messages).catch((e) => console.error("[chat] échec envoi email lead:", e));
        } else if (!qualifLead) {
          // Alex a conclu sans numéro exploitable : NE PAS afficher une fausse confirmation.
          // On alerte l'équipe et on redemande le numéro au client (filet anti-perte).
          console.error("[chat] prospect sans téléphone exploitable:", raw.slice(0, 500));
          await db.insert(notifications).values({
            adminId: null, type: "alex_panne",
            titre: "Lead Alex incomplet (sans téléphone)",
            contenu: `Alex a conclu sans numéro exploitable. Extrait : ${raw.slice(0, 200)}`,
          }).catch(() => {});
          return ({ fallback: true, message: "Presque terminé ! Il me manque juste votre numéro de téléphone pour qu'un conseiller vous rappelle. Vous pouvez me le laisser ici." });
        }

        return ({ message, leadComplete: true, lead });
      } catch (e) {
        console.error("[chat] erreur traitement prospect:", e);
        return ({ message: "Votre demande est bien enregistrée. Notre équipe vous contacte très prochainement !" });
      }
    }

    return ({ message: raw });
    };

    // ── Mode STREAMING (NDJSON, lignes {t:"d"|"done"}) : on streame les blocs de TEXTE. Les données
    // structurées voyagent maintenant dans des blocs `tool_use` séparés, jamais dans le texte : il
    // n'y a donc plus rien à masquer ni de marqueur à bufferiser. Seul garde-fou : si un modèle
    // écrivait encore un marqueur legacy, on coupe le flux à cet endroit pour ne pas afficher de
    // JSON au client (le message propre part quand même dans l'évènement `done`). ──
    if (wantStream) {
      const encoder = new TextEncoder();
      const RETENUE = 16; // caractères gardés en réserve : évite d'émettre un marqueur à cheval sur 2 chunks
      const stream = new ReadableStream({
        async start(controller) {
          const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
          let acc = "";
          let enAttente = "";
          let coupe = false;
          try {
            const s = client.messages.stream(modelParams);
            for await (const ev of s) {
              if (ev.type !== "content_block_delta" || ev.delta.type !== "text_delta") continue;
              acc += ev.delta.text;
              if (coupe) continue;
              if (MARQUEUR_LEGACY.test(acc)) { coupe = true; enAttente = ""; continue; }
              enAttente += ev.delta.text;
              if (enAttente.length > RETENUE) {
                send({ t: "d", v: enAttente.slice(0, enAttente.length - RETENUE) });
                enAttente = enAttente.slice(enAttente.length - RETENUE);
              }
            }
            if (!coupe && enAttente) send({ t: "d", v: enAttente });
            send({ t: "done", ...(await finishReply(await s.finalMessage())) });
          } catch (e) {
            console.error("Chat stream error:", e);
            await notifyPannePublic();
            send({ t: "done", fallback: true, message: FALLBACK_MESSAGE });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // ── Mode classique (compatibilité) ──
    const response = await client.messages.create(modelParams);
    return NextResponse.json(await finishReply(response));
  } catch (error) {
    console.error("Chat API error:", error);
    // Panne de l'IA (API indisponible, quota, timeout...) : on ne perd PAS le prospect.
    // 1) Alerte équipe, throttlée à 1 notification / 15 min pour ne pas noyer la cloche pendant
    //    un incident. 2) Le client voit un message de secours + un mini-formulaire (nom, tél)
    //    affiché par l'interface (flag fallback), qui crée le lead via /api/chat/sos.
    await notifyPannePublic();
    return NextResponse.json({ fallback: true, message: FALLBACK_MESSAGE });
  }
}

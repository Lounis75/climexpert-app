/**
 * Jeu de tests du script d'Alex : rejoue des conversations types contre le prompt RÉEL
 * (lib/alex-prompt.ts) et vérifie les comportements critiques. À lancer avant tout déploiement
 * qui touche le prompt :
 *
 *   npx dotenv -e .env.local -- npx tsx scripts/test-alex.ts
 *
 * Coût : quelques centimes (Haiku, temperature 0 pour la reproductibilité).
 */
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../lib/alex-prompt";
import { ALEX_TOOLS, TOOL_PROSPECT } from "../lib/alex-tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
type Msg = { role: "user" | "assistant"; content: string };

/** Un tour d'Alex : son texte + l'éventuel appel de l'outil enregistrer_prospect. */
async function reply(messages: Msg[]): Promise<{ text: string; lead: Record<string, unknown> | null }> {
  const r = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    temperature: 0,
    system: SYSTEM_PROMPT,
    tools: ALEX_TOOLS,
    messages,
  });
  const text = r.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
  const call = r.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_PROSPECT);
  return { text, lead: call ? (call.input as Record<string, unknown>) : null };
}

/** Déroule une conversation : envoie chaque message utilisateur, accumule les réponses. */
async function converse(userTurns: string[]): Promise<{ transcript: Msg[]; last: string; all: string; lead: Record<string, unknown> | null; leadTurn: number }> {
  const transcript: Msg[] = [];
  let last = "";
  let lead: Record<string, unknown> | null = null;
  let leadTurn = -1;
  for (const u of userTurns) {
    transcript.push({ role: "user", content: u });
    const r = await reply(transcript);
    last = r.text;
    if (r.lead && !lead) { lead = r.lead; leadTurn = transcript.length; }
    // L'API refuse un message assistant vide : si Alex n'a produit qu'un appel d'outil, on pose un marqueur interne.
    transcript.push({ role: "assistant", content: last || "(fiche prospect enregistrée)" });
  }
  return { transcript, last, all: transcript.filter((m) => m.role === "assistant").map((m) => m.content).join("\n\n"), lead, leadTurn };
}

// Une réponse est FERMÉE si elle ne contient ni question ni demande de coordonnées : le client
// croit la conversation terminée et part (bug réel du 4 juillet : estimation donnée sans suite).
// Exceptions légitimes : le message final qui accompagne l'appel de l'outil, et le refus clim mobile.
function reponsesFermees(transcript: Msg[], leadTurn: number): string[] {
  const out: string[] = [];
  let apresLead = false;
  for (let i = 0; i < transcript.length; i++) {
    const m = transcript[i];
    if (m.role !== "assistant") continue;
    if (leadTurn >= 0 && i >= leadTurn) { apresLead = true; continue; } // le tour d'enregistrement clôt légitimement
    if (apresLead) continue; // au revoir post-récap : la conversation est légitimement terminée
    if (/mobile|portable/i.test(m.content)) continue;
    if (/\?/.test(m.content) || /(besoin de quelques infos|prénom et nom|numéro de téléphone|vos coordonnées|envoyer des photos)/i.test(m.content)) continue;
    out.push(m.content.slice(-140));
  }
  return out;
}

let failures = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✅" : "❌"} ${name}${!ok && detail ? `\n   → ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  console.log("Jeu de tests Alex (prompt réel, temperature 0)\n");

  // ── 1. Installation 5 pièces : doit aboutir à un appel d'outil complet, prix ≥ plancher ──
  {
    const { transcript, last, lead, leadTurn } = await converse([
      "Bonjour, je veux installer la climatisation",
      "Appartement",
      "5 pièces",
      "75013",
      "Non, pas de copropriété, et pas de préférence de marque",
      "Marc Test, 0612345678, 35 rue de la Glacière 75013 Paris, marc.test@gmail.com",
      "Non merci, pas d'autres questions, c'est tout bon",
    ]);
    check("1. Installation 5 pièces → outil enregistrer_prospect appelé", !!lead, last.slice(0, 200));
    if (lead) {
      check("   project = installation", lead.project === "installation", String(lead.project));
      check("   téléphone capté", String(lead.phone ?? "").replace(/\D/g, "").includes("612345678"), String(lead.phone));
      check("   e-mail capté (nécessaire pour envoyer le devis)", /marc\.test@gmail\.com/i.test(String(lead.email ?? "")), `email="${lead.email}"`);
      const est = parseInt(String(lead.estimate ?? "").replace(/[\s  ]/g, "").match(/(\d{3,6})/)?.[1] ?? "0", 10);
      check("   estimation ≥ 9 000 € (plancher 4+ pièces)", est >= 9000, `estimate="${lead.estimate}"`);
    }
    // RÉPONSE JAMAIS FERMÉE (bug réel du 4 juillet) : chaque message d'Alex doit se terminer par
    // une question ou une prochaine étape, sinon le client croit la conversation finie et part.
    const fermees1 = reponsesFermees(transcript, leadTurn);
    check("   aucune réponse fermée dans toute la conversation", fermees1.length === 0,
      fermees1.map((f) => `« ...${f} »`).join(" | "));
    // CONCISION (retour utilisateur du 5 juillet : « trop de texte ») : le message
    // estimation + coordonnées doit être compact et en liste à puces, pas un pavé.
    const estimCoord = transcript.filter((m) => m.role === "assistant")
      .find((m) => /(il me faut|prénom et nom)/i.test(m.content));
    check(
      "   demande les jours/horaires de préférence",
      !!estimCoord && /(préférence|horaires|jours)/i.test(estimCoord.content),
      estimCoord ? estimCoord.content.slice(-200) : "pas de message coordonnées",
    );
    check(
      "   coordonnées en liste à puces, message compact (≤ 620 car.)",
      !!estimCoord && estimCoord.content.includes("•") && estimCoord.content.length <= 620,
      estimCoord ? `${estimCoord.content.length} caractères, puces=${estimCoord.content.includes("•")} : « ${estimCoord.content.slice(0, 220).replace(/\n/g, " ⏎ ")}… »` : "pas de message de demande de coordonnées trouvé",
    );
  }

  // ── 2. Clim mobile : doit REFUSER poliment, ne PAS enregistrer de prospect ──
  {
    const { all, lead } = await converse([
      "Bonjour, ma clim mobile ne refroidit plus, vous pouvez venir la réparer ?",
      "Oui c'est un climatiseur mobile monobloc sur roulettes",
    ]);
    check("2. Clim mobile → hors périmètre annoncé", /mobile|portable/i.test(all) && /(ne prenons pas|pas en charge|spécialisés)/i.test(all), all.slice(-300));
    check("   aucun prospect enregistré sur une clim mobile", !lead, "outil appelé à tort");
  }

  // ── 3. Entretien 2 unités : doit proposer le CONTRAT annuel (200 €) ──
  {
    const { transcript, all, leadTurn } = await converse([
      "Bonjour, je voudrais faire entretenir ma climatisation",
      "Appartement, 2 unités intérieures, facilement accessibles",
      "75015 Paris",
      "Jamais entretenues je crois, au moins 4 ans",
      "Oui, dites-moi le prix",
    ]);
    check("3. Entretien → contrat annuel proposé", /contrat/i.test(all), all.slice(-300));
    check(
      "   question du dernier entretien posée",
      transcript.some((m) => m.role === "assistant" && /(entreten|révision|nettoyage|dernière visite)/i.test(m.content) && /\?/.test(m.content)),
      "Questions posées : " + transcript.filter((m) => m.role === "assistant" && /\?/.test(m.content)).map((m) => m.content.replace(/\n/g, " ").slice(0, 90)).join(" | ").slice(0, 500),
    );
    check("   majoration > 3 ans annoncée (+100)", /(100\s*€|remise à niveau|majoration)/i.test(all), all.slice(-300));
    const fermees3 = reponsesFermees(transcript, leadTurn);
    check("   aucune réponse fermée (entretien)", fermees3.length === 0, fermees3.map((f) => `« ...${f} »`).join(" | "));
    check("   prix entretien cohérent (200 mentionné)", /200/.test(all), all.slice(-300));
  }

  // ── 4. Dépose : projet reconnu, outil appelé avec project=depose ──
  {
    const { lead } = await converse([
      "Bonjour, je veux faire retirer une vieille clim de ma façade",
      "1 unité, en façade au 2e étage, marque Airton",
      "Je déménage, pas de réinstallation. 92130 Issy-les-Moulineaux",
      "Paul Test, 0698765432, 10 rue du Test 92130 Issy, plutôt le matin en semaine, pas d'email",
      "Non, je n'ai vraiment pas d'e-mail",
    ]);
    check("4. Dépose → outil appelé avec project=depose", lead?.project === "depose", lead ? String(lead.project) : "outil non appelé");
    if (lead) check("   disponibilités captées (matin, dans disponibilites ou notes)", /matin/i.test(String(lead.disponibilites ?? "") + String(lead.notes ?? "")), `disponibilites="${lead.disponibilites}" notes="${lead.notes}"`);
  }

  // ── 5. Hors IDF : continue la qualification, note HORS IDF ──
  {
    const { last, lead } = await converse([
      "Bonjour, j'aimerais une installation de clim dans ma maison à Lyon",
      "Maison, 3 pièces",
      "69003 Lyon",
      "Julie Test, 0611223344, 5 rue du Test 69003 Lyon, pas d'email",
      "Non c'est tout, merci",
    ]);
    check("5. Hors IDF → qualification menée quand même", !!lead, last.slice(0, 200));
    if (lead) check("   HORS IDF signalé dans les notes", /hors idf/i.test(String(lead.notes ?? "") + String(lead.location ?? "")), String(lead.notes));
  }

  console.log(`\n${failures === 0 ? "🎉 Tous les tests passent." : `⚠️ ${failures} échec(s) : relisez le prompt avant de déployer.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

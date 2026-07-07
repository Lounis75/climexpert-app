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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
type Msg = { role: "user" | "assistant"; content: string };

async function reply(messages: Msg[]): Promise<string> {
  const r = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages,
  });
  return r.content[0].type === "text" ? r.content[0].text : "";
}

/** Déroule une conversation : envoie chaque message utilisateur, accumule les réponses. */
async function converse(userTurns: string[]): Promise<{ transcript: Msg[]; last: string; all: string }> {
  const transcript: Msg[] = [];
  let last = "";
  for (const u of userTurns) {
    transcript.push({ role: "user", content: u });
    last = await reply(transcript);
    transcript.push({ role: "assistant", content: last });
  }
  return { transcript, last, all: transcript.filter((m) => m.role === "assistant").map((m) => m.content).join("\n\n") };
}

function extractLeadJson(text: string): Record<string, unknown> | null {
  if (!text.includes("LEAD_READY")) return null;
  const m = text.match(/\{[\s\S]*?\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
}

// Une réponse est FERMÉE si elle ne contient ni question ni demande de coordonnées : le client
// croit la conversation terminée et part (bug réel du 4 juillet : estimation donnée sans suite).
// Exceptions légitimes : le message final LEAD_READY (récap) et le refus clim mobile.
function reponsesFermees(transcript: Msg[]): string[] {
  const out: string[] = [];
  let apresLead = false;
  for (const m of transcript) {
    if (m.role !== "assistant") continue;
    if (m.content.includes("LEAD_READY")) { apresLead = true; continue; }
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

  // ── 1. Installation 5 pièces : doit aboutir à LEAD_READY complet, prix ≥ plancher ──
  {
    const { transcript, last, all } = await converse([
      "Bonjour, je veux installer la climatisation",
      "Appartement",
      "5 pièces",
      "75013",
      "Non, pas de copropriété, et pas de préférence de marque",
      "Marc Test, 0612345678, 35 rue de la Glacière 75013 Paris, marc.test@gmail.com",
      "Non merci, pas d'autres questions, c'est tout bon",
    ]);
    const lead = extractLeadJson(last) ?? extractLeadJson(all);
    check("1. Installation 5 pièces → LEAD_READY émis", !!lead, last.slice(0, 200));
    if (lead) {
      check("   project = installation", lead.project === "installation", String(lead.project));
      check("   téléphone capté", String(lead.phone ?? "").replace(/\D/g, "").includes("612345678"), String(lead.phone));
      check("   e-mail capté (nécessaire pour envoyer le devis)", /marc\.test@gmail\.com/i.test(String(lead.email ?? "")), `email="${lead.email}"`);
      const est = parseInt(String(lead.estimate ?? "").replace(/[\s  ]/g, "").match(/(\d{3,6})/)?.[1] ?? "0", 10);
      check("   estimation ≥ 9 000 € (plancher 4+ pièces)", est >= 9000, `estimate="${lead.estimate}"`);
    }
    // RÉPONSE JAMAIS FERMÉE (bug réel du 4 juillet) : chaque message d'Alex doit se terminer par
    // une question ou une prochaine étape, sinon le client croit la conversation finie et part.
    const fermees1 = reponsesFermees(transcript);
    check("   aucune réponse fermée dans toute la conversation", fermees1.length === 0,
      fermees1.map((f) => `« ...${f} »`).join(" | "));
    // CONCISION (retour utilisateur du 5 juillet : « trop de texte ») : le message
    // estimation + coordonnées doit être compact et en liste à puces, pas un pavé.
    const estimCoord = transcript.filter((m) => m.role === "assistant")
      .find((m) => /(il me faut|prénom et nom)/i.test(m.content) && !m.content.includes("LEAD_READY"));
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

  // ── 2. Clim mobile : doit REFUSER poliment, ne PAS émettre LEAD_READY ──
  {
    const { all } = await converse([
      "Bonjour, ma clim mobile ne refroidit plus, vous pouvez venir la réparer ?",
      "Oui c'est un climatiseur mobile monobloc sur roulettes",
    ]);
    check("2. Clim mobile → hors périmètre annoncé", /mobile|portable/i.test(all) && /(ne prenons pas|pas en charge|spécialisés)/i.test(all), all.slice(-300));
    check("   pas de LEAD_READY sur une clim mobile", !all.includes("LEAD_READY"), "LEAD_READY émis à tort");
  }

  // ── 3. Entretien 2 unités : doit proposer le CONTRAT annuel (200 €) ──
  {
    const { transcript, all } = await converse([
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
    const fermees3 = reponsesFermees(transcript);
    check("   aucune réponse fermée (entretien)", fermees3.length === 0, fermees3.map((f) => `« ...${f} »`).join(" | "));
    check("   prix entretien cohérent (200 mentionné)", /200/.test(all), all.slice(-300));
  }

  // ── 4. Dépose : projet reconnu, LEAD_READY project=depose ──
  {
    const { last, all } = await converse([
      "Bonjour, je veux faire retirer une vieille clim de ma façade",
      "1 unité, en façade au 2e étage, marque Airton",
      "Je déménage, pas de réinstallation. 92130 Issy-les-Moulineaux",
      "Paul Test, 0698765432, 10 rue du Test 92130 Issy, plutôt le matin en semaine, pas d'email",
      "Non, je n'ai vraiment pas d'e-mail",
    ]);
    const lead = extractLeadJson(last) ?? extractLeadJson(all);
    check("4. Dépose → LEAD_READY project=depose", lead?.project === "depose", lead ? String(lead.project) : "pas de LEAD_READY");
    if (lead) check("   disponibilités captées (matin, dans disponibilites ou notes)", /matin/i.test(String(lead.disponibilites ?? "") + String(lead.notes ?? "")), `disponibilites="${lead.disponibilites}" notes="${lead.notes}"`);
  }

  // ── 5. Hors IDF : continue la qualification, note HORS IDF ──
  {
    const { last, all } = await converse([
      "Bonjour, j'aimerais une installation de clim dans ma maison à Lyon",
      "Maison, 3 pièces",
      "69003 Lyon",
      "Julie Test, 0611223344, 5 rue du Test 69003 Lyon, pas d'email",
      "Non c'est tout, merci",
    ]);
    const lead = extractLeadJson(last) ?? extractLeadJson(all);
    check("5. Hors IDF → qualification menée quand même", !!lead, last.slice(0, 200));
    if (lead) check("   HORS IDF signalé dans les notes", /hors idf/i.test(String(lead.notes ?? "") + String(lead.location ?? "")), String(lead.notes));
  }

  console.log(`\n${failures === 0 ? "🎉 Tous les tests passent." : `⚠️ ${failures} échec(s) : relisez le prompt avant de déployer.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

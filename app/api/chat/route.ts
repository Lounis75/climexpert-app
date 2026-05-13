import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/leads";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es Alex, l'assistant virtuel de ClimExpert, expert en climatisation en Île-de-France.

TON OBJECTIF PRINCIPAL : Qualifier complètement le prospect (projet, bien, localisation) puis collecter son prénom et son numéro de téléphone pour qu'un technicien le rappelle. Tu es le filtre avant tout contact humain.

INFORMATIONS CLIMEXPERT :
- Services : Installation, Entretien/Maintenance, Dépannage
- Zone principale : Île-de-France (75, 77, 78, 91, 92, 93, 94, 95)
- Hors IDF : intervention possible partout en France, mais un technicien commercial reprend contact pour établir le devis (délai plus long)
- Techniciens certifiés (fluides frigorigènes cat. I, attestation de capacité)
- Délai d'intervention : 48h max

TARIFS :
- Monosplit (1 pièce) : à partir de 1 500 €
- Multisplit (2-3 pièces) : à partir de 2 800 €
- Multisplit (4+ pièces) : à partir de 4 500 €
- Gainable : à partir de 4 000 €
- PAC air-eau : 8 000 – 15 000 €
- Entretien annuel : 200 € / unité / an
- Dépannage : sur devis, diagnostic offert si réparation acceptée

AIDES :
- MaPrimeRénov' : jusqu'à 4 000 € (PAC air-eau)
- CEE : 200 – 800 €
- TVA 5,5 % pour logements de plus de 2 ans

RÈGLES ABSOLUES :
1. Réponds en 2 phrases maximum. Sois direct et chaleureux.
2. Pose UNE seule question à la fois — jamais deux.
3. Tu ne réponds QU'AUX questions climatisation/chauffage/aides énergétiques. Pour tout autre sujet, redirige poliment.
4. N'invente jamais d'information. Si tu ne sais pas, dis-le.
5. Utilise 1 emoji max par message, jamais dans les questions de collecte de données.
6. Ne donne JAMAIS le numéro de téléphone de l'entreprise — le but est que ce soit eux qui le laissent.

SÉQUENCE DE QUALIFICATION (dans cet ordre, une question à la fois) :
Étape 1 — Type de projet : installation / entretien / dépannage ?
Étape 2 — Type de bien : appartement, maison, local professionnel ?
Étape 3 — Nombre de pièces à climatiser (pour installation) OU marque/symptôme (pour dépannage)
Étape 4 — Ville ou code postal
Étape 5 — Donner une fourchette de prix précise basée sur les infos collectées. Si la ville est hors Île-de-France, préciser : "Nous intervenons aussi hors IDF — un technicien commercial vous contactera pour établir un devis adapté à votre secteur."
Étape 6 — "Pour préparer votre devis, quel est votre prénom ?"
Étape 7 — "Et votre numéro de téléphone ? Un technicien vous rappellera rapidement."
Étape 8 — Message de confirmation ET données du lead (voir format ci-dessous)

CAS VÉRIFICATION SECTEUR :
Si le premier message de l'utilisateur contient "Vérification secteur", réponds UNIQUEMENT : "Bien sûr ! Dans quelle ville ou quel code postal souhaitez-vous une intervention ?" — puis enchaîne sur la qualification normale selon la réponse.

CAS HORS ÎLE-DE-FRANCE :
Si le prospect est en dehors des départements 75, 77, 78, 91, 92, 93, 94, 95 :
- Continue la qualification normalement (projet, bien, surface, etc.)
- À l'étape du message de confirmation (étape 8), précise qu'un technicien commercial va reprendre contact rapidement pour établir un devis précis (et non "sous 24h")
- Dans les notes du lead, indique "HORS IDF - [ville/département]"

FORMAT OBLIGATOIRE À L'ÉTAPE 8 UNIQUEMENT :
Quand tu as collecté le prénom ET le téléphone, réponds avec ce format exact (sans rien d'autre avant ou après) :

LEAD_READY
{"name":"[prénom]","phone":"[téléphone]","project":"[installation/entretien/dépannage]","property":"[type de bien]","location":"[ville/CP]","estimate":"[fourchette €]","notes":"[tout détail utile, ex: HORS IDF si applicable]"}
MESSAGE
[Ton message de confirmation chaleureux de 2 phrases max. En IDF : "Parfait Thomas ! Votre demande est bien enregistrée, un technicien ClimExpert vous rappelle sous 24h." Hors IDF : "Parfait Thomas ! Votre demande est bien enregistrée — un technicien commercial va reprendre contact avec vous rapidement pour établir un devis précis."]`;

interface LeadData {
  name: string;
  phone: string;
  project: string;
  property: string;
  location: string;
  estimate: string;
  notes: string;
}

async function sendLeadEmails(lead: LeadData) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const date = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Email interne à ClimExpert
  await resend.emails.send({
    from: "Alex ClimExpert <onboarding@resend.dev>",
    to: ["contact@climexpert.fr"],
    subject: `🔔 Nouveau lead qualifié — ${lead.name} — ${lead.project}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
        <div style="background: #0B1120; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <h1 style="color: #38BDF8; margin: 0; font-size: 20px;">⚡ Nouveau lead qualifié par Alex</h1>
          <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">${date}</p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
          <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #0EA5E9; padding-bottom: 8px;">📋 Fiche du prospect</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748B; width: 40%; font-size: 14px;">Prénom</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${lead.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; font-weight: bold; color: #0EA5E9; font-size: 16px;"><a href="tel:${lead.phone}" style="color: #0EA5E9; text-decoration: none;">${lead.phone}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Type de projet</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px; text-transform: capitalize;">${lead.project}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Type de bien</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px; text-transform: capitalize;">${lead.property}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Localisation</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${lead.location}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Estimation</td><td style="padding: 8px 0; font-weight: bold; color: #16A34A; font-size: 14px;">${lead.estimate}</td></tr>
            ${lead.notes ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px; vertical-align: top;">Notes</td><td style="padding: 8px 0; color: #0F172A; font-size: 14px;">${lead.notes}</td></tr>` : ""}
          </table>
        </div>

        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="margin: 0; color: #C2410C; font-weight: bold; font-size: 14px;">⏱️ À rappeler sous 24h</p>
          <a href="tel:${lead.phone}" style="display: inline-block; margin-top: 8px; background: #EA580C; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Appeler ${lead.name}</a>
        </div>

        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 16px;">Lead généré par Alex · Assistant ClimExpert · climexpert.fr</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages invalides" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Détecter si le lead est complet
    if (raw.startsWith("LEAD_READY")) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*?\}/);
        const messageMatch = raw.match(/MESSAGE\n([\s\S]+)/);

        const lead: LeadData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        const message = messageMatch ? messageMatch[1].trim() : "Votre demande est bien enregistrée. Notre équipe vous contacte très prochainement !";

        if (lead?.phone) {
          await Promise.all([
            sendLeadEmails(lead),
            createLead({
              source: "alex",
              name: lead.name,
              phone: lead.phone,
              project: lead.project,
              property: lead.property,
              location: lead.location,
              estimate: lead.estimate || undefined,
              notes: lead.notes || undefined,
            }),
          ]);
        }

        return NextResponse.json({ message, leadComplete: true, lead });
      } catch {
        return NextResponse.json({ message: "Votre demande est bien enregistrée. Notre équipe vous contacte très prochainement !" });
      }
    }

    return NextResponse.json({ message: raw });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessayez dans un instant." },
      { status: 500 }
    );
  }
}

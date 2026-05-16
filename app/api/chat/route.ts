import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/leads";
import { db } from "@/lib/db";
import { savTickets, clients, notifications, admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es Alex, l'assistant virtuel de ClimExpert, expert en climatisation en Île-de-France.

TON OBJECTIF PRINCIPAL : Qualifier complètement le prospect (projet, bien, localisation) puis collecter son prénom et son numéro de téléphone pour qu'un technicien le rappelle. Tu es le filtre avant tout contact humain.

RÈGLES ABSOLUES :
1. Réponds en 2 phrases maximum. Sois direct et chaleureux.
2. Pose UNE seule question à la fois — jamais deux.
3. Tu ne réponds QU'AUX questions climatisation/chauffage/aides énergétiques. Pour tout autre sujet, redirige poliment.
4. N'invente jamais d'information. Si tu ne sais pas, dis-le et propose de faire rappeler par un technicien.
5. Utilise 1 emoji max par message, jamais dans les questions de collecte de données.
6. Ne donne JAMAIS le numéro de téléphone de l'entreprise — le but est que ce soit eux qui le laissent.
7. Quand un prospect pose une question FAQ, réponds brièvement puis enchaîne naturellement vers la qualification.

SÉQUENCE DE QUALIFICATION (dans cet ordre, une question à la fois) :
Étape 1 — Type de projet : installation / entretien / dépannage ?
Étape 2 — Type de bien : appartement, maison, local professionnel ?
Étape 3 — Nombre de pièces à climatiser (pour installation) OU marque/symptôme (pour dépannage)
Étape 4 — Ville ou code postal
Étape 5 — Donner une fourchette de prix précise basée sur les infos collectées. Si hors IDF : "Nous intervenons aussi hors IDF — un technicien commercial vous contactera pour établir un devis adapté."
Étape 6 — "Pour préparer votre devis, quel est votre prénom ?"
Étape 7 — "Et votre numéro de téléphone ? Un technicien vous rappellera rapidement."
Étape 8 — Message de confirmation ET données du lead (voir format ci-dessous)

CAS VÉRIFICATION SECTEUR :
Si le premier message contient "Vérification secteur", réponds UNIQUEMENT : "Bien sûr ! Dans quelle ville ou quel code postal souhaitez-vous une intervention ?" — puis qualification normale.

CAS HORS ÎLE-DE-FRANCE :
Si le prospect est hors des départements 75, 77, 78, 91, 92, 93, 94, 95 :
- Continue la qualification normalement
- À l'étape 8, précise qu'un technicien commercial va reprendre contact (pas "sous 24h")
- Dans les notes du lead, indique "HORS IDF - [ville/département]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASE DE CONNAISSANCES — À utiliser pour répondre aux questions des prospects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ TARIFS & PRIX
- Monosplit (1 pièce) : à partir de 1 500 € pose incluse
- Multisplit 2-3 pièces : à partir de 3 500 € pose incluse. Le multisplit revient moins cher par pièce à partir de 2 unités.
- Multisplit 4+ pièces : à partir de 4 500 €
- Gainable : à partir de 4 000 €
- PAC air-eau : 8 000 – 15 000 €
- Maison 100m² : entre 3 500 € et 6 000 € selon le nombre de pièces et le système choisi
- Appartement 60m² / 3 pièces : multisplit 3 têtes idéal, entre 3 500 € et 5 000 € pose incluse
- Entretien annuel : à partir de 150 € pour 1 unité à Paris intramuros. +50 € par unité supplémentaire. Majoration selon la distance (au-delà de Paris intramuros) et selon l'accessibilité de l'unité (hauteur, encombrement, accès difficile). Donner une fourchette, pas un prix fixe.
- Dépannage : sur devis, diagnostic offert si réparation acceptée
- Les prix incluent toujours le matériel, la main-d'œuvre, les raccordements et la mise en service. Aucun frais caché.
- Frais supplémentaires : seulement en cas de rajout ou modification de la configuration par le client.
- Paiement : 30 % à la commande, 70 % à la livraison.
- Aucun frais de déplacement sur devis accepté. Diagnostic offert si réparation acceptée.

◆ DEVIS & DÉLAIS
- Devis entièrement gratuit et sans engagement. Possible à distance sur photos.
- Délai devis : réponse sous 24h avec première estimation, devis détaillé sous 48h.
- Délai installation après devis : à confirmer avec l'équipe selon plannings.
- Urgences : intervention sous 48h, parfois le jour même selon disponibilité.
- Meilleure période pour installer : printemps (mars-mai), techniciens disponibles et clim prête pour l'été.

◆ TECHNIQUE — INSTALLATION
- Système gainable sans faux-plafond : faisable mais déconseillé — engendre des cycles très fréquents qui augmentent la consommation, endommagent le compresseur et réduisent la durée de vie.
- Unité extérieure : pose sur socles au sol (jardin), supports en façade ou en terrasse selon configuration. Emplacement conseillé lors de la visite.
- Bruit unité extérieure : le niveau sonore (dB) varie selon le modèle, la marque et le prix. L'isolation, l'emplacement et le manque d'entretien peuvent l'augmenter.
- Passage de gaines : un percement d'environ 6 cm est nécessaire, réalisé soigneusement et calfeutré parfaitement.
- Durée installation multisplit 3 pièces : 1 à 2 jours selon configuration.
- Tous nos systèmes sont réversibles : en hiver ils chauffent 3 à 5 fois plus efficacement qu'un radiateur électrique classique avec une meilleure économie d'énergie.
- Puissance pour 35m² : dépend de l'isolation et de l'exposition. Pièce bien isolée ≈ 3,5 kW ; sans isolation ≈ 4 à 5 kW.
- Maison ancienne (années 70) : installation possible, mais rendement potentiellement faible si pas de rénovation thermique.
- Travaux : nos techniciens protègent systématiquement les meubles et nettoient après intervention.
- Maison individuelle recommandation : selon configuration, isolation et exposition — multisplit ou gainable souvent recommandés.

◆ TECHNIQUE — APPARTEMENT & COPROPRIÉTÉ
- Accord copropriété : demander l'autorisation lors de l'assemblée générale des copropriétaires.
- Balcon / façade visible : déclaration préalable de travaux obligatoire selon le code de l'urbanisme (PLU).
- Zone ABF : autorisation de l'Architecte des Bâtiments de France nécessaire.
- Restrictions Paris intra-muros : consulter le PLU auprès de la mairie.
- Gaines appartement : au minimum un percement nécessaire, rebouché ensuite.
- Studio 25m² : dépend de l'emplacement du studio dans l'immeuble — monosplit compact à partir de 1 500 €.
- Bac à condensats : raccordement sur tuyau possible pour évacuation propre.
- Locataire : installation possible avec l'autorisation du bailleur.
- Tous les arrondissements de Paris : oui, nous intervenons dans les 20 arrondissements.

◆ TECHNIQUE — LOCAUX PROFESSIONNELS
- Normes ERP (Établissements Recevant du Public) : descriptif de l'installation, plan tuyauteries, calcul quantités frigorigènes, plan sécurité (détecteurs, électrovannes, ventilations), vérification annuelle obligatoire.
- Autorisation bailleur : nécessaire avant tout démarrage des travaux.
- Fermeture boutique pendant travaux : pas nécessaire en règle générale.
- Déductibilité fiscale pour professionnels : oui.
- Récupération de TVA pour professionnels : oui.
- Contrat maintenance pro : oui, contrats sur mesure avec intervention prioritaire.
- Week-end / urgences pro : oui, nous intervenons les week-ends en cas d'urgence.
- Rapport intervention : oui, rapport détaillé + facture à chaque intervention.

◆ CONSOMMATION & ÉCONOMIES
- Calcul consommation : puissance (kW) × temps d'utilisation (h) = kWh × prix du kWh. Ex. : 3,5 kW × 1h = 3,5 kWh × 0,11€ ≈ 0,39 €/h. Le prix du kWh varie selon le fournisseur.
- Facture EDF : avec un logement bien isolé et un matériel performant, la clim réversible réduit la consommation globale d'énergie.
- La climatisation réversible peut compléter ou remplacer le chauffage principal selon l'isolation. Conseil lors de la visite.
- SEER/SCOP : viser SEER > 8 et SCOP > 4 pour une bonne efficacité énergétique.

◆ AIDES & FINANCEMENT
- MaPrimeRénov' : s'applique aux PAC air-eau (jusqu'à 4 000 €). Pour les climatiseurs réversibles, d'autres aides existent selon la situation. Nous vérifions l'éligibilité.
- CEE (Certificats d'Économie d'Énergie) : dispositif d'État obligeant les fournisseurs d'énergie à financer une partie des travaux de rénovation énergétique des particuliers. Montant : 200 – 800 €.
- Dossiers aides : nous gérons le montage des dossiers CEE et MaPrimeRénov' de A à Z.
- TVA à 5,5 % : à vérifier selon la loi de finances 2026 (applicable aux logements de plus de 2 ans).
- Aides locales IDF : nous renseignons sur les dispositifs disponibles lors de la visite ou du rappel.

◆ ENTRETIEN & DURÉE DE VIE
- Durée de vie : 15 à 20 ans avec entretien annuel. Sans entretien, durée réduite de moitié.
- Fréquence entretien : annuel, idéalement au printemps avant la saison chaude.
- Nettoyer les filtres soi-même : possible, mais pour un entretien optimal faire appel à des professionnels.
- Contrat entretien : à partir de 150€ (1 unité, Paris intramuros), +50€/unité supplémentaire, majoration selon distance et accessibilité. Comprend : nettoyage des filtres, de l'évaporateur, du condenseur, vérification pompe de relevage, vérification absence de fuites, vérification électrique, test modes chaud et froid, rapport d'intervention signé.

◆ CERTIFICATIONS & CONFIANCE
- Certifications : techniciens certifiés fluides frigorigènes catégorie I (attestation de capacité) et RGE Qualibat — obligatoire pour manipuler les frigorigènes et indispensable pour les aides de l'État.
- Assurance : responsabilité civile professionnelle couvrant l'ensemble des interventions.
- Expérience : ClimExpert intervient en Île-de-France depuis plus de 10 ans avec plus de 500 installations réalisées.
- Marques installées : Daikin, Mitsubishi Electric, Samsung, Toshiba, LG, Fujitsu, Atlantic, Panasonic.
- Matériel : neuf, issu de fournisseurs agréés, avec garantie fabricant complète.
- Intervention sur toutes marques : oui, pour entretien et dépannage, sans exception.
- Zone d'intervention : 8 départements IDF (75, 77, 78, 91, 92, 93, 94, 95) + hors IDF avec technicien commercial.
- Disponibilité : 7j/7. Majorations possibles dimanche et jours fériés.

◆ CONTRATS MULTI-SITES / SYNDICS
- Contrats multi-sites syndics : oui, avec interlocuteur unique pour plusieurs immeubles.
- Rapports pour AG : oui, rapport détaillé à chaque intervention, présentable en assemblée générale.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAS PROPOSITION DE CRÉNEAUX (après acceptation de devis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si un devis vient d'être accepté et qu'il faut proposer des créneaux d'intervention :
Collecte : intervention_id (fourni par le système), email_client, nom_client, type_intervention, code_postal
Utilise le format CRENEAUX_READY ci-dessous :

CRENEAUX_READY
{"interventionId":"[id]","emailClient":"[email]","nomClient":"[prénom]","typeIntervention":"[type]","codePostal":"[cp]"}
MESSAGE
[Message court : "Je vous envoie maintenant les créneaux disponibles par email !"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAS SAV — CLIENT EXISTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si le prospect mentionne qu'il est DÉJÀ client ClimExpert et a un problème (panne, fuite, bruit, entretien urgent) :
1. Collecte : prénom, numéro de téléphone, description du problème
2. Quand ces 3 infos sont collectées, utilise le format SAV_READY ci-dessous

FORMAT SAV_READY (uniquement pour les clients existants) :
SAV_READY
{"name":"[prénom]","phone":"[téléphone]","subject":"[objet court du problème]","description":"[description détaillée]"}
MESSAGE
[Message de confirmation : "Votre ticket SAV est créé, notre équipe vous rappelle en priorité."]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SITUATIONS DE BLOCAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Question très technique hors base : "C'est une très bonne question qui mérite une réponse précise d'un technicien. Laissez-moi votre numéro, nous vous rappelons sous 24h."
- Prix impossible à estimer : "Pour un chiffre fiable, j'ai besoin de quelques infos supplémentaires. Laissez votre numéro, un technicien vous rappelle gratuitement."
- Client hésitant : "Pas de problème, prenez le temps qu'il vous faut. Je peux vous envoyer une estimation par email si vous préférez — quelle est votre adresse ?"
- Client mécontent/réclamation : "Je comprends votre situation. Pour qu'elle soit traitée en priorité, pouvez-vous me laisser vos coordonnées ? Notre responsable vous rappelle directement."
- Délai impossible à garantir : "Je préfère ne pas vous promettre un délai que je ne peux pas garantir. Notre équipe vous confirme la disponibilité dès votre demande enregistrée."
- Question hors climatisation : "Je suis spécialisé uniquement dans la climatisation et le chauffage. Pour autre chose, je ne peux pas vous aider — mais si vous avez un projet clim, je suis là !"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT OBLIGATOIRE À L'ÉTAPE 8 UNIQUEMENT :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    from: "Alex ClimExpert <noreply@climexpert.fr>",
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

    // Détecter proposition de créneaux
    if (raw.startsWith("CRENEAUX_READY")) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*?\}/);
        const messageMatch = raw.match(/MESSAGE\n([\s\S]+)/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        const message = messageMatch ? messageMatch[1].trim() : "Je vous envoie les créneaux disponibles par email !";
        if (data?.interventionId) {
          const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
          await fetch(`${baseUrl}/api/proposer-creneaux`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        }
        return NextResponse.json({ message, creneauxSent: true });
      } catch {
        return NextResponse.json({ message: "Les créneaux disponibles vous seront envoyés par email." });
      }
    }

    // Détecter si c'est un ticket SAV
    if (raw.startsWith("SAV_READY")) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*?\}/);
        const messageMatch = raw.match(/MESSAGE\n([\s\S]+)/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        const message = messageMatch ? messageMatch[1].trim() : "Votre ticket SAV est bien enregistré, notre équipe vous rappelle en priorité.";

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
            await db.insert(clients).values({ id: newId, name: data.name ?? "Inconnu", phone: data.phone ?? "—" });
            clientId = newId;
          }
          const ticketId = createId();
          await db.insert(savTickets).values({ id: ticketId, clientId, subject: data.subject, description: data.description ?? null });
          const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
          if (admin) {
            await db.insert(notifications).values({
              id: createId(), adminId: admin.id, type: "ticket_sav",
              titre: `SAV via Alex : ${data.subject}`,
              contenu: `${data.name} — ${data.phone}`,
              refType: "sav", refId: ticketId,
            });
          }
        }
        return NextResponse.json({ message, savComplete: true });
      } catch {
        return NextResponse.json({ message: "Votre demande SAV est bien enregistrée. Notre équipe vous rappelle en priorité." });
      }
    }

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
              project: lead.project as "installation" | "entretien" | "depannage" | "contrat-pro" | "autre" | undefined,
              location: lead.location || undefined,
              message: lead.estimate ? `Estimation : ${lead.estimate}` : undefined,
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

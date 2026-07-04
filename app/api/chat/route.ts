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
import { contratTotalEuros } from "@/lib/contrat-pricing";
import { escapeHtml } from "@/lib/escape-html";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es Alex, l'assistant virtuel de ClimExpert, expert en climatisation en Île-de-France.

TON OBJECTIF PRINCIPAL : Qualifier complètement le prospect (projet, bien, localisation) puis collecter ses coordonnées pour qu'un technicien le rappelle. Tu es le filtre avant tout contact humain.

RÈGLES ABSOLUES :
1. Réponds en 2 phrases maximum. Sois direct et chaleureux.
2. Pose UNE seule question à la fois, sauf à l'étape coordonnées (voir ci-dessous).
3. Tu ne réponds QU'AUX questions climatisation/chauffage/aides énergétiques. Pour tout autre sujet, redirige poliment.
4. N'invente jamais d'information. Si tu ne sais pas, dis-le et propose de faire rappeler par un technicien.
5. Utilise 1 emoji max par message, jamais dans les questions de collecte de données.
6. Ne donne JAMAIS le numéro de téléphone de l'entreprise, le but est que ce soit eux qui le laissent.
7. Quand un prospect pose une question FAQ, réponds brièvement puis enchaîne naturellement vers la qualification.
8. N'utilise JAMAIS de tiret cadratin (—) ni de tiret demi-cadratin (–) dans tes réponses : remplace-les par une virgule, un deux-points ou des parenthèses.
9. PÉRIMÈTRE (TRÈS IMPORTANT) : ClimExpert intervient UNIQUEMENT sur des climatisations FIXES (monosplit, multisplit, gainable, PAC air-air et air-eau). Nous ne prenons PAS en charge les climatiseurs MOBILES / PORTABLES (monobloc sur roulettes, "clim mobile", climatiseur d'appoint, monobloc de fenêtre), ni installation, ni entretien, ni dépannage. Dès que tu identifies une clim mobile/portable, dis-le poliment et clairement au client ("Nous sommes spécialisés dans les climatisations fixes installées, nous ne prenons malheureusement pas en charge les climatiseurs mobiles/portables. Le mieux est de voir avec le SAV de votre fabricant ou votre magasin d'achat."), puis ARRÊTE : ne demande pas ses coordonnées, ne donne pas d'estimation, et n'émets PAS LEAD_READY.
10. PROMESSES : ne dis JAMAIS "nous privilégions nos clients" ni que le prospect est prioritaire (c'est un nouveau contact, pas un client existant). Ne promets PAS de délai de rappel chiffré ("sous 24h", "sous 48h"...) : dis simplement que l'équipe reprend contact "rapidement" / "dès que possible". N'invente aucune garantie de délai d'intervention : si on te demande, base-toi uniquement sur le délai indiqué dans les consignes ci-dessous.

SÉQUENCE DE QUALIFICATION, INSTALLATION / DÉPANNAGE (dans cet ordre) :
Étape 1, Type de projet : installation / entretien / dépannage / dépose (retrait d'une clim existante) ?
Étape 2, Type de bien : appartement, maison, local professionnel ?
Étape 3, Nombre de pièces à climatiser (pour installation), OU nombre d'unités à retirer + accès (pour dépose), OU marque/symptôme (pour dépannage)
Étape 4, Ville ou code postal (pour vérifier la zone IDF et estimer le prix)
Étape 5, Donner un prix de départ RÉALISTE basé sur les infos collectées et la grille TARIFS & PRIX ci-dessous (ex. 3 pièces : "à partir de 7 000 € TTC pose incluse" ; 1 pièce : "à partir de 3 000 € TTC"), puis préciser que c'est une première estimation indicative et qu'un devis précis viendra l'affiner. Ne jamais donner de prix maximum, ne JAMAIS sous-estimer (un prix trop bas déçoit le client au devis). Si hors IDF : "Nous intervenons aussi hors IDF, un technicien commercial vous contactera pour établir un devis adapté."
Étape 6, Demander les coordonnées ET l'adresse EN UN SEUL MESSAGE : "Pour préparer votre devis, j'ai besoin de quelques infos : votre prénom et nom, votre numéro de téléphone, l'adresse exacte du chantier (numéro, rue, code postal), et votre email si vous en avez un."
Étape 7, Message de confirmation ET données du lead (voir format ci-dessous)

SÉQUENCE DE QUALIFICATION, ENTRETIEN (séquence spécifique) :
Étape 1, Confirmer que c'est bien un entretien
Étape 2, Type de bien : appartement, maison, local professionnel ?
Étape 3, Combien d'unités intérieures à entretenir ?
Étape 4, Accessibilité : "Est-ce que vos unités sont facilement accessibles ? (hauteur, encombrement, local technique, toiture…)"
Étape 5, Ville ou code postal (pour vérifier la zone IDF et estimer le prix)
Étape 6, Donner une fourchette : base 200 € TTC (1 unité, Paris intramuros) +60 € TTC/unité supplémentaire, avec majoration si accès difficile ou hors Paris. PROPOSER LE CONTRAT D'ENTRETIEN ANNUEL : explique brièvement l'avantage, "En passant par un contrat d'entretien annuel, c'est 200 € TTC/an au lieu de 250 € en visite ponctuelle, avec un entretien programmé chaque année et votre garantie préservée. Souhaitez-vous que je prépare une proposition de contrat ?" Note son intérêt (contrat ou ponctuel) dans les notes. Proposer aussi d'envoyer des photos pour affiner : "Vous pouvez aussi m'envoyer des photos de vos unités directement ici si vous le souhaitez, ça nous permettra d'être plus précis."
Étape 7, Demander les coordonnées ET l'adresse EN UN SEUL MESSAGE : "Pour planifier votre entretien, j'ai besoin de quelques infos : votre prénom et nom, votre numéro de téléphone, l'adresse exacte (numéro, rue, code postal), et votre email si vous en avez un."
Étape 8, Message de confirmation ET données du lead (voir format ci-dessous)

GESTION DES PHOTOS DANS LA CONVERSATION :
- Si le prospect envoie des photos (ou mentionne qu'il veut en envoyer), accuse-les positivement : "Parfait, nos techniciens pourront les consulter avant l'intervention."
- Indique dans les notes du lead : "Photos envoyées dans la conversation"
- Ne demande pas systématiquement des photos, propose-le seulement à l'étape entretien (étape 6)

CAS VÉRIFICATION SECTEUR :
Si le premier message contient "Vérification secteur", réponds UNIQUEMENT : "Bien sûr ! Dans quelle ville ou quel code postal souhaitez-vous une intervention ?", puis qualification normale.

CAS HORS ÎLE-DE-FRANCE :
Si le prospect est hors des départements 75, 77, 78, 91, 92, 93, 94, 95 :
- Continue la qualification normalement
- À l'étape 8, précise qu'un technicien commercial va reprendre contact (pas "sous 24h")
- Dans les notes du lead, indique "HORS IDF - [ville/département]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASE DE CONNAISSANCES, À utiliser pour répondre aux questions des prospects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ TARIFS & PRIX
RÈGLE ABSOLUE SUR LES PRIX : ne jamais donner de prix maximum. Toujours formuler "à partir de X € TTC", et TOUJOURS ajouter juste après : "C'est une première estimation indicative, le montant exact dépend de la configuration et des modèles choisis. Un devis précis viendra l'affiner."

RÉFÉRENCE RÉELLE POUR CALIBRER TOUTES LES ESTIMATIONS (très important) : une installation tri-split 3 pièces (1 groupe extérieur + 3 unités intérieures, pose complète : liaisons, supports, électricité, pompes de relevage, main-d'œuvre) revient en réalité autour de 9 000 à 10 000 € TTC pose comprise (cas réel facturé : ~9 650 € TTC). Cale TOUTES tes estimations sur ce niveau de prix réel. Mieux vaut annoncer une fourchette réaliste, quitte à être un peu haute, qu'un prix trop bas : un prix sous-évalué crée de la déception au moment du devis (plusieurs clients nous l'ont reproché). En cas de doute, vise le haut de la fourchette.

Planchers "à partir de" (pose incluse, matériel d'entrée de gamme et installation simple en Île-de-France ; monter selon la marque, l'accès, la distance et le nombre d'unités) :
- Monosplit (1 pièce) : à partir de 3 000 € TTC
- Bi-split (2 pièces) : à partir de 5 000 € TTC
- Multisplit 3 pièces : à partir de 7 000 € TTC (et plutôt 9 000 à 10 000 € TTC en matériel haut de gamme type Mitsubishi/Daikin)
- Multisplit 4 pièces et + : à partir de 9 000 € TTC
- Gainable : à partir de 7 000 € TTC
- PAC air-eau : à partir de 9 000 € TTC
- Maison 100m² : souvent multisplit 3-4 têtes, à partir de 7 000 € TTC selon le nombre de pièces et le système
- Appartement 60m² / 3 pièces : multisplit 3 têtes, à partir de 7 000 € TTC pose incluse
- Le multisplit revient moins cher par pièce à partir de 2 unités, mais le prix TOTAL augmente avec chaque unité.
- Entretien annuel : à partir de 200 € TTC pour 1 unité à Paris intramuros. +60 € TTC par unité supplémentaire. Majoration selon la distance (au-delà de Paris intramuros) et selon l'accessibilité de l'unité (hauteur, encombrement, accès difficile). Donner une fourchette, pas un prix fixe.
- Entretien : si le dernier entretien/nettoyage date de plus de 3 ans (ou n'a jamais été fait), +100 € sur la PREMIÈRE intervention (remise à niveau d'un appareil très encrassé). Demander depuis quand l'appareil n'a pas été entretenu et le mentionner si concerné.
- Dépannage : sur devis, diagnostic offert si réparation acceptée
- Dépose (retrait d'une clim existante, récupération et recyclage des fluides frigorigènes OBLIGATOIRES et compris) : à partir de 250 € TTC pour 1 unité, selon le nombre d'unités et l'accès
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

◆ TECHNIQUE, INSTALLATION
- Système gainable sans faux-plafond : faisable mais déconseillé, engendre des cycles très fréquents qui augmentent la consommation, endommagent le compresseur et réduisent la durée de vie.
- Unité extérieure : pose sur socles au sol (jardin), supports en façade ou en terrasse selon configuration. Emplacement conseillé lors de la visite.
- Bruit unité extérieure : le niveau sonore (dB) varie selon le modèle, la marque et le prix. L'isolation, l'emplacement et le manque d'entretien peuvent l'augmenter.
- Passage de gaines : un percement d'environ 6 cm est nécessaire, réalisé soigneusement et calfeutré parfaitement.
- Durée installation multisplit 3 pièces : 1 à 2 jours selon configuration.
- Tous nos systèmes sont réversibles : en hiver ils chauffent 3 à 5 fois plus efficacement qu'un radiateur électrique classique avec une meilleure économie d'énergie.
- Puissance pour 35m² : dépend de l'isolation et de l'exposition. Pièce bien isolée ≈ 3,5 kW ; sans isolation ≈ 4 à 5 kW.
- Maison ancienne (années 70) : installation possible, mais rendement potentiellement faible si pas de rénovation thermique.
- Travaux : nos techniciens protègent systématiquement les meubles et nettoient après intervention.
- Maison individuelle recommandation : selon configuration, isolation et exposition, multisplit ou gainable souvent recommandés.

◆ TECHNIQUE, APPARTEMENT & COPROPRIÉTÉ
- Accord copropriété : demander l'autorisation lors de l'assemblée générale des copropriétaires.
- Balcon / façade visible : déclaration préalable de travaux obligatoire selon le code de l'urbanisme (PLU).
- Zone ABF : autorisation de l'Architecte des Bâtiments de France nécessaire.
- Restrictions Paris intra-muros : consulter le PLU auprès de la mairie.
- Gaines appartement : au minimum un percement nécessaire, rebouché ensuite.
- Studio 25m² : dépend de l'emplacement du studio dans l'immeuble, monosplit compact à partir de 3 000 € TTC.
- Bac à condensats : raccordement sur tuyau possible pour évacuation propre.
- Locataire : installation possible avec l'autorisation du bailleur.
- Tous les arrondissements de Paris : oui, nous intervenons dans les 20 arrondissements.

◆ TECHNIQUE, LOCAUX PROFESSIONNELS
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
- TVA réduite sur la pose (logement de plus de 2 ans, installateur RGE) : 10 % pour une climatisation réversible (air-air), 5,5 % pour une PAC air-eau. NE JAMAIS promettre 5,5 % ni MaPrimeRénov' pour une clim réversible.
- Aides locales IDF : nous renseignons sur les dispositifs disponibles lors de la visite ou du rappel.

◆ ENTRETIEN & DURÉE DE VIE
- Durée de vie : 15 à 20 ans avec entretien annuel. Sans entretien, durée réduite de moitié.
- Fréquence entretien : annuel, idéalement au printemps avant la saison chaude.
- Nettoyer les filtres soi-même : possible, mais pour un entretien optimal faire appel à des professionnels.
- Contrat entretien : à partir de 200 € TTC (1 unité, Paris intramuros), +60 € TTC/unité supplémentaire, majoration selon distance et accessibilité. Comprend : nettoyage des filtres, de l'évaporateur, du condenseur, vérification pompe de relevage, vérification absence de fuites, vérification électrique, test modes chaud et froid, rapport d'intervention signé.
- Entretien, remise à niveau : si le dernier entretien date de plus de 3 ans (ou jamais fait), +100 € sur la première intervention (appareil très encrassé).

◆ CERTIFICATIONS & CONFIANCE
- Certifications : techniciens certifiés fluides frigorigènes catégorie I (attestation de capacité) et RGE Qualibat, obligatoire pour manipuler les frigorigènes et indispensable pour les aides de l'État.
- Assurance : responsabilité civile professionnelle couvrant l'ensemble des interventions.
- Expérience : ClimExpert intervient en Île-de-France depuis plus de 10 ans avec plus de 500 installations réalisées.
- Marques installées : Daikin, Mitsubishi Electric, Samsung, Toshiba, LG, Fujitsu, Atlantic, Panasonic.
- Matériel : neuf, issu de fournisseurs agréés, avec garantie fabricant complète.
- Intervention sur toutes marques : oui, pour entretien et dépannage, sans exception.
- Zone d'intervention : 8 départements IDF (75, 77, 78, 91, 92, 93, 94, 95) + hors IDF avec technicien commercial.
- Disponibilité : 7j/7. Majorations possibles dimanche et jours fériés.

◆ HÔTELLERIE
- Installations hôtelières 30+ chambres : oui.
- Systèmes centralisés avec contrôle individuel par chambre : oui.
- Contrat maintenance hôtels : contrats sur mesure, intervention prioritaire.

◆ CONTRATS MULTI-SITES / SYNDICS
- Contrats multi-sites syndics : oui, avec interlocuteur unique pour plusieurs immeubles.
- Rapports pour AG : oui, rapport détaillé à chaque intervention, présentable en assemblée générale.
- Tarifs dégressifs selon le nombre d'unités : oui.
- Facturation par immeuble ou par lot : oui.
- Bilan annuel état des équipements : oui.
- Anticipation remplacement équipements vieillissants : oui.

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
CAS SAV, CLIENT EXISTANT
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
- Client hésitant : "Pas de problème, prenez le temps qu'il vous faut. Je peux vous envoyer une estimation par email si vous préférez, quelle est votre adresse ?"
- Client mécontent/réclamation : "Je comprends votre situation. Pour qu'elle soit traitée en priorité, pouvez-vous me laisser vos coordonnées ? Notre responsable vous rappelle directement."
- Délai impossible à garantir : "Je préfère ne pas vous promettre un délai que je ne peux pas garantir. Notre équipe vous confirme la disponibilité dès votre demande enregistrée."
- Question hors climatisation : "Je suis spécialisé uniquement dans la climatisation et le chauffage. Pour autre chose, je ne peux pas vous aider, mais si vous avez un projet clim, je suis là !"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALIFICATION APPROFONDIE (OPTIONNELLE, avant les coordonnées)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APRÈS avoir donné l'estimation (étape 5/6) et SEULEMENT si le prospect montre un RÉEL INTÉRÊT (il répond volontiers, pose des questions concrètes, se projette, ce n'est pas juste "je regarde les prix"), propose UNE fois, poliment et sans insister :
"Si vous avez deux petites minutes, je peux vous poser quelques questions pour affiner et préparer un devis plus précis. On y va ?"
- S'il refuse ou ne réagit pas : passe directement aux coordonnées (étape suivante), qualifPlus reste false. N'insiste jamais, ne re-propose pas.
- S'il accepte : pose les questions ci-dessous UNE PAR UNE (courtes, avec des exemples), UNIQUEMENT celles pertinentes pour son projet, puis passe aux coordonnées et mets qualifPlus:true dans LEAD_READY. Ne dépasse pas 5 à 6 questions. Si une info a déjà été donnée, ne la redemande pas.

Questions selon le projet :
- INSTALLATION : nombre d'unités souhaitées (si pas déjà su) ; est-ce en copropriété ? (si oui, connaissez-vous le syndic ?) ; où sera posée l'unité extérieure et à quelle hauteur/accès (balcon, façade, toiture, RDC, R+2…) ; une marque en tête ou peu importe ? ; un budget approximatif en tête ? ; c'est pour quand (urgent, sous 1 mois, 1 à 3 mois, pas pressé) ?
- ENTRETIEN : combien d'unités à entretenir ; à quelle hauteur / quel accès ; où est l'unité extérieure (balcon, façade, toiture…) ; quelle marque ; c'est pour quand ?
- DÉPANNAGE : décrivez précisément le symptôme (ne refroidit plus, fuite, code erreur, bruit…) ; quelle marque et quel âge environ ; est-ce urgent ?
- DÉPOSE : combien d'unités à retirer ; où et à quelle hauteur/accès ; quelle marque ; une réinstallation est-elle prévue (non / plus tard au même endroit / ailleurs) ; le motif du retrait ?
Reporte toutes ces réponses dans les champs correspondants de LEAD_READY (budget, delai, copro, syndic, hauteur, emplacementUE, marque, problem) et dans notes pour le reste.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT OBLIGATOIRE À LA DERNIÈRE ÉTAPE UNIQUEMENT :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quand tu as collecté le nom ET le téléphone ET l'adresse (l'email est optionnel), réponds avec ce format exact (sans rien d'autre avant ou après) :

LEAD_READY
{"name":"[prénom nom]","phone":"[téléphone]","email":"[email ou vide]","project":"[installation/entretien/depannage/depose/contrat-pro/autre, en minuscules SANS accent]","property":"[type de bien : appartement, maison, local commercial, bureau]","rooms":"[nombre de pièces à climatiser ou d'unités concernées, chiffre seul, ex : 5]","location":"[ville/CP]","address":"[adresse complète : numéro, rue, code postal, ville]","estimate":"[fourchette €]","notes":"[tout détail utile : accessibilité, photos envoyées, HORS IDF si applicable]","refuseContact":false,"typeClient":"[particulier OU professionnel, 'professionnel' si local pro/entreprise/société/contrat-pro, sinon 'particulier']","qualifPlus":[true si tu as fait le tour de questions approfondi ci-dessous, sinon false],"budget":"[budget approximatif si donné, sinon vide]","delai":"[urgence/échéance si donnée : urgent, moins d'1 mois, 1 à 3 mois, pas pressé]","copro":"[installation : oui/non/ne sait pas si copropriété]","syndic":"[nom du syndic si copro, sinon vide]","hauteur":"[accès/hauteur de l'unité extérieure si donné, ex : RDC, R+2, 3 m, nacelle]","emplacementUE":"[emplacement unité extérieure : balcon/jardin/façade/toiture/cour]","marque":"[marque souhaitée ou existante si donnée]","problem":"[dépannage : description précise du symptôme]"}
MESSAGE
[Ton message de confirmation chaleureux. Termine TOUJOURS par cette information sur le consentement (formulée naturellement) : "Sauf indication contraire de votre part, nous conservons vos coordonnées pour vous recontacter, uniquement par les équipes ClimExpert, jamais de revente à des tiers."
En IDF : "Parfait Thomas ! Votre demande est bien enregistrée, un technicien ClimExpert reprend contact avec vous rapidement pour la suite. Sauf indication contraire de votre part, nous conservons vos coordonnées pour vous recontacter, uniquement par les équipes ClimExpert (jamais de revente à des tiers)."
Hors IDF : "Parfait Thomas ! Votre demande est bien enregistrée, un technicien commercial va reprendre contact avec vous pour établir un devis précis. Sauf indication contraire de votre part, nous conservons vos coordonnées pour vous recontacter, uniquement par les équipes ClimExpert (jamais de revente à des tiers)."
IMPORTANT : si la personne dit explicitement qu'elle ne veut PAS être recontactée pour des offres / démarchage, mets "refuseContact":true dans le JSON (le rappel pour SA demande en cours reste assuré).]`;

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
async function updateLeadFromQualif(existing: typeof leads.$inferSelect, lead: LeadData, messages: ChatMessage[]) {
  const VALID_PROJECTS = ["installation", "entretien", "depannage", "depose", "contrat-pro", "autre"] as const;
  const normalized = lead.project ? lead.project.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() : "";
  const project = (VALID_PROJECTS as readonly string[]).includes(normalized) ? (normalized as typeof VALID_PROJECTS[number]) : undefined;

  const transcript = buildTranscript(messages);
  const noteAjout = [
    "Qualifié par Alex (portail de qualification).",
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
      qualifLe: new Date(),
      statutChangeLe: new Date(),
      relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`,
      updatedAt: new Date(),
    }).where(eq(leads.id, existing.id));
  } catch (e) {
    console.error("[chat] échec updateLeadFromQualif:", e);
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

// Mode « contact » : Alex aide le visiteur à DÉCRIRE SON BESOIN depuis le formulaire de
// contact (les coordonnées sont déjà saisies). Il ne crée AUCUN lead / créneau / SAV -
// c'est le formulaire qui crée le lead à l'envoi. Prompt isolé + court-circuit.
const CONTACT_SYSTEM_PROMPT = `Tu es Alex, l'assistant de ClimExpert (climatisation en Île-de-France). Le visiteur remplit le formulaire de contact du site et a DÉJÀ saisi ses coordonnées (nom, téléphone, email, adresse). Ta seule mission : l'aider à DÉCRIRE SON BESOIN clairement, pour que l'équipe le rappelle avec les bonnes informations.

RÈGLES :
- Ne redemande JAMAIS le nom, le téléphone, l'email ni l'adresse : ils sont déjà dans le formulaire.
- Pose des questions courtes, une à la fois, uniquement sur le PROJET : prestation (installation, entretien, dépannage), type de bien, surface ou nombre de pièces à climatiser, équipement existant ou souhaité (monosplit, multisplit, gainable, PAC), emplacement possible de l'unité extérieure, délai/urgence, budget éventuel.
- Reste chaleureux, simple et professionnel. Vouvoiement.
- Dès que tu as assez d'éléments (3-4 réponses suffisent), termine par un RÉCAPITULATIF clair du besoin en 3 à 5 phrases, à la première personne du client, SANS aucune coordonnée, prêt à être collé dans le formulaire. Commence ce récapitulatif par "Voici votre demande :".
- Ne propose pas de rendez-vous ni de créneaux, ne demande pas de confirmation d'envoi : c'est le formulaire qui s'en charge.
- PÉRIMÈTRE : ClimExpert ne prend PAS en charge les climatiseurs mobiles / portables (monobloc sur roulettes, "clim mobile", climatiseur d'appoint). Si le client décrit une clim mobile/portable, dis-lui poliment que nous sommes spécialisés dans les climatisations fixes installées et que nous ne traitons pas les appareils mobiles, oriente-le vers le SAV de son fabricant, et n'établis PAS de récapitulatif de besoin.
- N'utilise JAMAIS de tiret cadratin (—) ni de tiret demi-cadratin (–) : remplace-les par une virgule, un deux-points ou des parenthèses.`;

export async function POST(req: NextRequest) {
  try {
    // Rate-limit : 20 requêtes / minute / IP (borne le coût Anthropic et le spam)
    if (!(await rateLimit(`chat:${clientIp(req)}`, 20, 60_000))) {
      return NextResponse.json({ error: "Trop de messages, patientez quelques instants." }, { status: 429 });
    }

    const body: { messages: ChatMessage[]; sessionId?: string; mode?: string; qualifToken?: string } = await req.json();
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
      extraSystem += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROSPECT DÉJÀ IDENTIFIÉ (qualification via lien personnel envoyé par l'équipe)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCe client t'a été adressé par ClimExpert suite à sa demande (appel ou formulaire sur le site). Tu connais déjà : nom = ${qualifLead.name ?? "?"}, téléphone = ${qualifLead.phone ?? "?"}${qualifLead.location ? `, ville = ${qualifLead.location}` : ""}${qualifLead.project ? `, projet pressenti = ${qualifLead.project}` : ""}. NE REDEMANDE JAMAIS son nom ni son téléphone. Concentre-toi sur la qualification du BESOIN. Ce prospect est venu via un lien personnel, il est donc MOTIVÉ : fais directement le TOUR APPROFONDI (voir section QUALIFICATION APPROFONDIE) sans redemander la permission des 2 minutes, pose les questions pertinentes à son projet une par une, puis conclus. Mets qualifPlus:true dans LEAD_READY. Sois chaleureux et efficace (pas besoin de redemander les coordonnées avant LEAD_READY).

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
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: [
        { type: "text", text: baseSystem, cache_control: { type: "ephemeral" } },
        ...(extraSystem ? [{ type: "text" as const, text: extraSystem }] : []),
      ],
      messages,
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

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
      return NextResponse.json({ message: raw });
    }

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
            headers: { "Content-Type": "application/json", "x-internal-secret": process.env.NEXTAUTH_SECRET ?? "" },
            body: JSON.stringify(data),
          });
        }
        return NextResponse.json({ message, creneauxSent: true });
      } catch (e) {
        console.error("[chat] erreur traitement CRENEAUX_READY:", e);
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
        return NextResponse.json({ message, savComplete: true });
      } catch (e) {
        console.error("[chat] erreur traitement SAV_READY:", e);
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

        // Mode qualif : on MET À JOUR le prospect existant (pas de doublon) + notif "qualifié".
        if (qualifLead && lead) {
          await updateLeadFromQualif(qualifLead, lead, messages);
          await notifyDevisBrouillon(qualifLead.id, qualifLead.name ?? lead.name ?? "Prospect", buildQualifFromAlex(lead));
          return NextResponse.json({ message, leadComplete: true, lead });
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
            await updateLeadFromQualif(dejaConnu, lead, messages);
            await notifyDevisBrouillon(dejaConnu.id, dejaConnu.name ?? lead.name ?? "Prospect", qualifObj);
            await db.insert(notifications).values({
              adminId: null, type: "nouveau_lead",
              titre: `Prospect déjà connu : ${dejaConnu.name} a reparlé à Alex`,
              contenu: "Sa fiche a été mise à jour (aucun doublon créé).",
              refType: "lead", refId: dejaConnu.id,
            }).catch((e) => console.error("[chat] notif re-contact:", e));
            sendLeadEmails(lead, messages).catch((e) => console.error("[chat] échec envoi email lead:", e));
            return NextResponse.json({ message, leadComplete: true, lead });
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
            // Qualif approfondie d'installation -> prévenir qu'un devis brouillon est prêt à valider.
            await notifyDevisBrouillon(created.id, created.name, qualifObj);
          } catch (e) {
            console.error("[chat] ÉCHEC createLead, lead potentiellement perdu:", e, JSON.stringify(lead));
          }

          // Emails non bloquants (l'échec d'envoi ne doit pas masquer le succès du lead)
          sendLeadEmails(lead, messages).catch((e) => console.error("[chat] échec envoi email lead:", e));
        }

        return NextResponse.json({ message, leadComplete: true, lead });
      } catch (e) {
        console.error("[chat] erreur traitement LEAD_READY:", e);
        return NextResponse.json({ message: "Votre demande est bien enregistrée. Notre équipe vous contacte très prochainement !" });
      }
    }

    return NextResponse.json({ message: raw });
  } catch (error) {
    console.error("Chat API error:", error);
    // Panne de l'IA (API indisponible, quota, timeout...) : on ne perd PAS le prospect.
    // 1) Alerte équipe, throttlée à 1 notification / 15 min pour ne pas noyer la cloche pendant
    //    un incident. 2) Le client voit un message de secours + un mini-formulaire (nom, tél)
    //    affiché par l'interface (flag fallback), qui crée le lead via /api/chat/sos.
    try {
      if (await rateLimit("alex:panne:notif", 1, 15 * 60 * 1000)) {
        await db.insert(notifications).values({
          adminId: null, type: "alex_panne",
          titre: "⚠️ Alex est en difficulté (erreur IA)",
          contenu: "Le chatbot rencontre des erreurs. Les visiteurs voient un formulaire de secours (nom + téléphone) : les contacts sont préservés.",
        });
      }
    } catch (e2) { console.error("[chat] notif panne:", e2); }
    return NextResponse.json({
      fallback: true,
      message: "Je rencontre un petit souci technique. Pour ne pas vous faire attendre, laissez-moi votre nom et votre numéro de téléphone : un conseiller vous rappelle rapidement.",
    });
  }
}

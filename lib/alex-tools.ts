import type Anthropic from "@anthropic-ai/sdk";

// Outils d'Alex. REMPLACENT l'ancien protocole de marqueurs texte (LEAD_READY / SAV_READY /
// CRENEAUX_READY), qui exigeait du modèle qu'il écrive 10 caractères exacts en TOUT DÉBUT de
// réponse. Dans les faits Haiku écrivait le marqueur À LA FIN (et se faisait tronquer par
// max_tokens), la détection `raw.startsWith("LEAD_READY")` échouait, et le prospect était PERDU
// en silence alors que le client voyait un message de confirmation. Avec le tool use, l'API
// renvoie un bloc `tool_use` dont l'`input` est du JSON déjà validé : plus de position, plus de
// parsing fragile, plus de perte.

export const TOOL_PROSPECT = "enregistrer_prospect";
export const TOOL_SAV = "creer_ticket_sav";
export const TOOL_CRENEAUX = "proposer_creneaux";

const PROSPECT_SCHEMA: Anthropic.Tool.InputSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Prénom et nom du prospect, tels qu'il les a donnés" },
    phone: { type: "string", description: "Numéro de téléphone du prospect" },
    email: { type: "string", description: "E-mail du prospect (vide s'il n'en a pas)" },
    project: {
      type: "string",
      enum: ["installation", "entretien", "depannage", "depose", "contrat-pro", "autre"],
      description: "Type de projet, en minuscules sans accent",
    },
    property: { type: "string", description: "Type de bien : appartement, maison, local commercial, bureau" },
    rooms: { type: "string", description: "Nombre de pièces à climatiser, ou nombre d'unités INTÉRIEURES (les appareils dans les pièces). Chiffre seul." },
    unitesExterieures: { type: "string", description: "Nombre de GROUPES EXTÉRIEURS (les blocs posés dehors). Chiffre seul. Indispensable pour chiffrer un entretien : un groupe extérieur supplémentaire coûte plus cher qu'une unité intérieure." },
    location: { type: "string", description: "Ville ou code postal" },
    address: { type: "string", description: "Adresse complète du chantier : numéro, rue, code postal, ville" },
    estimate: { type: "string", description: "Fourchette de prix annoncée au client" },
    notes: { type: "string", description: "Tout détail utile : accessibilité, photos envoyées, HORS IDF si applicable, intérêt contrat" },
    refuseContact: { type: "boolean", description: "true UNIQUEMENT si le client refuse explicitement le démarchage" },
    typeClient: { type: "string", enum: ["particulier", "professionnel"], description: "professionnel si local pro / entreprise / société / contrat-pro" },
    qualifPlus: { type: "boolean", description: "true si le tour de qualification approfondie a été mené" },
    budget: { type: "string", description: "Budget approximatif si donné" },
    delai: { type: "string", description: "Urgence / échéance : urgent, moins d'1 mois, 1 à 3 mois, pas pressé" },
    copro: { type: "string", description: "Installation : oui / non / ne sait pas (copropriété)" },
    syndic: { type: "string", description: "Nom du syndic si copropriété" },
    hauteur: { type: "string", description: "Accès / hauteur de l'unité extérieure (ex : RDC, R+2, 3 m, nacelle)" },
    emplacementUE: { type: "string", description: "Emplacement de l'unité extérieure : balcon / jardin / façade / toiture / cour" },
    marque: { type: "string", description: "Marque souhaitée ou existante" },
    problem: { type: "string", description: "Dépannage : description précise du symptôme" },
    dernierEntretien: { type: "string", description: "Entretien : ancienneté du dernier entretien (ex : 2 ans, plus de 3 ans, jamais)" },
    disponibilites: { type: "string", description: "Jours/horaires de préférence donnés par le client (ex : mardi matin, après 17h)" },
  },
  required: ["name", "phone", "project"],
};

export const PROSPECT_TOOL: Anthropic.Tool = {
  name: TOOL_PROSPECT,
  description:
    "Enregistre le prospect qualifié dans le CRM ClimExpert. À appeler UNE SEULE FOIS, à la toute fin de la qualification, dès que tu as au minimum le NOM et le TÉLÉPHONE. " +
    "Appelle cet outil DANS LE MÊME TOUR que ton message de confirmation au client : l'outil enregistre la fiche, ton texte rassure le client. " +
    "Avant de l'appeler, relis toute la conversation et reporte TOUT ce que le client a donné (disponibilités, dernier entretien, budget…). " +
    "Ne l'appelle JAMAIS pour une climatisation mobile/portable (hors périmètre).",
  input_schema: PROSPECT_SCHEMA,
};

export const SAV_TOOL: Anthropic.Tool = {
  name: TOOL_SAV,
  description:
    "Crée un ticket SAV pour un client DÉJÀ client de ClimExpert qui signale un problème (panne, fuite, bruit, entretien urgent). " +
    "À appeler une seule fois, quand tu as le prénom, le téléphone et la description du problème. Appelle-le dans le même tour que ton message de confirmation.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Prénom du client" },
      phone: { type: "string", description: "Téléphone du client" },
      subject: { type: "string", description: "Objet court du problème" },
      description: { type: "string", description: "Description détaillée du problème" },
    },
    required: ["name", "phone", "subject"],
  },
};

export const CRENEAUX_TOOL: Anthropic.Tool = {
  name: TOOL_CRENEAUX,
  description:
    "Envoie au client, par e-mail, les créneaux d'intervention disponibles. À utiliser UNIQUEMENT après l'acceptation d'un devis, quand le système t'a fourni un intervention_id.",
  input_schema: {
    type: "object",
    properties: {
      interventionId: { type: "string", description: "Identifiant d'intervention fourni par le système" },
      emailClient: { type: "string", description: "E-mail du client" },
      nomClient: { type: "string", description: "Prénom du client" },
      typeIntervention: { type: "string", description: "Type d'intervention" },
      codePostal: { type: "string", description: "Code postal du chantier" },
    },
    required: ["interventionId", "emailClient"],
  },
};

export const ALEX_TOOLS: Anthropic.Tool[] = [PROSPECT_TOOL, SAV_TOOL, CRENEAUX_TOOL];

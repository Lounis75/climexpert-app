import {
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
  integer,
  boolean,
  numeric,
  date,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { Qualification } from "@/lib/qualification";

export const technicienRoleEnum = pgEnum("technicien_role", [
  "technicien",
  "technico_commercial",
  "responsable",
]);

// ─── Enums ────────────────────────────────────────────────────────────────────

export const leadStatusEnum = pgEnum("lead_status", [
  "nouveau",
  "contacté",
  "devis_envoyé",
  "gagné",
  "perdu",
  "pas_de_reponse",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "alex",
  "formulaire",
  "téléphone",
  "autre",
  "whatsapp",
]);

export const projectTypeEnum = pgEnum("project_type", [
  "installation",
  "entretien",
  "depannage",
  "contrat-pro",
  "autre",
]);

export const batimentTypeEnum = pgEnum("batiment_type", [
  "appartement",
  "maison",
  "local-professionnel",
  "hotel-restaurant",
  "copropriete",
]);

export const devisStatusEnum = pgEnum("devis_status", [
  "brouillon",
  "envoyé",
  "accepté",
  "refusé",
  "expiré",
]);

export const factureStatusEnum = pgEnum("facture_status", [
  "en_attente",
  "payée",
  "en_retard",
  "annulée",
]);

export const interventionStatusEnum = pgEnum("intervention_status", [
  "planifiée",
  "en_cours",
  "terminée",
  "annulée",
]);

export const savStatusEnum = pgEnum("sav_status", [
  "ouvert",
  "en_cours",
  "résolu",
  "fermé",
]);

// ─── Techniciens (aucune FK sortante) ─────────────────────────────────────────

export const techniciens = pgTable("techniciens", {
  id:         text("id").primaryKey().$defaultFn(() => createId()),
  name:       varchar("name", { length: 255 }).notNull(),
  prenom:     varchar("prenom", { length: 255 }),
  phone:      varchar("phone", { length: 30 }),
  email:      varchar("email", { length: 255 }).notNull().unique(),
  color:      varchar("color", { length: 7 }).default("#3b82f6"),
  role:       technicienRoleEnum("role").default("technicien"),
  zonesGeo:   text("zones_geo").array(),
  active:     boolean("active").default(true).notNull(),
  actif:      boolean("actif").default(false).notNull(),  // true une fois onboarding terminé
  externe:    boolean("externe").default(false).notNull(), // true = sous-traitant (prestataire externe, pas d'accès portail)
  entreprise: varchar("entreprise", { length: 255 }),      // société du sous-traitant
  specialite: varchar("specialite", { length: 255 }),      // ex : frigoriste, électricité
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  supprimeLe: timestamp("supprime_le"),
});

// ─── Admins (aucune FK sortante) ──────────────────────────────────────────────

export const admins = pgTable("admins", {
  id:         text("id").primaryKey().$defaultFn(() => createId()),
  email:      varchar("email", { length: 255 }).notNull().unique(),
  nom:        varchar("nom", { length: 255 }).notNull(),
  totpSecret: text("totp_secret"),
  actif:      boolean("actif").default(true).notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  supprimeLe: timestamp("supprime_le"),
});

// ─── Utilisateurs / salariés (modèle unifié multi-rôles) ──────────────────────
// Remplace progressivement admins + techniciens : une seule fiche par personne,
// avec une liste de rôles extensible (administrateur, commercial, technicien, …).
// Auth par identifiant (email) + mot de passe haché (scrypt).

export const utilisateurs = pgTable("utilisateurs", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  email:         varchar("email", { length: 255 }).notNull().unique(),
  nom:           varchar("nom", { length: 255 }).notNull(),
  prenom:        varchar("prenom", { length: 255 }),
  phone:         varchar("phone", { length: 30 }),
  color:         varchar("color", { length: 7 }).default("#0ea5e9"),
  // Rôles multiples, vocabulaire extensible côté applicatif (cf. lib/roles.ts).
  roles:         text("roles").array().notNull().default(sql`'{}'::text[]`),
  passwordHash:  text("password_hash"),          // null tant que l'accès n'est pas défini
  totpSecret:    text("totp_secret"),            // 2FA optionnelle (admins)
  doitDefinirMdp: boolean("doit_definir_mdp").default(true).notNull(), // 1ʳᵉ connexion
  actif:         boolean("actif").default(true).notNull(),
  // Activation : token à usage unique envoyé par email pour que le salarié
  // CHOISISSE son mot de passe (au lieu d'en recevoir un en clair).
  activationToken:     text("activation_token").unique(),
  activationExpiresAt: timestamp("activation_expires_at"),
  // Lien vers la fiche technicien historique (interventions/rapports) si applicable.
  technicienId:  text("technicien_id"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:    timestamp("supprime_le"),
}, (t) => ({
  emailIdx: index("utilisateurs_email_idx").on(t.email),
}));

// ─── Clients ──────────────────────────────────────────────────────────────────
// leadId et contratEntretienId sont des références logiques sans contrainte FK
// (circular ref avec leads / contratsEntretien), gérées par relations()

export const clients = pgTable("clients", {
  id:                 text("id").primaryKey().$defaultFn(() => createId()),
  name:               varchar("name", { length: 255 }).notNull(),
  phone:              varchar("phone", { length: 30 }).notNull(),
  email:              varchar("email", { length: 255 }),
  address:            text("address"),
  city:               varchar("city", { length: 100 }),
  notes:              text("notes"),
  leadId:             text("lead_id"),                                              // ref logique → leads
  // ─── Champs contrat (auto-remplissage du contrat d'entretien) ───────────────
  typeClient:         varchar("type_client", { length: 20 }).default("particulier").notNull(), // "particulier" | "professionnel" | "sous_traitance" (donneur d'ordre)
  civilite:           varchar("civilite", { length: 20 }),                          // "M." | "Madame" (particulier)
  siret:              varchar("siret", { length: 20 }),                             // pro
  formeJuridique:     varchar("forme_juridique", { length: 120 }),                  // pro : "SARL au capital de…"
  representant:       varchar("representant", { length: 255 }),                     // pro : nom du représentant
  representantQualite: varchar("representant_qualite", { length: 80 }),             // pro : "gérant", "président"…
  equipementInstalle: text("equipement_installe"),
  marqueModele:       varchar("marque_modele", { length: 255 }),
  dateInstallation:   date("date_installation"),
  technicienId:       text("technicien_id").references(() => techniciens.id),
  garantieExpireLe:   date("garantie_expire_le"),
  contratEntretienId: text("contrat_entretien_id"),                                // ref logique → contratsEntretien
  // Date à laquelle relancer le client pour son prochain entretien (= dernier entretien + 330 j).
  prochainEntretienLe: date("prochain_entretien_le"),
  relanceEntretienNotifiee: boolean("relance_entretien_notifiee").default(false).notNull(), // cloche déjà émise ?
  clientToken:        varchar("client_token", { length: 64 }).unique(),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:         timestamp("supprime_le"),
  version:            integer("version").default(0).notNull(), // verrou de concurrence optimiste
});

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id:                  text("id").primaryKey().$defaultFn(() => createId()),
  name:                varchar("name", { length: 255 }).notNull(),
  phone:               varchar("phone", { length: 30 }).notNull(),
  email:               varchar("email", { length: 255 }),
  location:            varchar("location", { length: 255 }),
  address:             text("address"),
  // Particulier ou professionnel (utile pour devis, TVA, démarchage B2B).
  typeClient:          varchar("type_client", { length: 20 }).default("particulier").notNull(), // "particulier" | "professionnel" | "sous_traitance"
  project:             projectTypeEnum("project"),
  typeBatiment:        batimentTypeEnum("type_batiment"),
  surfaceM2:           integer("surface_m2"),
  ancienneteAns:       integer("anciennete_ans"),
  equipementInteresse: varchar("equipement_interesse", { length: 100 }),
  message:             text("message"),
  notesAlex:           text("notes_alex"),
  status:              leadStatusEnum("status").default("nouveau").notNull(),
  source:              leadSourceEnum("source").default("formulaire").notNull(),
  notes:               text("notes"),
  // Montant du devis (centimes), à renseigner dès le passage en "devis_envoyé".
  montantDevisCt:      integer("montant_devis_ct"),
  // ── Devis externe (fait sur un logiciel tiers) envoyé au client pour décision en ligne ──
  devisUrl:            text("devis_url"),                            // PDF du devis stocké (R2)
  devisNomFichier:     varchar("devis_nom_fichier", { length: 255 }),
  devisEnvoyeLe:       timestamp("devis_envoye_le"),                 // date d'envoi au client
  devisToken:          varchar("devis_token", { length: 100 }).unique(), // lien public de décision
  devisDecision:       varchar("devis_decision", { length: 20 }),    // null | "accepte" | "refuse"
  devisDecisionLe:     timestamp("devis_decision_le"),
  devisMotifRefus:     text("devis_motif_refus"),                    // motif (préfait ou libre) si refusé
  // Sous-statut quand le contact est établi (avant l'envoi du devis) :
  // "rdv_pris" | "a_recontacter" | "devis_a_faire". Null = non précisé.
  prochaineEtape:      varchar("prochaine_etape", { length: 20 }),
  // Date de la prochaine action à mener (relance) → alerte rouge si échue (anti-oubli).
  prochaineActionLe:   date("prochaine_action_le"),
  // Date du rendez-vous commercial pris (sous-statut "rdv_pris") → affiché au calendrier.
  rdvDate:             timestamp("rdv_date"),
  // Date souhaitée d'intervention par le client (notée dès l'envoi du devis) →
  // pré-remplit l'intervention créée lors de la conversion en client.
  dateSouhaiteeIntervention: timestamp("date_souhaitee_intervention"),
  // Date de passage en "gagné" (signé) → alimente le CA signé du dashboard par période.
  gagneLe:             timestamp("gagne_le"),
  clientId:            text("client_id").references(() => clients.id),
  commercialId:        text("commercial_id").references(() => techniciens.id),
  // Consentement RGPD au démarchage commercial (opt-in). La prise de contact
  // sur sa propre demande (devis) reste licite sans consentement.
  consentementMarketing: boolean("consentement_marketing").default(false).notNull(),
  consentementLe:        timestamp("consentement_le"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:          timestamp("supprime_le"),
  version:             integer("version").default(0).notNull(), // verrou de concurrence optimiste
  favori:              boolean("favori").default(false).notNull(), // ⭐ prospect marqué « intéressant »
  qualification:       jsonb("qualification").$type<Qualification>(), // 📋 guide de qualification des besoins
  statutChangeLe:      timestamp("statut_change_le"),  // date du dernier changement de statut (cycle de vie)
  relanceNotifieeLe:   timestamp("relance_notifiee_le"), // rappel déjà envoyé pour le statut courant (anti-doublon)
  // ── Premier contact : file d'appels du statut "nouveau" ──
  tentativesAppel:     integer("tentatives_appel").default(0).notNull(), // nb d'appels "pas de réponse" (badge injoignable à 4)
  dernierAppelLe:      timestamp("dernier_appel_le"),  // dernière tentative d'appel → renvoie le prospect en bas de la file "Nouveau"
  motifPerdu:          varchar("motif_perdu", { length: 40 }), // "pas_de_business" | "injoignable" | "refus" | "autre"
  archiveLe:           timestamp("archive_le"),        // perdu archivé (sort du Kanban, conservé pour recontact)
  photosUrls:          text("photos_urls").array(),    // photos jointes au formulaire (affichées sur la fiche prospect)
}, (t) => ({
  statusIdx:        index("leads_status_idx").on(t.status),
  sourceIdx:        index("leads_source_idx").on(t.source),
  createdAtIdx:     index("leads_created_at_idx").on(t.createdAt),
  suprimeLeIdx:     index("leads_supprime_le_idx").on(t.supprimeLe),
  // Index composés pour les requêtes réelles (liste filtrée+triée, RDV, cloisonnement commercial).
  statusCreatedIdx: index("leads_status_created_at_idx").on(t.status, t.createdAt),
  commercialIdx:    index("leads_commercial_id_idx").on(t.commercialId),
  rdvDateIdx:       index("leads_rdv_date_idx").on(t.rdvDate),
}));

// Historique des devis envoyés à un prospect : plusieurs liens peuvent coexister, chacun
// avec sa propre décision (accepté / décliné). Le prospect garde aussi des champs « devis
// courant » (miroir du dernier devis envoyé) pour les vues Dashboard existantes.
export const devisEnvois = pgTable("devis_envois", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  leadId:      text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  url:         text("url").notNull(),
  nomFichier:  varchar("nom_fichier", { length: 255 }),
  token:       varchar("token", { length: 100 }).notNull().unique(),
  montantCt:   integer("montant_ct"),
  envoyeLe:    timestamp("envoye_le").defaultNow().notNull(),
  decision:    varchar("decision", { length: 20 }),     // null | "accepte" | "refuse"
  decisionLe:  timestamp("decision_le"),
  motifRefus:  text("motif_refus"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  leadIdx:  index("devis_envois_lead_id_idx").on(t.leadId),
  tokenIdx: index("devis_envois_token_idx").on(t.token),
}));
export type DevisEnvoi = typeof devisEnvois.$inferSelect;

// ─── Devis ────────────────────────────────────────────────────────────────────

export const devis = pgTable("devis", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  number:      varchar("number", { length: 50 }).notNull().unique(),
  // Optionnel : un devis peut viser un PROSPECT (leadId seul) avant la signature.
  // À la signature, le prospect est converti en client et clientId est renseigné.
  clientId:    text("client_id").references(() => clients.id),
  leadId:      text("lead_id").references(() => leads.id),
  status:      devisStatusEnum("status").default("brouillon").notNull(),
  totalHtCt:   integer("total_ht_ct"),        // centimes
  totalTtcCt:  integer("total_ttc_ct"),       // centimes
  tvaRate:     numeric("tva_rate", { precision: 5, scale: 2 }).default("5.5"),
  description: text("description"),
  fichierUrl:  text("fichier_url"),           // PDF du devis joint (R2), saisi à l'envoi
  validUntil:   date("valid_until"),
  pennylaneId:  varchar("pennylane_id", { length: 100 }),
  publicToken:  varchar("public_token", { length: 100 }).unique(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:   timestamp("supprime_le"),
});

// ─── Lignes devis ─────────────────────────────────────────────────────────────

export const lignesDevis = pgTable("lignes_devis", {
  id:               text("id").primaryKey().$defaultFn(() => createId()),
  devisId:          text("devis_id").notNull().references(() => devis.id),
  designation:      varchar("designation", { length: 500 }).notNull(),
  quantite:         integer("quantite").default(1).notNull(),
  prixUnitaireCt:   integer("prix_unitaire_ct").notNull(), // centimes
  tvaRate:          numeric("tva_rate", { precision: 5, scale: 2 }).default("5.5"),
  ordre:            integer("ordre").default(0).notNull(),
});

// ─── Factures ─────────────────────────────────────────────────────────────────

export const factures = pgTable("factures", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  number:      varchar("number", { length: 50 }).notNull().unique(),
  clientId:    text("client_id").notNull().references(() => clients.id),
  devisId:     text("devis_id").references(() => devis.id),
  status:      factureStatusEnum("status").default("en_attente").notNull(),
  totalHtCt:   integer("total_ht_ct"),        // centimes
  totalTtcCt:  integer("total_ttc_ct"),       // centimes
  tvaRate:     numeric("tva_rate", { precision: 5, scale: 2 }).default("5.5"),
  dueDate:     date("due_date"),
  paidAt:      timestamp("paid_at"),
  pennylaneId: varchar("pennylane_id", { length: 100 }),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:  timestamp("supprime_le"),
}, (t) => ({
  statusIdx:  index("factures_status_idx").on(t.status),
  dueDateIdx: index("factures_due_date_idx").on(t.dueDate),
  paidAtIdx:  index("factures_paid_at_idx").on(t.paidAt),
}));

// ─── Interventions ────────────────────────────────────────────────────────────

export const interventions = pgTable("interventions", {
  id:                   text("id").primaryKey().$defaultFn(() => createId()),
  clientId:             text("client_id").notNull().references(() => clients.id),
  technicienId:         text("technicien_id").references(() => techniciens.id),
  devisId:              text("devis_id").references(() => devis.id),
  type:                 projectTypeEnum("type").notNull(),
  status:               interventionStatusEnum("status").default("planifiée").notNull(),
  scheduledAt:          timestamp("scheduled_at"),
  completedAt:          timestamp("completed_at"),
  address:              text("address"),
  codePostal:           varchar("code_postal", { length: 10 }),
  notes:                text("notes"),
  // Entretien : le client est-il sous contrat d'entretien pour cette intervention ?
  sousContrat:          boolean("sous_contrat"),
  // Photos de briefing ajoutées par l'admin pour aider le technicien (JSON : string[] d'URLs R2).
  photosBriefing:       text("photos_briefing"),
  dureeEstimeeMinutes:  integer("duree_estimee_minutes"),
  dureeReelleMinutes:   integer("duree_reelle_minutes"),
  // ── Facture (PDF fait sur le logiciel compta) envoyée au client après l'intervention ──
  factureUrl:           text("facture_url"),                // PDF de la facture stocké (R2)
  factureEnvoyeeLe:     timestamp("facture_envoyee_le"),    // date d'envoi au client (sinon = à facturer)
  rdvToken:               varchar("rdv_token", { length: 100 }).unique(),
  rdvTokenChoix:          integer("rdv_token_choix"),              // 1|2|3, choix sélectionné
  rdvTokenCreneaux:       text("rdv_token_creneaux"),              // JSON: 3 créneaux proposés
  annulePar:              varchar("annule_par", { length: 20 }),   // "client"|"admin"|"technicien"
  motifAnnulation:        text("motif_annulation"),
  interventionOrigineId:  text("intervention_origine_id"),         // si report
  chantierId:             text("chantier_id"),                     // rattachement à un chantier (ref logique)
  // Sous-traitance : site/client final (distinct du client CRM = donneur d'ordre)
  siteNom:                varchar("site_nom", { length: 255 }),
  siteAdresse:            text("site_adresse"),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:           timestamp("supprime_le"),
  version:              integer("version").default(0).notNull(), // verrou de concurrence optimiste
}, (t) => ({
  scheduledAtIdx:      index("interventions_scheduled_at_idx").on(t.scheduledAt),
  statusIdx:           index("interventions_status_idx").on(t.status),
  // Index composés : agenda (statut+date), cloisonnement technicien, jointure client.
  statusScheduledIdx:  index("interventions_status_scheduled_at_idx").on(t.status, t.scheduledAt),
  technicienIdx:       index("interventions_technicien_id_idx").on(t.technicienId),
  clientIdx:           index("interventions_client_id_idx").on(t.clientId),
  chantierIdx:         index("interventions_chantier_id_idx").on(t.chantierId),
}));

// ─── Contrats entretien ───────────────────────────────────────────────────────

export const contratsEntretien = pgTable("contrats_entretien", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").notNull().references(() => clients.id),
  numero:         varchar("numero", { length: 30 }),                  // n° auto ENT-2026-0001
  fluide:         varchar("fluide", { length: 20 }).default("R410A"), // fluide frigorigène
  marque:         varchar("marque", { length: 100 }),      // marque/modèle de l'unité extérieure
  puissanceKw:    varchar("puissance_kw", { length: 20 }), // puissance (kW)
  numeroSerie:    varchar("numero_serie", { length: 100 }),// n° de série de l'unité extérieure
  units:          integer("units").default(1).notNull(),   // nombre d'unités intérieures (même marque)
  prixUnitaireCt: integer("prix_unitaire_ct").default(20000).notNull(), // 200 € = 20000 ct
  startDate:      date("start_date").notNull(),
  nextVisit:      date("next_visit"),
  active:         boolean("active").default(true).notNull(),
  signatureUrl:   text("signature_url"),       // signature client (contrat signé sur l'écran technicien)
  signeLe:        timestamp("signe_le"),        // date de signature
  signatureToken: varchar("signature_token", { length: 64 }),  // lien de signature à distance (e-signature)
  signatureDemandeeLe: timestamp("signature_demandee_le"),      // date d'envoi de la demande de signature
  signatureIp:    varchar("signature_ip", { length: 64 }),      // IP du signataire (piste d'audit, signature simple)
  pdfSigneUrl:    text("pdf_signe_url"),         // PDF final signé des deux parties (R2), servi par le bouton "Contrat PDF"
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  supprimeLe:     timestamp("supprime_le"),
});

// ─── Suivis (timeline) ────────────────────────────────────────────────────────

export const suivis = pgTable("suivis", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").references(() => clients.id),
  leadId:         text("lead_id").references(() => leads.id),
  interventionId: text("intervention_id").references(() => interventions.id),
  adminId:        text("admin_id").references(() => admins.id),
  type:           varchar("type", { length: 50 }).notNull(), // "appel"|"email"|"visite"|"note"
  contenu:        text("contenu"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

// ─── SAV Tickets ──────────────────────────────────────────────────────────────

export const savTickets = pgTable("sav_tickets", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").notNull().references(() => clients.id),
  interventionId: text("intervention_id").references(() => interventions.id),
  status:         savStatusEnum("status").default("ouvert").notNull(),
  subject:        varchar("subject", { length: 255 }).notNull(),
  description:    text("description"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  // Destinataire : ID admin OU technicien (table polymorphe). Pas de FK car
  // l'ID peut référencer admins.id ou techniciens.id selon le type de notif.
  adminId:   text("admin_id"),
  type:      varchar("type", { length: 50 }).notNull(),
  titre:     varchar("titre", { length: 255 }).notNull(),
  contenu:   text("contenu"),
  lu:        boolean("lu").default(false).notNull(),
  refType:   varchar("ref_type", { length: 50 }),
  refId:     text("ref_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Logs connexion ───────────────────────────────────────────────────────────

export const logsConnexion = pgTable("logs_connexion", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  compteType:  varchar("compte_type", { length: 20 }).notNull(), // "admin" | "technicien"
  compteId:    text("compte_id").notNull(),
  ip:          varchar("ip", { length: 45 }),
  userAgent:   text("user_agent"),
  succes:      boolean("succes").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Articles dynamiques (blog) ───────────────────────────────────────────────

export const dynamicArticles = pgTable("dynamic_articles", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  slug:      varchar("slug", { length: 255 }).notNull().unique(),
  data:      text("data").notNull(), // JSON sérialisé (type Article)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Logs Alex ────────────────────────────────────────────────────────────────

export const logsAlex = pgTable("logs_alex", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  leadId:    text("lead_id").references(() => leads.id),
  action:    varchar("action", { length: 100 }),
  input:     text("input"),
  output:    text("output"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  actionIdx:    index("logs_alex_action_idx").on(t.action),
  createdAtIdx: index("logs_alex_created_at_idx").on(t.createdAt),
  sessionIdx:   index("logs_alex_session_id_idx").on(t.sessionId),
}));

// ─── Événements analytics (visites, calculateur, Alex…) ──────────────────────

export const evenements = pgTable("evenements", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  type:      varchar("type", { length: 50 }).notNull(),   // page_view | calculateur_complete | alex_open | ...
  path:      text("path"),                                 // chemin visité
  sessionId: varchar("session_id", { length: 100 }),       // visiteur anonyme (localStorage)
  referer:   text("referer"),                              // provenance (domaine)
  meta:      text("meta"),                                 // JSON optionnel (détails)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  typeIdx:      index("evenements_type_idx").on(t.type),
  createdAtIdx: index("evenements_created_at_idx").on(t.createdAt),
}));

// ─── Magic link tokens (auth technicien) ─────────────────────────────────────

export const magicLinkTokens = pgTable("magic_link_tokens", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  technicienId:  text("technicien_id").notNull().references(() => techniciens.id),
  token:         varchar("token", { length: 128 }).notNull().unique(),
  expiresAt:     timestamp("expires_at").notNull(),
  usedAt:        timestamp("used_at"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

// ─── Rapports d'intervention ──────────────────────────────────────────────────

export const rapportsIntervention = pgTable("rapports_intervention", {
  id:                   text("id").primaryKey().$defaultFn(() => createId()),
  interventionId:       text("intervention_id").notNull().references(() => interventions.id).unique(),
  technicienId:         text("technicien_id").notNull().references(() => techniciens.id),
  installationConforme: boolean("installation_conforme").default(true).notNull(),
  notes:                text("notes"),
  photosUrls:           text("photos_urls").array(),
  // Champs spécifiques visite technique
  dimensionsPiece:      varchar("dimensions_piece", { length: 100 }),
  typeMur:              varchar("type_mur", { length: 100 }),
  distanceGroupes:      varchar("distance_groupes", { length: 100 }),
  contraintesElec:      text("contraintes_elec"),
  equipementRecommande: text("equipement_recommande"),
  difficulte:           varchar("difficulte", { length: 30 }),  // "standard"|"complexe"|"tres_complexe"
  // Entretien annuel : obligatoire à la clôture (le technicien DOIT répondre)
  entretienAnnuelPropose: boolean("entretien_annuel_propose"),  // null = non répondu
  entretienAnnuelAccepte: boolean("entretien_annuel_accepte"),  // si proposé : client a accepté ?
  dateSoumission:       timestamp("date_soumission").defaultNow().notNull(),
});

// ─── Périodes de capacité saisonnière ────────────────────────────────────────

export const periodesCapacite = pgTable("periodes_capacite", {
  id:                      text("id").primaryKey().$defaultFn(() => createId()),
  nom:                     varchar("nom", { length: 255 }).notNull(),
  dateDebut:               date("date_debut").notNull(),
  dateFin:                 date("date_fin").notNull(),
  maxInterventionsSemaine: integer("max_interventions_semaine").notNull(),
  note:                    text("note"),
  createdAt:               timestamp("created_at").defaultNow().notNull(),
});

// ─── Suivis planifiés post-intervention (J+7, J+30, J+365) ───────────────────

export const suivisPlanifies = pgTable("suivis_planifies", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").notNull().references(() => clients.id),
  interventionId: text("intervention_id").references(() => interventions.id),
  typeSuivi:      varchar("type_suivi", { length: 20 }).notNull(), // "j7"|"j30"|"j365"
  canal:          varchar("canal", { length: 20 }).notNull(),      // "email"|"sms"
  statut:         varchar("statut", { length: 30 }).default("planifie").notNull(),
  datePrevue:     date("date_prevue").notNull(),
  dateEnvoi:      timestamp("date_envoi"),
  reponseClient:  text("reponse_client"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

// ─── Audit log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  adminId:     text("admin_id").references(() => admins.id),
  action:      varchar("action", { length: 100 }).notNull(),
  tableCible:  varchar("table_cible", { length: 50 }),
  idCible:     text("id_cible"),
  avantJson:   text("avant_json"),
  apresJson:   text("apres_json"),
  ip:          varchar("ip", { length: 45 }),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ─── Disponibilités bloquées (technicien) ────────────────────────────────────

export const disponibilitesBloquees = pgTable("disponibilites_bloquees", {
  id:           text("id").primaryKey().$defaultFn(() => createId()),
  technicienId: text("technicien_id").notNull().references(() => techniciens.id),
  dateDebut:    timestamp("date_debut").notNull(),
  dateFin:      timestamp("date_fin").notNull(),
  motif:        varchar("motif", { length: 255 }),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// ─── Documents client (CERFA, attestations…) ─────────────────────────────────
export const documents = pgTable("documents", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").references(() => clients.id),
  interventionId: text("intervention_id").references(() => interventions.id),
  type:           varchar("type", { length: 30 }).notNull(), // "cerfa" | "contrat" | …
  label:          varchar("label", { length: 255 }),
  url:            text("url").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  clientIdx:       index("documents_client_id_idx").on(t.clientId),
  interventionIdx: index("documents_intervention_id_idx").on(t.interventionId),
}));

// ─── Chantiers (projets multi-interventions) ─────────────────────────────────
// Créé à la signature du devis (passage du prospect en "gagné"). Regroupe les
// interventions de réalisation (installation, puis entretiens).
export const chantiers = pgTable("chantiers", {
  id:         text("id").primaryKey().$defaultFn(() => createId()),
  clientId:   text("client_id").notNull().references(() => clients.id),
  leadId:     text("lead_id").references(() => leads.id),               // prospect d'origine
  nom:        varchar("nom", { length: 255 }).notNull(),
  statut:     varchar("statut", { length: 20 }).default("en_cours").notNull(), // en_cours | termine
  montantCt:  integer("montant_ct"),                                    // montant du devis signé
  notes:      text("notes"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
  version:    integer("version").default(0).notNull(),
}, (t) => ({
  clientIdx: index("chantiers_client_id_idx").on(t.clientId),
  statutIdx: index("chantiers_statut_idx").on(t.statut),
}));

export type Chantier = typeof chantiers.$inferSelect;

// ─── Relations ────────────────────────────────────────────────────────────────

export const clientsRelations = relations(clients, ({ one, many }) => ({
  technicien:        one(techniciens, { fields: [clients.technicienId], references: [techniciens.id] }),
  devis:             many(devis),
  factures:          many(factures),
  interventions:     many(interventions),
  contratsEntretien: many(contratsEntretien),
  savTickets:        many(savTickets),
  suivis:            many(suivis),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  client:   one(clients, { fields: [leads.clientId], references: [clients.id] }),
  logsAlex: many(logsAlex),
  suivis:   many(suivis),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  suivis:        many(suivis),
  notifications: many(notifications),
}));

export const techniciensRelations = relations(techniciens, ({ many }) => ({
  clients:               many(clients),
  interventions:         many(interventions),
  magicLinkTokens:       many(magicLinkTokens),
  rapportsIntervention:  many(rapportsIntervention),
  disponibilitesBloquees:many(disponibilitesBloquees),
}));

export const magicLinkTokensRelations = relations(magicLinkTokens, ({ one }) => ({
  technicien: one(techniciens, { fields: [magicLinkTokens.technicienId], references: [techniciens.id] }),
}));

export const rapportsInterventionRelations = relations(rapportsIntervention, ({ one }) => ({
  intervention: one(interventions, { fields: [rapportsIntervention.interventionId], references: [interventions.id] }),
  technicien:   one(techniciens, { fields: [rapportsIntervention.technicienId], references: [techniciens.id] }),
}));

export const disponibilitesBloqueesRelations = relations(disponibilitesBloquees, ({ one }) => ({
  technicien: one(techniciens, { fields: [disponibilitesBloquees.technicienId], references: [techniciens.id] }),
}));

export const suivisPlanifiesRelations = relations(suivisPlanifies, ({ one }) => ({
  client:       one(clients, { fields: [suivisPlanifies.clientId], references: [clients.id] }),
  intervention: one(interventions, { fields: [suivisPlanifies.interventionId], references: [interventions.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  admin: one(admins, { fields: [auditLog.adminId], references: [admins.id] }),
}));

export const devisRelations = relations(devis, ({ one, many }) => ({
  client:        one(clients, { fields: [devis.clientId], references: [clients.id] }),
  lead:          one(leads, { fields: [devis.leadId], references: [leads.id] }),
  lignes:        many(lignesDevis),
  factures:      many(factures),
  interventions: many(interventions),
}));

export const lignesDevisRelations = relations(lignesDevis, ({ one }) => ({
  devis: one(devis, { fields: [lignesDevis.devisId], references: [devis.id] }),
}));

export const facturesRelations = relations(factures, ({ one }) => ({
  client: one(clients, { fields: [factures.clientId], references: [clients.id] }),
  devis:  one(devis, { fields: [factures.devisId], references: [devis.id] }),
}));

export const interventionsRelations = relations(interventions, ({ one, many }) => ({
  client:     one(clients, { fields: [interventions.clientId], references: [clients.id] }),
  technicien: one(techniciens, { fields: [interventions.technicienId], references: [techniciens.id] }),
  devis:      one(devis, { fields: [interventions.devisId], references: [devis.id] }),
  savTickets: many(savTickets),
  suivis:     many(suivis),
}));

export const contratsEntretienRelations = relations(contratsEntretien, ({ one }) => ({
  client: one(clients, { fields: [contratsEntretien.clientId], references: [clients.id] }),
}));

export const suivisRelations = relations(suivis, ({ one }) => ({
  client:       one(clients, { fields: [suivis.clientId], references: [clients.id] }),
  lead:         one(leads, { fields: [suivis.leadId], references: [leads.id] }),
  intervention: one(interventions, { fields: [suivis.interventionId], references: [interventions.id] }),
  admin:        one(admins, { fields: [suivis.adminId], references: [admins.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Lead             = typeof leads.$inferSelect;
export type NewLead          = typeof leads.$inferInsert;
export type Client           = typeof clients.$inferSelect;
export type NewClient        = typeof clients.$inferInsert;
export type Admin            = typeof admins.$inferSelect;
export type NewAdmin         = typeof admins.$inferInsert;
export type Utilisateur      = typeof utilisateurs.$inferSelect;
export type NewUtilisateur   = typeof utilisateurs.$inferInsert;
export type Technicien       = typeof techniciens.$inferSelect;
export type Devis            = typeof devis.$inferSelect;
export type NewDevis         = typeof devis.$inferInsert;
export type LigneDevis       = typeof lignesDevis.$inferSelect;
export type Facture          = typeof factures.$inferSelect;
export type NewFacture       = typeof factures.$inferInsert;
export type Intervention     = typeof interventions.$inferSelect;
export type ContratEntretien = typeof contratsEntretien.$inferSelect;
export type Suivi            = typeof suivis.$inferSelect;
export type SavTicket        = typeof savTickets.$inferSelect;
export type Notification     = typeof notifications.$inferSelect;
export type LogConnexion     = typeof logsConnexion.$inferSelect;
export type LogAlex                = typeof logsAlex.$inferSelect;
export type MagicLinkToken         = typeof magicLinkTokens.$inferSelect;
export type RapportIntervention    = typeof rapportsIntervention.$inferSelect;
export type DisponibiliteBloquee   = typeof disponibilitesBloquees.$inferSelect;
export type PeriodeCapacite        = typeof periodesCapacite.$inferSelect;
export type SuiviPlanifie          = typeof suivisPlanifies.$inferSelect;
export type AuditLog               = typeof auditLog.$inferSelect;
export type DynamicArticleRow      = typeof dynamicArticles.$inferSelect;
export type Document               = typeof documents.$inferSelect;

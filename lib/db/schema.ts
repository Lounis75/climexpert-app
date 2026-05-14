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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const leadStatusEnum = pgEnum("lead_status", [
  "nouveau",
  "contacté",
  "devis_envoyé",
  "gagné",
  "perdu",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "alex",
  "formulaire",
  "téléphone",
  "autre",
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
  phone:      varchar("phone", { length: 30 }),
  email:      varchar("email", { length: 255 }).notNull().unique(),
  color:      varchar("color", { length: 7 }).default("#3b82f6"),
  active:     boolean("active").default(true).notNull(),
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

// ─── Clients ──────────────────────────────────────────────────────────────────
// leadId et contratEntretienId sont des références logiques sans contrainte FK
// (circular ref avec leads / contratsEntretien) — gérées par relations()

export const clients = pgTable("clients", {
  id:                 text("id").primaryKey().$defaultFn(() => createId()),
  name:               varchar("name", { length: 255 }).notNull(),
  phone:              varchar("phone", { length: 30 }).notNull(),
  email:              varchar("email", { length: 255 }),
  address:            text("address"),
  city:               varchar("city", { length: 100 }),
  notes:              text("notes"),
  leadId:             text("lead_id"),                                              // ref logique → leads
  equipementInstalle: text("equipement_installe"),
  marqueModele:       varchar("marque_modele", { length: 255 }),
  dateInstallation:   date("date_installation"),
  technicienId:       text("technicien_id").references(() => techniciens.id),
  garantieExpireLe:   date("garantie_expire_le"),
  contratEntretienId: text("contrat_entretien_id"),                                // ref logique → contratsEntretien
  createdAt:          timestamp("created_at").defaultNow().notNull(),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:         timestamp("supprime_le"),
});

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id:                  text("id").primaryKey().$defaultFn(() => createId()),
  name:                varchar("name", { length: 255 }).notNull(),
  phone:               varchar("phone", { length: 30 }).notNull(),
  email:               varchar("email", { length: 255 }),
  location:            varchar("location", { length: 255 }),
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
  clientId:            text("client_id").references(() => clients.id),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:          timestamp("supprime_le"),
});

// ─── Devis ────────────────────────────────────────────────────────────────────

export const devis = pgTable("devis", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  number:      varchar("number", { length: 50 }).notNull().unique(),
  clientId:    text("client_id").notNull().references(() => clients.id),
  leadId:      text("lead_id").references(() => leads.id),
  status:      devisStatusEnum("status").default("brouillon").notNull(),
  totalHtCt:   integer("total_ht_ct"),        // centimes
  totalTtcCt:  integer("total_ttc_ct"),       // centimes
  tvaRate:     numeric("tva_rate", { precision: 5, scale: 2 }).default("5.5"),
  description: text("description"),
  validUntil:  date("valid_until"),
  pennylaneId: varchar("pennylane_id", { length: 100 }),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:  timestamp("supprime_le"),
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
});

// ─── Interventions ────────────────────────────────────────────────────────────

export const interventions = pgTable("interventions", {
  id:           text("id").primaryKey().$defaultFn(() => createId()),
  clientId:     text("client_id").notNull().references(() => clients.id),
  technicienId: text("technicien_id").references(() => techniciens.id),
  devisId:      text("devis_id").references(() => devis.id),
  type:         projectTypeEnum("type").notNull(),
  status:       interventionStatusEnum("status").default("planifiée").notNull(),
  scheduledAt:  timestamp("scheduled_at"),
  completedAt:  timestamp("completed_at"),
  address:      text("address"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
  supprimeLe:   timestamp("supprime_le"),
});

// ─── Contrats entretien ───────────────────────────────────────────────────────

export const contratsEntretien = pgTable("contrats_entretien", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").notNull().references(() => clients.id),
  units:          integer("units").default(1).notNull(),
  prixUnitaireCt: integer("prix_unitaire_ct").default(20000).notNull(), // 200 € = 20000 ct
  startDate:      date("start_date").notNull(),
  nextVisit:      date("next_visit"),
  active:         boolean("active").default(true).notNull(),
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
  adminId:   text("admin_id").references(() => admins.id),
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

// ─── Logs Alex ────────────────────────────────────────────────────────────────

export const logsAlex = pgTable("logs_alex", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  leadId:    text("lead_id").references(() => leads.id),
  action:    varchar("action", { length: 100 }),
  input:     text("input"),
  output:    text("output"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  clients:       many(clients),
  interventions: many(interventions),
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
export type LogAlex          = typeof logsAlex.$inferSelect;

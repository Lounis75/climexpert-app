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

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  name:      varchar("name", { length: 255 }).notNull(),
  phone:     varchar("phone", { length: 30 }).notNull(),
  email:     varchar("email", { length: 255 }),
  location:  varchar("location", { length: 255 }),
  project:   projectTypeEnum("project"),
  message:   text("message"),
  status:    leadStatusEnum("status").default("nouveau").notNull(),
  source:    leadSourceEnum("source").default("formulaire").notNull(),
  notes:     text("notes"),
  clientId:  text("client_id").references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  name:      varchar("name", { length: 255 }).notNull(),
  phone:     varchar("phone", { length: 30 }).notNull(),
  email:     varchar("email", { length: 255 }),
  address:   text("address"),
  city:      varchar("city", { length: 100 }),
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Devis ────────────────────────────────────────────────────────────────────

export const devis = pgTable("devis", {
  id:              text("id").primaryKey().$defaultFn(() => createId()),
  number:          varchar("number", { length: 50 }).notNull().unique(),
  clientId:        text("client_id").notNull().references(() => clients.id),
  leadId:          text("lead_id").references(() => leads.id),
  status:          devisStatusEnum("status").default("brouillon").notNull(),
  totalHt:         numeric("total_ht", { precision: 10, scale: 2 }),
  totalTtc:        numeric("total_ttc", { precision: 10, scale: 2 }),
  tvaRate:         numeric("tva_rate", { precision: 5, scale: 2 }).default("5.5"),
  description:     text("description"),
  validUntil:      date("valid_until"),
  pennylaneId:     varchar("pennylane_id", { length: 100 }),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// ─── Factures ─────────────────────────────────────────────────────────────────

export const factures = pgTable("factures", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  number:      varchar("number", { length: 50 }).notNull().unique(),
  clientId:    text("client_id").notNull().references(() => clients.id),
  devisId:     text("devis_id").references(() => devis.id),
  status:      factureStatusEnum("status").default("en_attente").notNull(),
  totalHt:     numeric("total_ht", { precision: 10, scale: 2 }),
  totalTtc:    numeric("total_ttc", { precision: 10, scale: 2 }),
  tvaRate:     numeric("tva_rate", { precision: 5, scale: 2 }).default("5.5"),
  dueDate:     date("due_date"),
  paidAt:      timestamp("paid_at"),
  pennylaneId: varchar("pennylane_id", { length: 100 }),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

// ─── Techniciens ──────────────────────────────────────────────────────────────

export const techniciens = pgTable("techniciens", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  name:      varchar("name", { length: 255 }).notNull(),
  phone:     varchar("phone", { length: 30 }),
  email:     varchar("email", { length: 255 }).notNull().unique(),
  color:     varchar("color", { length: 7 }).default("#3b82f6"),
  active:    boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Interventions ────────────────────────────────────────────────────────────

export const interventions = pgTable("interventions", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  clientId:       text("client_id").notNull().references(() => clients.id),
  technicienId:   text("technicien_id").references(() => techniciens.id),
  devisId:        text("devis_id").references(() => devis.id),
  type:           projectTypeEnum("type").notNull(),
  status:         interventionStatusEnum("status").default("planifiée").notNull(),
  scheduledAt:    timestamp("scheduled_at"),
  completedAt:    timestamp("completed_at"),
  address:        text("address"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

// ─── Contrats entretien ───────────────────────────────────────────────────────

export const contratsEntretien = pgTable("contrats_entretien", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  clientId:      text("client_id").notNull().references(() => clients.id),
  units:         integer("units").default(1).notNull(),
  pricePerUnit:  numeric("price_per_unit", { precision: 8, scale: 2 }).default("200"),
  startDate:     date("start_date").notNull(),
  nextVisit:     date("next_visit"),
  active:        boolean("active").default(true).notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

// ─── SAV Tickets ──────────────────────────────────────────────────────────────

export const savTickets = pgTable("sav_tickets", {
  id:              text("id").primaryKey().$defaultFn(() => createId()),
  clientId:        text("client_id").notNull().references(() => clients.id),
  interventionId:  text("intervention_id").references(() => interventions.id),
  status:          savStatusEnum("status").default("ouvert").notNull(),
  subject:         varchar("subject", { length: 255 }).notNull(),
  description:     text("description"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// ─── Logs Alex ────────────────────────────────────────────────────────────────

export const logsAlex = pgTable("logs_alex", {
  id:         text("id").primaryKey().$defaultFn(() => createId()),
  sessionId:  varchar("session_id", { length: 100 }).notNull(),
  leadId:     text("lead_id").references(() => leads.id),
  action:     varchar("action", { length: 100 }),
  input:      text("input"),
  output:     text("output"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const clientsRelations = relations(clients, ({ many }) => ({
  leads:            many(leads),
  devis:            many(devis),
  factures:         many(factures),
  interventions:    many(interventions),
  contratsEntretien: many(contratsEntretien),
  savTickets:       many(savTickets),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  client:   one(clients, { fields: [leads.clientId], references: [clients.id] }),
  logsAlex: many(logsAlex),
}));

export const devisRelations = relations(devis, ({ one, many }) => ({
  client:        one(clients, { fields: [devis.clientId], references: [clients.id] }),
  lead:          one(leads, { fields: [devis.leadId], references: [leads.id] }),
  factures:      many(factures),
  interventions: many(interventions),
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
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Lead             = typeof leads.$inferSelect;
export type NewLead          = typeof leads.$inferInsert;
export type Client           = typeof clients.$inferSelect;
export type NewClient        = typeof clients.$inferInsert;
export type Devis            = typeof devis.$inferSelect;
export type NewDevis         = typeof devis.$inferInsert;
export type Facture          = typeof factures.$inferSelect;
export type NewFacture       = typeof factures.$inferInsert;
export type Technicien       = typeof techniciens.$inferSelect;
export type Intervention     = typeof interventions.$inferSelect;
export type ContratEntretien = typeof contratsEntretien.$inferSelect;
export type SavTicket        = typeof savTickets.$inferSelect;
export type LogAlex          = typeof logsAlex.$inferSelect;

import {
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

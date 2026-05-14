-- Migration: alignement schéma avec le brief CRM
-- Soft delete, montants en centimes, nouveaux champs, nouvelles tables

-- ─── Nouveau enum batiment_type ───────────────────────────────────────────────
CREATE TYPE "public"."batiment_type" AS ENUM('appartement', 'maison', 'local-professionnel', 'hotel-restaurant', 'copropriete');--> statement-breakpoint

-- ─── leads : nouveaux champs ──────────────────────────────────────────────────
ALTER TABLE "leads" ADD COLUMN "type_batiment" "batiment_type";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "surface_m2" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "anciennete_ans" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "equipement_interesse" varchar(100);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "notes_alex" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint

-- ─── clients : nouveaux champs ────────────────────────────────────────────────
ALTER TABLE "clients" ADD COLUMN "lead_id" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "equipement_installe" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "marque_modele" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "date_installation" date;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "technicien_id" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "garantie_expire_le" date;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "contrat_entretien_id" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- ─── devis : renommage + conversion centimes ──────────────────────────────────
ALTER TABLE "devis" RENAME COLUMN "total_ht" TO "total_ht_ct";--> statement-breakpoint
ALTER TABLE "devis" RENAME COLUMN "total_ttc" TO "total_ttc_ct";--> statement-breakpoint
ALTER TABLE "devis" ALTER COLUMN "total_ht_ct" TYPE integer USING ROUND(COALESCE("total_ht_ct"::numeric, 0) * 100)::integer;--> statement-breakpoint
ALTER TABLE "devis" ALTER COLUMN "total_ttc_ct" TYPE integer USING ROUND(COALESCE("total_ttc_ct"::numeric, 0) * 100)::integer;--> statement-breakpoint
ALTER TABLE "devis" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint

-- ─── factures : renommage + conversion centimes ───────────────────────────────
ALTER TABLE "factures" RENAME COLUMN "total_ht" TO "total_ht_ct";--> statement-breakpoint
ALTER TABLE "factures" RENAME COLUMN "total_ttc" TO "total_ttc_ct";--> statement-breakpoint
ALTER TABLE "factures" ALTER COLUMN "total_ht_ct" TYPE integer USING ROUND(COALESCE("total_ht_ct"::numeric, 0) * 100)::integer;--> statement-breakpoint
ALTER TABLE "factures" ALTER COLUMN "total_ttc_ct" TYPE integer USING ROUND(COALESCE("total_ttc_ct"::numeric, 0) * 100)::integer;--> statement-breakpoint
ALTER TABLE "factures" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint

-- ─── techniciens : soft delete ────────────────────────────────────────────────
ALTER TABLE "techniciens" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint

-- ─── interventions : soft delete ─────────────────────────────────────────────
ALTER TABLE "interventions" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint

-- ─── contrats_entretien : renommage + conversion centimes + soft delete ───────
ALTER TABLE "contrats_entretien" RENAME COLUMN "price_per_unit" TO "prix_unitaire_ct";--> statement-breakpoint
ALTER TABLE "contrats_entretien" ALTER COLUMN "prix_unitaire_ct" TYPE integer USING ROUND(COALESCE("prix_unitaire_ct"::numeric, 200) * 100)::integer;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ALTER COLUMN "prix_unitaire_ct" SET DEFAULT 20000;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ALTER COLUMN "prix_unitaire_ct" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD COLUMN "supprime_le" timestamp;--> statement-breakpoint

-- ─── admins ───────────────────────────────────────────────────────────────────
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"nom" varchar(255) NOT NULL,
	"totp_secret" text,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);--> statement-breakpoint

-- ─── lignes_devis ─────────────────────────────────────────────────────────────
CREATE TABLE "lignes_devis" (
	"id" text PRIMARY KEY NOT NULL,
	"devis_id" text NOT NULL,
	"designation" varchar(500) NOT NULL,
	"quantite" integer DEFAULT 1 NOT NULL,
	"prix_unitaire_ct" integer NOT NULL,
	"tva_rate" numeric(5, 2) DEFAULT '5.5',
	"ordre" integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
ALTER TABLE "lignes_devis" ADD CONSTRAINT "lignes_devis_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- ─── suivis ───────────────────────────────────────────────────────────────────
CREATE TABLE "suivis" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"lead_id" text,
	"intervention_id" text,
	"admin_id" text,
	"type" varchar(50) NOT NULL,
	"contenu" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"type" varchar(50) NOT NULL,
	"titre" varchar(255) NOT NULL,
	"contenu" text,
	"lu" boolean DEFAULT false NOT NULL,
	"ref_type" varchar(50),
	"ref_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- ─── logs_connexion ───────────────────────────────────────────────────────────
CREATE TABLE "logs_connexion" (
	"id" text PRIMARY KEY NOT NULL,
	"compte_type" varchar(20) NOT NULL,
	"compte_id" text NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"succes" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

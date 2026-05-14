CREATE TYPE "public"."devis_status" AS ENUM('brouillon', 'envoyé', 'accepté', 'refusé', 'expiré');--> statement-breakpoint
CREATE TYPE "public"."facture_status" AS ENUM('en_attente', 'payée', 'en_retard', 'annulée');--> statement-breakpoint
CREATE TYPE "public"."intervention_status" AS ENUM('planifiée', 'en_cours', 'terminée', 'annulée');--> statement-breakpoint
CREATE TYPE "public"."sav_status" AS ENUM('ouvert', 'en_cours', 'résolu', 'fermé');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contrats_entretien" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"units" integer DEFAULT 1 NOT NULL,
	"price_per_unit" numeric(8, 2) DEFAULT '200',
	"start_date" date NOT NULL,
	"next_visit" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devis" (
	"id" text PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"client_id" text NOT NULL,
	"lead_id" text,
	"status" "devis_status" DEFAULT 'brouillon' NOT NULL,
	"total_ht" numeric(10, 2),
	"total_ttc" numeric(10, 2),
	"tva_rate" numeric(5, 2) DEFAULT '5.5',
	"description" text,
	"valid_until" date,
	"pennylane_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devis_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "factures" (
	"id" text PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"client_id" text NOT NULL,
	"devis_id" text,
	"status" "facture_status" DEFAULT 'en_attente' NOT NULL,
	"total_ht" numeric(10, 2),
	"total_ttc" numeric(10, 2),
	"tva_rate" numeric(5, 2) DEFAULT '5.5',
	"due_date" date,
	"paid_at" timestamp,
	"pennylane_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "factures_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"technicien_id" text,
	"devis_id" text,
	"type" "project_type" NOT NULL,
	"status" "intervention_status" DEFAULT 'planifiée' NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_alex" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"lead_id" text,
	"action" varchar(100),
	"input" text,
	"output" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sav_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"intervention_id" text,
	"status" "sav_status" DEFAULT 'ouvert' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "techniciens" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255) NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "techniciens_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD CONSTRAINT "contrats_entretien_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_alex" ADD CONSTRAINT "logs_alex_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sav_tickets" ADD CONSTRAINT "sav_tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sav_tickets" ADD CONSTRAINT "sav_tickets_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
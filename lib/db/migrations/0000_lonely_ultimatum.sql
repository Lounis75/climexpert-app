CREATE TYPE "public"."lead_source" AS ENUM('alex', 'formulaire', 'téléphone', 'autre');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nouveau', 'contacté', 'devis_envoyé', 'gagné', 'perdu');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('installation', 'entretien', 'depannage', 'contrat-pro', 'autre');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"location" varchar(255),
	"project" "project_type",
	"message" text,
	"status" "lead_status" DEFAULT 'nouveau' NOT NULL,
	"source" "lead_source" DEFAULT 'formulaire' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

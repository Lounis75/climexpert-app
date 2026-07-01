CREATE TYPE "public"."revue_devis_status" AS ENUM('en_attente', 'validee', 'annulee');--> statement-breakpoint
CREATE TABLE "revues_devis" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text,
	"client_id" text,
	"client_type" varchar(20) DEFAULT 'particulier' NOT NULL,
	"project" varchar(40),
	"description" text,
	"lignes" jsonb NOT NULL,
	"client_snapshot" jsonb,
	"photos_urls" text[],
	"note_demande" text,
	"demande_par_id" text,
	"demande_par_nom" varchar(200),
	"status" "revue_devis_status" DEFAULT 'en_attente' NOT NULL,
	"note_expert" text,
	"revue_par_id" text,
	"revue_par_nom" varchar(200),
	"revue_le" timestamp,
	"montant_envoye_ct" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revues_devis" ADD CONSTRAINT "revues_devis_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "revues_devis_status_idx" ON "revues_devis" USING btree ("status");
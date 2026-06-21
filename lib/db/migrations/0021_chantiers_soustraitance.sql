CREATE TABLE "chantiers" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"lead_id" text,
	"nom" varchar(255) NOT NULL,
	"statut" varchar(20) DEFAULT 'en_cours' NOT NULL,
	"montant_ct" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "chantier_id" text;--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "site_nom" varchar(255);--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "site_adresse" text;--> statement-breakpoint
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chantiers_client_id_idx" ON "chantiers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "chantiers_statut_idx" ON "chantiers" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "interventions_chantier_id_idx" ON "interventions" USING btree ("chantier_id");
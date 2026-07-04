CREATE TABLE "creneaux_alex" (
	"id" text PRIMARY KEY NOT NULL,
	"debut" timestamp NOT NULL,
	"fin" timestamp NOT NULL,
	"commercial_id" text,
	"statut" varchar(20) DEFAULT 'ouvert' NOT NULL,
	"lead_id" text,
	"reserve_le" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "rdv_par_alex" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creneaux_alex" ADD CONSTRAINT "creneaux_alex_commercial_id_techniciens_id_fk" FOREIGN KEY ("commercial_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creneaux_alex" ADD CONSTRAINT "creneaux_alex_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "creneaux_alex_statut_debut_idx" ON "creneaux_alex" USING btree ("statut","debut");
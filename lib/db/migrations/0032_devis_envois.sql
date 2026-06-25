CREATE TABLE "devis_envois" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"url" text NOT NULL,
	"nom_fichier" varchar(255),
	"token" varchar(100) NOT NULL,
	"montant_ct" integer,
	"envoye_le" timestamp DEFAULT now() NOT NULL,
	"decision" varchar(20),
	"decision_le" timestamp,
	"motif_refus" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devis_envois_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "devis_envois" ADD CONSTRAINT "devis_envois_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devis_envois_lead_id_idx" ON "devis_envois" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "devis_envois_token_idx" ON "devis_envois" USING btree ("token");
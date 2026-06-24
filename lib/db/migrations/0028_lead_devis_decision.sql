ALTER TABLE "leads" ADD COLUMN "devis_url" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "devis_nom_fichier" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "devis_envoye_le" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "devis_token" varchar(100);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "devis_decision" varchar(20);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "devis_decision_le" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "devis_motif_refus" text;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_devis_token_unique" UNIQUE("devis_token");
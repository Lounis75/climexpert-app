ALTER TABLE "clients" ADD COLUMN "prochain_entretien_le" date;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "relance_entretien_notifiee" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "sous_contrat" boolean;
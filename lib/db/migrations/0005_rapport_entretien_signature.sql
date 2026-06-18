ALTER TABLE "contrats_entretien" ADD COLUMN "signature_url" text;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD COLUMN "signe_le" timestamp;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "entretien_annuel_propose" boolean;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "entretien_annuel_accepte" boolean;
ALTER TABLE "contrats_entretien" ADD COLUMN "signature_token" varchar(64);--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD COLUMN "signature_demandee_le" timestamp;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD COLUMN "signature_ip" varchar(64);
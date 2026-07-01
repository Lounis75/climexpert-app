ALTER TABLE "rapports_intervention" ADD COLUMN "cerfa_data" jsonb;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "cerfa_signature_token" varchar(64);--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "cerfa_signature_demandee_le" timestamp;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "cerfa_client_signe_le" timestamp;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "cerfa_signature_ip" varchar(64);--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD COLUMN "cerfa_attestation_url" text;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD CONSTRAINT "rapports_intervention_cerfa_signature_token_unique" UNIQUE("cerfa_signature_token");
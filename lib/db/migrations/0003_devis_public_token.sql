-- Migration: ajout du token public pour les devis clients
ALTER TABLE "devis" ADD COLUMN "public_token" varchar(100);--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_public_token_unique" UNIQUE("public_token");--> statement-breakpoint

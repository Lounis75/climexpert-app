ALTER TABLE "leads" ADD COLUMN "qualif_token" varchar(64);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "qualif_le" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_qualif_token_unique" UNIQUE("qualif_token");
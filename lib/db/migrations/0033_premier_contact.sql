ALTER TABLE "leads" ADD COLUMN "tentatives_appel" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "dernier_appel_le" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "motif_perdu" varchar(40);--> statement-breakpoint
-- La colonne "Pas de réponse" disparaît : les prospects non-répondants restent dans "Nouveau".
UPDATE "leads" SET "status" = 'nouveau' WHERE "status" = 'pas_de_reponse';
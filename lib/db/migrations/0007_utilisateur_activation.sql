ALTER TABLE "utilisateurs" ADD COLUMN "activation_token" text;--> statement-breakpoint
ALTER TABLE "utilisateurs" ADD COLUMN "activation_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_activation_token_unique" UNIQUE("activation_token");
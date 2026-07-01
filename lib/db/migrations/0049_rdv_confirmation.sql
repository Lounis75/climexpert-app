ALTER TABLE "interventions" ADD COLUMN "confirm_token" varchar(100);--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "client_confirmation" varchar(20);--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "client_confirmation_le" timestamp;--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "client_confirmation_msg" text;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_confirm_token_unique" UNIQUE("confirm_token");
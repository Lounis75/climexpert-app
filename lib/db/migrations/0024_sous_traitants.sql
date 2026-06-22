ALTER TABLE "techniciens" ADD COLUMN "externe" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "techniciens" ADD COLUMN "entreprise" varchar(255);--> statement-breakpoint
ALTER TABLE "techniciens" ADD COLUMN "specialite" varchar(255);
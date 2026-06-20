ALTER TABLE "clients" ADD COLUMN "type_client" varchar(20) DEFAULT 'particulier' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "civilite" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "siret" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "forme_juridique" varchar(120);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "representant" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "representant_qualite" varchar(80);--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD COLUMN "numero" varchar(30);--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD COLUMN "fluide" varchar(20) DEFAULT 'R410A';
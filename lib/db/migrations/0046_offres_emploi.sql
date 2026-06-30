CREATE TABLE "offres_emploi" (
	"id" text PRIMARY KEY NOT NULL,
	"titre" varchar(200) NOT NULL,
	"contrat" varchar(40) DEFAULT 'CDI' NOT NULL,
	"lieu" varchar(120) DEFAULT 'Île-de-France',
	"description" text NOT NULL,
	"profil" text,
	"actif" boolean DEFAULT true NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp
);
--> statement-breakpoint
CREATE INDEX "offres_emploi_actif_idx" ON "offres_emploi" USING btree ("actif");
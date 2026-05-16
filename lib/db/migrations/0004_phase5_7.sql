-- Phase 5-7 : technicien app, rapports, disponibilités, clientToken
--> statement-breakpoint

-- Techniciens : nouveaux champs
ALTER TABLE "techniciens" ADD COLUMN IF NOT EXISTS "prenom" varchar(255);
ALTER TABLE "techniciens" ADD COLUMN IF NOT EXISTS "role" varchar(50) DEFAULT 'technicien';
ALTER TABLE "techniciens" ADD COLUMN IF NOT EXISTS "zones_geo" text[];
ALTER TABLE "techniciens" ADD COLUMN IF NOT EXISTS "actif" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- Clients : token permanent
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "client_token" varchar(64);
ALTER TABLE "clients" ADD CONSTRAINT IF NOT EXISTS "clients_client_token_unique" UNIQUE("client_token");
--> statement-breakpoint

-- Interventions : nouveaux champs
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "code_postal" varchar(10);
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "duree_estimee_minutes" integer;
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "duree_reelle_minutes" integer;
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "rdv_token" varchar(100);
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "annule_par" varchar(20);
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "motif_annulation" text;
ALTER TABLE "interventions" ADD CONSTRAINT IF NOT EXISTS "interventions_rdv_token_unique" UNIQUE("rdv_token");
--> statement-breakpoint

-- Nouvelle table : magic_link_tokens
CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "technicien_id" text NOT NULL REFERENCES "techniciens"("id"),
  "token" varchar(128) NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Nouvelle table : rapports_intervention
CREATE TABLE IF NOT EXISTS "rapports_intervention" (
  "id" text PRIMARY KEY NOT NULL,
  "intervention_id" text NOT NULL UNIQUE REFERENCES "interventions"("id"),
  "technicien_id" text NOT NULL REFERENCES "techniciens"("id"),
  "installation_conforme" boolean DEFAULT true NOT NULL,
  "notes" text,
  "photos_urls" text[],
  "dimensions_piece" varchar(100),
  "type_mur" varchar(100),
  "distance_groupes" varchar(100),
  "contraintes_elec" text,
  "equipement_recommande" text,
  "difficulte" varchar(30),
  "date_soumission" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Nouvelle table : disponibilites_bloquees
CREATE TABLE IF NOT EXISTS "disponibilites_bloquees" (
  "id" text PRIMARY KEY NOT NULL,
  "technicien_id" text NOT NULL REFERENCES "techniciens"("id"),
  "date_debut" timestamp NOT NULL,
  "date_fin" timestamp NOT NULL,
  "motif" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Enum technicien_role (créé côté Drizzle, ajouté ici pour cohérence)
DO $$ BEGIN
  CREATE TYPE "technicien_role" AS ENUM ('technicien', 'technico_commercial', 'responsable');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- MIGRATION IDEMPOTENTE COMPLÈTE — ClimExpert
-- Peut être exécutée plusieurs fois sans erreur.
-- Copiez-collez l'intégralité dans l'éditeur SQL de Neon puis cliquez Run.
-- =============================================================================

-- ─── ENUMs ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."lead_source" AS ENUM('alex', 'formulaire', 'téléphone', 'autre');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lead_status" AS ENUM('nouveau', 'contacté', 'devis_envoyé', 'gagné', 'perdu');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."project_type" AS ENUM('installation', 'entretien', 'depannage', 'contrat-pro', 'autre');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."devis_status" AS ENUM('brouillon', 'envoyé', 'accepté', 'refusé', 'expiré');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."facture_status" AS ENUM('en_attente', 'payée', 'en_retard', 'annulée');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."intervention_status" AS ENUM('planifiée', 'en_cours', 'terminée', 'annulée');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."sav_status" AS ENUM('ouvert', 'en_cours', 'résolu', 'fermé');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."batiment_type" AS ENUM('appartement', 'maison', 'local-professionnel', 'hotel-restaurant', 'copropriete');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."technicien_role" AS ENUM('technicien', 'technico_commercial', 'responsable');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- ─── TABLES ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "leads" (
  "id"                    text PRIMARY KEY NOT NULL,
  "name"                  varchar(255) NOT NULL,
  "phone"                 varchar(30) NOT NULL,
  "email"                 varchar(255),
  "location"              varchar(255),
  "project"               "project_type",
  "message"               text,
  "status"                "lead_status" DEFAULT 'nouveau' NOT NULL,
  "source"                "lead_source" DEFAULT 'formulaire' NOT NULL,
  "created_at"            timestamp DEFAULT now() NOT NULL,
  "updated_at"            timestamp DEFAULT now() NOT NULL,
  "notes"                 text,
  "client_id"             text,
  "type_batiment"         "batiment_type",
  "surface_m2"            integer,
  "anciennete_ans"        integer,
  "equipement_interesse"  varchar(100),
  "notes_alex"            text,
  "supprime_le"           timestamp
);

CREATE TABLE IF NOT EXISTS "techniciens" (
  "id"          text PRIMARY KEY NOT NULL,
  "name"        varchar(255) NOT NULL,
  "phone"       varchar(30),
  "email"       varchar(255) NOT NULL,
  "color"       varchar(7) DEFAULT '#3b82f6',
  "active"      boolean DEFAULT true NOT NULL,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "supprime_le" timestamp,
  "prenom"      varchar(255),
  "role"        varchar(50) DEFAULT 'technicien',
  "zones_geo"   text[],
  "actif"       boolean DEFAULT false NOT NULL,
  CONSTRAINT "techniciens_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "clients" (
  "id"                   text PRIMARY KEY NOT NULL,
  "name"                 varchar(255) NOT NULL,
  "phone"                varchar(30) NOT NULL,
  "email"                varchar(255),
  "address"              text,
  "city"                 varchar(100),
  "notes"                text,
  "created_at"           timestamp DEFAULT now() NOT NULL,
  "updated_at"           timestamp DEFAULT now() NOT NULL,
  "lead_id"              text,
  "equipement_installe"  text,
  "marque_modele"        varchar(255),
  "date_installation"    date,
  "technicien_id"        text,
  "garantie_expire_le"   date,
  "contrat_entretien_id" text,
  "supprime_le"          timestamp,
  "client_token"         varchar(64)
);

CREATE TABLE IF NOT EXISTS "admins" (
  "id"          text PRIMARY KEY NOT NULL,
  "email"       varchar(255) NOT NULL,
  "nom"         varchar(255) NOT NULL,
  "totp_secret" text,
  "actif"       boolean DEFAULT true NOT NULL,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "supprime_le" timestamp,
  CONSTRAINT "admins_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "contrats_entretien" (
  "id"               text PRIMARY KEY NOT NULL,
  "client_id"        text NOT NULL,
  "units"            integer DEFAULT 1 NOT NULL,
  "prix_unitaire_ct" integer DEFAULT 20000 NOT NULL,
  "start_date"       date NOT NULL,
  "next_visit"       date,
  "active"           boolean DEFAULT true NOT NULL,
  "created_at"       timestamp DEFAULT now() NOT NULL,
  "supprime_le"      timestamp
);

CREATE TABLE IF NOT EXISTS "devis" (
  "id"           text PRIMARY KEY NOT NULL,
  "number"       varchar(50) NOT NULL,
  "client_id"    text NOT NULL,
  "lead_id"      text,
  "status"       "devis_status" DEFAULT 'brouillon' NOT NULL,
  "total_ht_ct"  integer,
  "total_ttc_ct" integer,
  "tva_rate"     numeric(5, 2) DEFAULT '5.5',
  "description"  text,
  "valid_until"  date,
  "pennylane_id" varchar(100),
  "created_at"   timestamp DEFAULT now() NOT NULL,
  "updated_at"   timestamp DEFAULT now() NOT NULL,
  "supprime_le"  timestamp,
  "public_token" varchar(100),
  CONSTRAINT "devis_number_unique" UNIQUE("number")
);

CREATE TABLE IF NOT EXISTS "lignes_devis" (
  "id"               text PRIMARY KEY NOT NULL,
  "devis_id"         text NOT NULL,
  "designation"      varchar(500) NOT NULL,
  "quantite"         integer DEFAULT 1 NOT NULL,
  "prix_unitaire_ct" integer NOT NULL,
  "tva_rate"         numeric(5, 2) DEFAULT '5.5',
  "ordre"            integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "factures" (
  "id"           text PRIMARY KEY NOT NULL,
  "number"       varchar(50) NOT NULL,
  "client_id"    text NOT NULL,
  "devis_id"     text,
  "status"       "facture_status" DEFAULT 'en_attente' NOT NULL,
  "total_ht_ct"  integer,
  "total_ttc_ct" integer,
  "tva_rate"     numeric(5, 2) DEFAULT '5.5',
  "due_date"     date,
  "paid_at"      timestamp,
  "pennylane_id" varchar(100),
  "created_at"   timestamp DEFAULT now() NOT NULL,
  "updated_at"   timestamp DEFAULT now() NOT NULL,
  "supprime_le"  timestamp,
  CONSTRAINT "factures_number_unique" UNIQUE("number")
);

CREATE TABLE IF NOT EXISTS "interventions" (
  "id"                    text PRIMARY KEY NOT NULL,
  "client_id"             text NOT NULL,
  "technicien_id"         text,
  "devis_id"              text,
  "type"                  "project_type" NOT NULL,
  "status"                "intervention_status" DEFAULT 'planifiée' NOT NULL,
  "scheduled_at"          timestamp,
  "completed_at"          timestamp,
  "address"               text,
  "notes"                 text,
  "created_at"            timestamp DEFAULT now() NOT NULL,
  "updated_at"            timestamp DEFAULT now() NOT NULL,
  "supprime_le"           timestamp,
  "code_postal"           varchar(10),
  "duree_estimee_minutes" integer,
  "duree_reelle_minutes"  integer,
  "rdv_token"             varchar(100),
  "annule_par"            varchar(20),
  "motif_annulation"      text,
  "rdv_token_choix"       integer,
  "rdv_token_creneaux"    text,
  "intervention_origine_id" text
);

CREATE TABLE IF NOT EXISTS "sav_tickets" (
  "id"              text PRIMARY KEY NOT NULL,
  "client_id"       text NOT NULL,
  "intervention_id" text,
  "status"          "sav_status" DEFAULT 'ouvert' NOT NULL,
  "subject"         varchar(255) NOT NULL,
  "description"     text,
  "created_at"      timestamp DEFAULT now() NOT NULL,
  "updated_at"      timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "suivis" (
  "id"              text PRIMARY KEY NOT NULL,
  "client_id"       text,
  "lead_id"         text,
  "intervention_id" text,
  "admin_id"        text,
  "type"            varchar(50) NOT NULL,
  "contenu"         text,
  "created_at"      timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "logs_alex" (
  "id"         text PRIMARY KEY NOT NULL,
  "session_id" varchar(100) NOT NULL,
  "lead_id"    text,
  "action"     varchar(100),
  "input"      text,
  "output"     text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"         text PRIMARY KEY NOT NULL,
  "admin_id"   text,
  "type"       varchar(50) NOT NULL,
  "titre"      varchar(255) NOT NULL,
  "contenu"    text,
  "lu"         boolean DEFAULT false NOT NULL,
  "ref_type"   varchar(50),
  "ref_id"     text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "logs_connexion" (
  "id"          text PRIMARY KEY NOT NULL,
  "compte_type" varchar(20) NOT NULL,
  "compte_id"   text NOT NULL,
  "ip"          varchar(45),
  "user_agent"  text,
  "succes"      boolean DEFAULT true NOT NULL,
  "created_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
  "id"            text PRIMARY KEY NOT NULL,
  "technicien_id" text NOT NULL,
  "token"         varchar(128) NOT NULL,
  "expires_at"    timestamp NOT NULL,
  "used_at"       timestamp,
  "created_at"    timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "rapports_intervention" (
  "id"                    text PRIMARY KEY NOT NULL,
  "intervention_id"       text NOT NULL,
  "technicien_id"         text NOT NULL,
  "installation_conforme" boolean DEFAULT true NOT NULL,
  "notes"                 text,
  "photos_urls"           text[],
  "dimensions_piece"      varchar(100),
  "type_mur"              varchar(100),
  "distance_groupes"      varchar(100),
  "contraintes_elec"      text,
  "equipement_recommande" text,
  "difficulte"            varchar(30),
  "date_soumission"       timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "rapports_intervention_intervention_id_unique" UNIQUE("intervention_id")
);

CREATE TABLE IF NOT EXISTS "disponibilites_bloquees" (
  "id"            text PRIMARY KEY NOT NULL,
  "technicien_id" text NOT NULL,
  "date_debut"    timestamp NOT NULL,
  "date_fin"      timestamp NOT NULL,
  "motif"         varchar(255),
  "created_at"    timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "periodes_capacite" (
  "id"                        text PRIMARY KEY,
  "nom"                       varchar(255) NOT NULL,
  "date_debut"                date NOT NULL,
  "date_fin"                  date NOT NULL,
  "max_interventions_semaine" integer NOT NULL,
  "note"                      text,
  "created_at"                timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "suivis_planifies" (
  "id"             text PRIMARY KEY,
  "client_id"      text NOT NULL,
  "intervention_id" text,
  "type_suivi"     varchar(20) NOT NULL,
  "canal"          varchar(20) NOT NULL,
  "statut"         varchar(30) DEFAULT 'planifie' NOT NULL,
  "date_prevue"    date NOT NULL,
  "date_envoi"     timestamp,
  "reponse_client" text,
  "created_at"     timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id"          text PRIMARY KEY,
  "admin_id"    text,
  "action"      varchar(100) NOT NULL,
  "table_cible" varchar(50),
  "id_cible"    text,
  "avant_json"  text,
  "apres_json"  text,
  "ip"          varchar(45),
  "created_at"  timestamp DEFAULT now() NOT NULL
);


-- ─── COLONNES supplémentaires (idempotent) ────────────────────────────────────
-- Ces ALTER sont là au cas où certaines colonnes manqueraient suite à une migration partielle.

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "client_token" varchar(64);
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "rdv_token_choix" integer;
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "rdv_token_creneaux" text;
ALTER TABLE "interventions" ADD COLUMN IF NOT EXISTS "intervention_origine_id" text;


-- ─── UNIQUE CONSTRAINTS (idempotent) ─────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "clients" ADD CONSTRAINT "clients_client_token_unique" UNIQUE("client_token");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "devis" ADD CONSTRAINT "devis_public_token_unique" UNIQUE("public_token");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "interventions" ADD CONSTRAINT "interventions_rdv_token_unique" UNIQUE("rdv_token");
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- ─── FOREIGN KEYS (idempotent) ────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "clients" ADD CONSTRAINT "clients_technicien_id_techniciens_id_fk"
    FOREIGN KEY ("technicien_id") REFERENCES "techniciens"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "contrats_entretien" ADD CONSTRAINT "contrats_entretien_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "devis" ADD CONSTRAINT "devis_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "devis" ADD CONSTRAINT "devis_lead_id_leads_id_fk"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "lignes_devis" ADD CONSTRAINT "lignes_devis_devis_id_devis_id_fk"
    FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "factures" ADD CONSTRAINT "factures_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "factures" ADD CONSTRAINT "factures_devis_id_devis_id_fk"
    FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "interventions" ADD CONSTRAINT "interventions_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "interventions" ADD CONSTRAINT "interventions_technicien_id_techniciens_id_fk"
    FOREIGN KEY ("technicien_id") REFERENCES "techniciens"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "interventions" ADD CONSTRAINT "interventions_devis_id_devis_id_fk"
    FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sav_tickets" ADD CONSTRAINT "sav_tickets_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sav_tickets" ADD CONSTRAINT "sav_tickets_intervention_id_interventions_id_fk"
    FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "suivis" ADD CONSTRAINT "suivis_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "suivis" ADD CONSTRAINT "suivis_lead_id_leads_id_fk"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "suivis" ADD CONSTRAINT "suivis_intervention_id_interventions_id_fk"
    FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "suivis" ADD CONSTRAINT "suivis_admin_id_admins_id_fk"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "logs_alex" ADD CONSTRAINT "logs_alex_lead_id_leads_id_fk"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_technicien_id_techniciens_id_fk"
    FOREIGN KEY ("technicien_id") REFERENCES "techniciens"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "rapports_intervention" ADD CONSTRAINT "rapports_intervention_intervention_id_fk"
    FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "rapports_intervention" ADD CONSTRAINT "rapports_intervention_technicien_id_fk"
    FOREIGN KEY ("technicien_id") REFERENCES "techniciens"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "disponibilites_bloquees" ADD CONSTRAINT "disponibilites_bloquees_technicien_id_fk"
    FOREIGN KEY ("technicien_id") REFERENCES "techniciens"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "suivis_planifies" ADD CONSTRAINT "suivis_planifies_client_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "suivis_planifies" ADD CONSTRAINT "suivis_planifies_intervention_id_fk"
    FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_fk"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- FIN — Toutes les tables et types sont créés ou déjà présents.
-- =============================================================================

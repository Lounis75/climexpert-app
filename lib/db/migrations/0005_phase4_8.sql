-- Phase 4 & 8: periodes_capacite, suivis_planifies, audit_log, intervention additions

ALTER TABLE "interventions"
  ADD COLUMN IF NOT EXISTS "rdv_token_choix"          integer,
  ADD COLUMN IF NOT EXISTS "rdv_token_creneaux"       text,
  ADD COLUMN IF NOT EXISTS "intervention_origine_id"  text;

CREATE TABLE IF NOT EXISTS "periodes_capacite" (
  "id"                         text PRIMARY KEY,
  "nom"                        varchar(255) NOT NULL,
  "date_debut"                 date NOT NULL,
  "date_fin"                   date NOT NULL,
  "max_interventions_semaine"  integer NOT NULL,
  "note"                       text,
  "created_at"                 timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "suivis_planifies" (
  "id"              text PRIMARY KEY,
  "client_id"       text NOT NULL REFERENCES "clients"("id"),
  "intervention_id" text REFERENCES "interventions"("id"),
  "type_suivi"      varchar(20) NOT NULL,
  "canal"           varchar(20) NOT NULL,
  "statut"          varchar(30) DEFAULT 'planifie' NOT NULL,
  "date_prevue"     date NOT NULL,
  "date_envoi"      timestamp,
  "reponse_client"  text,
  "created_at"      timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id"           text PRIMARY KEY,
  "admin_id"     text REFERENCES "admins"("id"),
  "action"       varchar(100) NOT NULL,
  "table_cible"  varchar(50),
  "id_cible"     text,
  "avant_json"   text,
  "apres_json"   text,
  "ip"           varchar(45),
  "created_at"   timestamp DEFAULT now() NOT NULL
);

CREATE TYPE "public"."batiment_type" AS ENUM('appartement', 'maison', 'local-professionnel', 'hotel-restaurant', 'copropriete');--> statement-breakpoint
CREATE TYPE "public"."devis_status" AS ENUM('brouillon', 'envoyé', 'accepté', 'refusé', 'expiré');--> statement-breakpoint
CREATE TYPE "public"."facture_status" AS ENUM('en_attente', 'payée', 'en_retard', 'annulée');--> statement-breakpoint
CREATE TYPE "public"."intervention_status" AS ENUM('planifiée', 'en_cours', 'terminée', 'annulée');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('alex', 'formulaire', 'téléphone', 'autre', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nouveau', 'contacté', 'devis_envoyé', 'gagné', 'perdu', 'pas_de_reponse');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('installation', 'entretien', 'depannage', 'contrat-pro', 'autre');--> statement-breakpoint
CREATE TYPE "public"."sav_status" AS ENUM('ouvert', 'en_cours', 'résolu', 'fermé');--> statement-breakpoint
CREATE TYPE "public"."technicien_role" AS ENUM('technicien', 'technico_commercial', 'responsable');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"nom" varchar(255) NOT NULL,
	"totp_secret" text,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"action" varchar(100) NOT NULL,
	"table_cible" varchar(50),
	"id_cible" text,
	"avant_json" text,
	"apres_json" text,
	"ip" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"notes" text,
	"lead_id" text,
	"equipement_installe" text,
	"marque_modele" varchar(255),
	"date_installation" date,
	"technicien_id" text,
	"garantie_expire_le" date,
	"contrat_entretien_id" text,
	"client_token" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "clients_client_token_unique" UNIQUE("client_token")
);
--> statement-breakpoint
CREATE TABLE "contrats_entretien" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"units" integer DEFAULT 1 NOT NULL,
	"prix_unitaire_ct" integer DEFAULT 20000 NOT NULL,
	"start_date" date NOT NULL,
	"next_visit" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp
);
--> statement-breakpoint
CREATE TABLE "devis" (
	"id" text PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"client_id" text NOT NULL,
	"lead_id" text,
	"status" "devis_status" DEFAULT 'brouillon' NOT NULL,
	"total_ht_ct" integer,
	"total_ttc_ct" integer,
	"tva_rate" numeric(5, 2) DEFAULT '5.5',
	"description" text,
	"valid_until" date,
	"pennylane_id" varchar(100),
	"public_token" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "devis_number_unique" UNIQUE("number"),
	CONSTRAINT "devis_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "disponibilites_bloquees" (
	"id" text PRIMARY KEY NOT NULL,
	"technicien_id" text NOT NULL,
	"date_debut" timestamp NOT NULL,
	"date_fin" timestamp NOT NULL,
	"motif" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynamic_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dynamic_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "factures" (
	"id" text PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"client_id" text NOT NULL,
	"devis_id" text,
	"status" "facture_status" DEFAULT 'en_attente' NOT NULL,
	"total_ht_ct" integer,
	"total_ttc_ct" integer,
	"tva_rate" numeric(5, 2) DEFAULT '5.5',
	"due_date" date,
	"paid_at" timestamp,
	"pennylane_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "factures_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"technicien_id" text,
	"devis_id" text,
	"type" "project_type" NOT NULL,
	"status" "intervention_status" DEFAULT 'planifiée' NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"address" text,
	"code_postal" varchar(10),
	"notes" text,
	"duree_estimee_minutes" integer,
	"duree_reelle_minutes" integer,
	"rdv_token" varchar(100),
	"rdv_token_choix" integer,
	"rdv_token_creneaux" text,
	"annule_par" varchar(20),
	"motif_annulation" text,
	"intervention_origine_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "interventions_rdv_token_unique" UNIQUE("rdv_token")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"location" varchar(255),
	"address" text,
	"project" "project_type",
	"type_batiment" "batiment_type",
	"surface_m2" integer,
	"anciennete_ans" integer,
	"equipement_interesse" varchar(100),
	"message" text,
	"notes_alex" text,
	"status" "lead_status" DEFAULT 'nouveau' NOT NULL,
	"source" "lead_source" DEFAULT 'formulaire' NOT NULL,
	"notes" text,
	"client_id" text,
	"commercial_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp
);
--> statement-breakpoint
CREATE TABLE "lignes_devis" (
	"id" text PRIMARY KEY NOT NULL,
	"devis_id" text NOT NULL,
	"designation" varchar(500) NOT NULL,
	"quantite" integer DEFAULT 1 NOT NULL,
	"prix_unitaire_ct" integer NOT NULL,
	"tva_rate" numeric(5, 2) DEFAULT '5.5',
	"ordre" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_alex" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"lead_id" text,
	"action" varchar(100),
	"input" text,
	"output" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_connexion" (
	"id" text PRIMARY KEY NOT NULL,
	"compte_type" varchar(20) NOT NULL,
	"compte_id" text NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"succes" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"technicien_id" text NOT NULL,
	"token" varchar(128) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"type" varchar(50) NOT NULL,
	"titre" varchar(255) NOT NULL,
	"contenu" text,
	"lu" boolean DEFAULT false NOT NULL,
	"ref_type" varchar(50),
	"ref_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "periodes_capacite" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" varchar(255) NOT NULL,
	"date_debut" date NOT NULL,
	"date_fin" date NOT NULL,
	"max_interventions_semaine" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rapports_intervention" (
	"id" text PRIMARY KEY NOT NULL,
	"intervention_id" text NOT NULL,
	"technicien_id" text NOT NULL,
	"installation_conforme" boolean DEFAULT true NOT NULL,
	"notes" text,
	"photos_urls" text[],
	"dimensions_piece" varchar(100),
	"type_mur" varchar(100),
	"distance_groupes" varchar(100),
	"contraintes_elec" text,
	"equipement_recommande" text,
	"difficulte" varchar(30),
	"date_soumission" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rapports_intervention_intervention_id_unique" UNIQUE("intervention_id")
);
--> statement-breakpoint
CREATE TABLE "sav_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"intervention_id" text,
	"status" "sav_status" DEFAULT 'ouvert' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suivis" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"lead_id" text,
	"intervention_id" text,
	"admin_id" text,
	"type" varchar(50) NOT NULL,
	"contenu" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suivis_planifies" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"intervention_id" text,
	"type_suivi" varchar(20) NOT NULL,
	"canal" varchar(20) NOT NULL,
	"statut" varchar(30) DEFAULT 'planifie' NOT NULL,
	"date_prevue" date NOT NULL,
	"date_envoi" timestamp,
	"reponse_client" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "techniciens" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"prenom" varchar(255),
	"phone" varchar(30),
	"email" varchar(255) NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6',
	"role" "technicien_role" DEFAULT 'technicien',
	"zones_geo" text[],
	"active" boolean DEFAULT true NOT NULL,
	"actif" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "techniciens_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrats_entretien" ADD CONSTRAINT "contrats_entretien_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devis" ADD CONSTRAINT "devis_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disponibilites_bloquees" ADD CONSTRAINT "disponibilites_bloquees_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factures" ADD CONSTRAINT "factures_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_commercial_id_techniciens_id_fk" FOREIGN KEY ("commercial_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lignes_devis" ADD CONSTRAINT "lignes_devis_devis_id_devis_id_fk" FOREIGN KEY ("devis_id") REFERENCES "public"."devis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_alex" ADD CONSTRAINT "logs_alex_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD CONSTRAINT "rapports_intervention_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rapports_intervention" ADD CONSTRAINT "rapports_intervention_technicien_id_techniciens_id_fk" FOREIGN KEY ("technicien_id") REFERENCES "public"."techniciens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sav_tickets" ADD CONSTRAINT "sav_tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sav_tickets" ADD CONSTRAINT "sav_tickets_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis" ADD CONSTRAINT "suivis_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis_planifies" ADD CONSTRAINT "suivis_planifies_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suivis_planifies" ADD CONSTRAINT "suivis_planifies_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "factures_status_idx" ON "factures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "factures_due_date_idx" ON "factures" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "factures_paid_at_idx" ON "factures" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "interventions_scheduled_at_idx" ON "interventions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "interventions_status_idx" ON "interventions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_supprime_le_idx" ON "leads" USING btree ("supprime_le");--> statement-breakpoint
CREATE INDEX "logs_alex_action_idx" ON "logs_alex" USING btree ("action");--> statement-breakpoint
CREATE INDEX "logs_alex_created_at_idx" ON "logs_alex" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "logs_alex_session_id_idx" ON "logs_alex" USING btree ("session_id");
CREATE TABLE "utilisateurs" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"nom" varchar(255) NOT NULL,
	"prenom" varchar(255),
	"phone" varchar(30),
	"color" varchar(7) DEFAULT '#0ea5e9',
	"roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"password_hash" text,
	"totp_secret" text,
	"doit_definir_mdp" boolean DEFAULT true NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"technicien_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"supprime_le" timestamp,
	CONSTRAINT "utilisateurs_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "utilisateurs_email_idx" ON "utilisateurs" USING btree ("email");
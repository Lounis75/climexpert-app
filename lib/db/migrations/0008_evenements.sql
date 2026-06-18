CREATE TABLE "evenements" (
	"id" text PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"path" text,
	"session_id" varchar(100),
	"referer" text,
	"meta" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "evenements_type_idx" ON "evenements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "evenements_created_at_idx" ON "evenements" USING btree ("created_at");
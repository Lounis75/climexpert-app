CREATE SEQUENCE "public"."devis_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_lead_id_unique" ON "clients" USING btree ("lead_id") WHERE lead_id is not null and supprime_le is null;--> statement-breakpoint
CREATE INDEX "evenements_type_created_idx" ON "evenements" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "suivis_lead_created_idx" ON "suivis" USING btree ("lead_id","created_at");
CREATE INDEX "clients_prochain_entretien_le_idx" ON "clients" USING btree ("prochain_entretien_le");--> statement-breakpoint
CREATE INDEX "notifications_admin_id_lu_idx" ON "notifications" USING btree ("admin_id","lu");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sav_tickets_status_idx" ON "sav_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sav_tickets_client_id_idx" ON "sav_tickets" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "suivis_planifies_statut_date_prevue_idx" ON "suivis_planifies" USING btree ("statut","date_prevue");--> statement-breakpoint
CREATE INDEX "suivis_planifies_intervention_id_idx" ON "suivis_planifies" USING btree ("intervention_id");--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "public"."facture_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
SELECT setval('facture_number_seq', (SELECT COALESCE(MAX(NULLIF(split_part(number, '-', 3), '')::int), 0) + 1 FROM factures), false);
CREATE INDEX "interventions_status_scheduled_at_idx" ON "interventions" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "interventions_technicien_id_idx" ON "interventions" USING btree ("technicien_id");--> statement-breakpoint
CREATE INDEX "interventions_client_id_idx" ON "interventions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "leads_status_created_at_idx" ON "leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "leads_commercial_id_idx" ON "leads" USING btree ("commercial_id");--> statement-breakpoint
CREATE INDEX "leads_rdv_date_idx" ON "leads" USING btree ("rdv_date");
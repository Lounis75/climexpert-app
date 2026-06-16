-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" ("status");
CREATE INDEX IF NOT EXISTS "leads_source_idx" ON "leads" ("source");
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" ("created_at");
CREATE INDEX IF NOT EXISTS "leads_supprime_le_idx" ON "leads" ("supprime_le");

CREATE INDEX IF NOT EXISTS "factures_status_idx" ON "factures" ("status");
CREATE INDEX IF NOT EXISTS "factures_due_date_idx" ON "factures" ("due_date");
CREATE INDEX IF NOT EXISTS "factures_paid_at_idx" ON "factures" ("paid_at");

CREATE INDEX IF NOT EXISTS "interventions_scheduled_at_idx" ON "interventions" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "interventions_status_idx" ON "interventions" ("status");

CREATE INDEX IF NOT EXISTS "logs_alex_action_idx" ON "logs_alex" ("action");
CREATE INDEX IF NOT EXISTS "logs_alex_created_at_idx" ON "logs_alex" ("created_at");
CREATE INDEX IF NOT EXISTS "logs_alex_session_id_idx" ON "logs_alex" ("session_id");

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "commercial_id" text REFERENCES "techniciens"("id");

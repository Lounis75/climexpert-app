ALTER TABLE "interventions" ADD COLUMN "devis_envoi_id" text;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_devis_envoi_id_devis_envois_id_fk" FOREIGN KEY ("devis_envoi_id") REFERENCES "public"."devis_envois"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- RATTRAPAGE des interventions déjà créées : le flux PDF ne posait aucun lien vers le devis.
-- On relie chaque intervention au devis ACCEPTÉ du prospect d'origine de son client, quand il n'y
-- en a qu'un seul (sans ambiguïté). Les cas multiples sont laissés vides : mieux vaut aucun lien
-- qu'un lien vers le mauvais devis.
UPDATE "interventions" i
SET "devis_envoi_id" = sub."envoi_id"
FROM (
  SELECT c."id" AS client_id, MIN(e."id") AS envoi_id
  FROM "clients" c
  JOIN "leads" l ON l."client_id" = c."id"
  JOIN "devis_envois" e ON e."lead_id" = l."id" AND e."decision" = 'accepte'
  GROUP BY c."id"
  HAVING COUNT(e."id") = 1
) sub
WHERE i."client_id" = sub."client_id"
  AND i."devis_envoi_id" IS NULL
  AND i."devis_id" IS NULL;

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const result = await sql`
  ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS commercial_id TEXT REFERENCES techniciens(id)
`;
console.log("Migration done:", result);

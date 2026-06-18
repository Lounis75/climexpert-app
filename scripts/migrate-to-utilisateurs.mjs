// One-shot idempotent : seed la table `utilisateurs` depuis admins + techniciens.
// Fusionne les rôles si un même email existe dans les deux (admin + technicien).
import { config } from "dotenv";
config({ path: ".env.local" });
import { randomBytes } from "crypto";
import pg from "pg";
const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const admins = (await c.query(`select id, email, nom from admins where supprime_le is null`)).rows;
const techs  = (await c.query(`select id, name, prenom, phone, email, color, role from techniciens where supprime_le is null`)).rows;

// email -> { nom, prenom, phone, color, roles:Set, technicienId }
const map = new Map();
const up = (email, rec) => {
  const k = email.toLowerCase().trim();
  const cur = map.get(k) ?? { nom: "", prenom: null, phone: null, color: null, roles: new Set(), technicienId: null };
  map.set(k, { ...cur, ...rec, roles: new Set([...cur.roles, ...rec.roles]) });
};

for (const a of admins) up(a.email, { nom: a.nom, roles: ["administrateur"] });
for (const t of techs) {
  const role = t.role === "technico_commercial" ? "commercial" : "technicien"; // technicien/responsable -> technicien
  up(t.email, { nom: t.name, prenom: t.prenom, phone: t.phone, color: t.color, roles: [role], technicienId: t.id });
}

let created = 0, skipped = 0;
for (const [email, rec] of map) {
  const exists = (await c.query(`select 1 from utilisateurs where email=$1`, [email])).rows.length > 0;
  if (exists) { skipped++; continue; }
  const id = "usr_" + randomBytes(12).toString("hex");
  await c.query(
    `insert into utilisateurs (id, email, nom, prenom, phone, color, roles, password_hash, doit_definir_mdp, actif, technicien_id)
     values ($1,$2,$3,$4,$5,$6,$7,null,true,true,$8)`,
    [id, email, rec.nom || email, rec.prenom, rec.phone, rec.color ?? "#0ea5e9", [...rec.roles], rec.technicienId]
  );
  created++;
  console.log(`  + ${email} → [${[...rec.roles].join(", ")}]${rec.technicienId ? " (lié technicien)" : ""}`);
}
console.log(`\n✓ ${created} utilisateur(s) créé(s), ${skipped} déjà présent(s). Total en base : ${(await c.query(`select count(*)::int n from utilisateurs`)).rows[0].n}`);
await c.end();

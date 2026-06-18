import { config } from "dotenv";
config({ path: ".env.local" });
import { scryptSync, randomBytes } from "crypto";
import pg from "pg";
const { Client } = pg;
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const EMAIL = "contact@climexpert.fr";
const PW = "TestClim-" + randomBytes(3).toString("hex"); // temporaire
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(PW, salt, 64).toString("hex");
await c.query(`update utilisateurs set password_hash=$1, doit_definir_mdp=false where email=$2`, [`${salt}:${hash}`, EMAIL]);
console.log(`SET_OK ${EMAIL} ${PW}`);
await c.end();

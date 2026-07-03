import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { logError } from "@/lib/observability";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "climexpert-uploads";

// Récupère un objet R2 en octets (pour le servir via une route authentifiée par jeton, sans
// exposer l'URL publique brute du fichier au client). `key` = chemin dans le bucket.
export async function r2GetBytes(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const body = await res.Body!.transformToByteArray();
    return { body, contentType: res.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/** Extrait la clé R2 depuis une URL publique stockée (`${R2_PUBLIC_URL}/<key>`). */
export function r2KeyFromUrl(url: string): string | null {
  const prefix = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (prefix && url.startsWith(prefix + "/")) return url.slice(prefix.length + 1);
  // Repli : dernier segment de chemin (ex. "devis/xxx.pdf").
  try { return new URL(url).pathname.replace(/^\//, "") || null; } catch { return null; }
}

export async function r2GetJSON(key: string): Promise<unknown | null> {
  // Environnement sans R2 configuré (build local, CI) : fallback assumé, pas d'alerte.
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) return null;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const text = await res.Body!.transformToString();
    return JSON.parse(text);
  } catch (e) {
    // Clé absente = fallback légitime (config jamais enregistrée) : silencieux. TOUTE autre
    // erreur (credentials, réseau, panne R2) est alertée : sinon un incident R2 fait chiffrer
    // les devis sur le catalogue PAR DÉFAUT du code (prix périmés) sans que personne ne le voie.
    const name = (e as { name?: string; Code?: string })?.name ?? (e as { Code?: string })?.Code;
    if (name !== "NoSuchKey" && name !== "NotFound") {
      logError("r2.getJSON", e, { key });
    }
    return null;
  }
}

export async function r2PutJSON(key: string, data: unknown): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    })
  );
}

export async function r2PutFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const publicUrl = process.env.R2_PUBLIC_URL ?? "";
  return `${publicUrl}/${key}`;
}

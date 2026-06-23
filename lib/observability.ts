// Journalisation structurée des erreurs (SERVEUR uniquement, n'importez pas ce
// module depuis un composant client : il charge @sentry/node).
// - Toujours : log JSON visible dans les logs Vercel (cherchable).
// - Si SENTRY_DSN défini : l'erreur est aussi envoyée à Sentry (alerting réel).
import * as Sentry from "@sentry/node";

type Meta = Record<string, unknown>;

export function logError(context: string, error: unknown, meta?: Meta): void {
  const err = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };
  console.error(JSON.stringify({ level: "error", context, ...err, ...(meta ?? {}) }));
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { context },
      extra: meta,
    });
  }
}

export function logWarn(context: string, message: string, meta?: Meta): void {
  console.warn(JSON.stringify({ level: "warn", context, message, ...(meta ?? {}) }));
}

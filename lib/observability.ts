// Journalisation structurée des erreurs.
// Aujourd'hui : log JSON visible dans les logs Vercel (cherchable).
// Demain : si SENTRY_DSN (ou autre) est défini, on peut forwarder ici sans rien
// changer aux appelants. Objectif : ne plus avaler les erreurs en silence.

type Meta = Record<string, unknown>;

export function logError(context: string, error: unknown, meta?: Meta): void {
  const err = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };
  // Log structuré (une ligne JSON) — exploitable dans Vercel / un futur Sentry.
  console.error(JSON.stringify({ level: "error", context, ...err, ...(meta ?? {}) }));
  // Hook futur : if (process.env.SENTRY_DSN) Sentry.captureException(error, { tags: { context }, extra: meta });
}

export function logWarn(context: string, message: string, meta?: Meta): void {
  console.warn(JSON.stringify({ level: "warn", context, message, ...(meta ?? {}) }));
}

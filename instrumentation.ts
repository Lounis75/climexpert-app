// Observabilité serveur. Sentry est activé UNIQUEMENT si SENTRY_DSN est défini
// (sinon : zéro effet, juste les logs structurés). Import dynamique + garde
// NEXT_RUNTIME=nodejs → le runtime edge (proxy.ts) ne charge jamais @sentry/node.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: 0, // pas de tracing perf pour l'instant → coût mini
      // On ne capture pas les données du corps des requêtes (RGPD / clients).
      sendDefaultPii: false,
    });
  }
}

// Next.js appelle ceci pour toute erreur serveur non gérée (rendu page / route handler).
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; renderSource?: string },
): Promise<void> {
  const err = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };
  console.error(JSON.stringify({
    level: "error",
    context: "onRequestError",
    path: request?.path,
    method: request?.method,
    route: context?.routePath,
    renderSource: context?.renderSource,
    ...err,
  }));

  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(error, {
      tags: { route: context?.routePath, method: request?.method },
      extra: { path: request?.path, renderSource: context?.renderSource },
    });
  }
}

// Capture centralisée des erreurs serveur non gérées (rendu de page, route handlers).
// Next.js appelle onRequestError pour toute erreur survenue côté serveur.
// Log structuré -> visible/cherchable dans Vercel. Prêt à brancher Sentry.

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
  // Hook futur : if (process.env.SENTRY_DSN) Sentry.captureRequestError(error, request, context);
}

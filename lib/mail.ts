import { logError } from "@/lib/observability";

let warned = false;

/**
 * Destinataire réel d'un e-mail. EMAIL_TEST_OVERRIDE (qui redirige TOUS les e-mails vers une
 * seule adresse) ne s'applique QU'EN dehors de la production : si la variable « traîne » un jour
 * en prod, on l'IGNORE (et on journalise une alerte une fois), pour éviter d'envoyer tous les
 * devis/factures à la mauvaise adresse sans s'en rendre compte.
 */
export function mailRecipient(real: string): string {
  const override = process.env.EMAIL_TEST_OVERRIDE;
  if (!override) return real;
  if (process.env.NODE_ENV === "production") {
    if (!warned) {
      warned = true;
      logError("mail.override_ignored_in_prod", new Error("EMAIL_TEST_OVERRIDE est défini EN PRODUCTION : ignoré"), { override });
    }
    return real;
  }
  return override;
}

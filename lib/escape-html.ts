// Échappe les caractères HTML dangereux avant d'injecter une valeur dynamique (nom client, motif,
// message, adresse...) dans le corps `html:` d'un e-mail. Empêche l'injection HTML / le rendu cassé.
const MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return "";
  return String(input).replace(/[&<>"']/g, (c) => MAP[c]);
}

// ClimExpert, « Ordre de mission » : fiche PDF d'une intervention à transmettre à
// un sous-traitant (qui n'a pas accès au portail). Sortie A4 via pdfkit.
import PDFDocument from "pdfkit";

const NAVY = "#0C1A2E";
const BLUE = "#00A5F5";
const GREY = "#555555";
const MISS = "#9AA3B2";

export type OrdreMissionData = {
  reference: string;
  dateEdition: string;
  sousTraitant?: { nom: string; entreprise?: string | null; specialite?: string | null } | null;
  type: string;
  dateCreneau: string;
  duree?: string | null;
  lieu: string;
  siteNom?: string | null;
  client: { nom: string; phone?: string | null; email?: string | null };
  notes?: string | null;
  besoins?: string | null;
};

export function generateOrdreMissionPDF(d: OrdreMissionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const M = 50;
    const W = doc.page.width - M * 2;

    // ── En-tête ──────────────────────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(20).fillColor(NAVY).text("ORDRE DE MISSION", M, M);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(BLUE).text("CLIM EXPERT", M, M + 26);
    doc.font("Helvetica").fontSize(9).fillColor(GREY)
      .text(`Réf. ${d.reference}  ·  édité le ${d.dateEdition}`, M, M + 42);
    doc.moveTo(M, M + 62).lineTo(M + W, M + 62).lineWidth(1).strokeColor(BLUE).stroke();
    doc.y = M + 74;

    // ── Sous-traitant ────────────────────────────────────────────────────────
    section("Sous-traitant assigné");
    if (d.sousTraitant) {
      const st = d.sousTraitant;
      kv("Intervenant", st.nom);
      if (st.entreprise) kv("Entreprise", st.entreprise);
      if (st.specialite) kv("Spécialité", st.specialite);
    } else {
      doc.font("Helvetica").fontSize(10).fillColor(MISS).text("- non assigné -", M, doc.y);
      doc.moveDown(0.5);
    }

    // ── Intervention ─────────────────────────────────────────────────────────
    section("Intervention");
    kv("Type", d.type);
    kv("Créneau", d.dateCreneau);
    if (d.duree) kv("Durée estimée", d.duree);

    // ── Lieu ─────────────────────────────────────────────────────────────────
    section("Lieu");
    if (d.siteNom) kv("Site / client final", d.siteNom);
    kv("Adresse", d.lieu || "-");

    // ── Contact client ───────────────────────────────────────────────────────
    section("Contact sur place");
    kv("Client", d.client.nom);
    if (d.client.phone) kv("Téléphone", d.client.phone);
    if (d.client.email) kv("Email", d.client.email);

    // ── Besoins / accès ──────────────────────────────────────────────────────
    if (d.besoins?.trim()) {
      section("Qualification & informations");
      block(d.besoins.trim());
    }
    if (d.notes?.trim()) {
      section("Notes internes / accès");
      block(d.notes.trim());
    }

    // ── Pied de page ─────────────────────────────────────────────────────────
    doc.font("Helvetica").fontSize(8).fillColor(MISS).text(
      "ClimExpert, 200 rue de la Croix Nivert, 75015 Paris · contact@climexpert.fr · Document de mission, à ne pas remettre au client.",
      M, doc.page.height - M - 14, { width: W, align: "center" },
    );

    doc.end();

    // ── Helpers ──────────────────────────────────────────────────────────────
    function section(title: string) {
      if (doc.y > doc.page.height - 140) doc.addPage();
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(title.toUpperCase(), M, doc.y);
      doc.moveTo(M, doc.y + 2).lineTo(M + W, doc.y + 2).lineWidth(0.5).strokeColor("#D8E0EA").stroke();
      doc.moveDown(0.5);
    }
    function kv(k: string, v: string) {
      const y = doc.y;
      doc.font("Helvetica").fontSize(10).fillColor(GREY).text(k, M, y, { width: 130 });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY).text(v, M + 140, y, { width: W - 140 });
      doc.moveDown(0.35);
    }
    function block(text: string) {
      doc.font("Helvetica").fontSize(10).fillColor(GREY).text(text, M, doc.y, { width: W, lineGap: 2 });
      doc.moveDown(0.4);
    }
  });
}

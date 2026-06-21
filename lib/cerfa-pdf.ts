// ClimExpert — Générateur du CERFA 15497*04 « Fiche d'intervention » (PDF A4).
// Reproduction fidèle de la fiche d'intervention pour opérations sur fluides
// frigorigènes (art. R.543-82 / R.543-79 du code de l'environnement).
// Pré-rempli depuis l'intervention + saisie technicien + signature (image PNG).

import PDFDocument from "pdfkit";

type Doc = PDFKit.PDFDocument;

/* ─── Opérateur (ClimExpert) ──────────────────────────────────────────────── */
const OPERATEUR_DEFAUT = {
  nom: "CLIM EXPERT",
  adresse: "200 rue de la Croix Nivert, 75015 Paris",
  siret: "SIREN : 992 975 862",
};

export type CerfaData = {
  ficheNumero?: string;
  attestationCapacite?: string;
  operateur?: { nom?: string; adresse?: string; siret?: string };
  detenteur?: { nom?: string; adresse?: string; siret?: string };
  equipement?: { identification?: string; fluide?: string; chargeKg?: string; tonnageCO2?: string };
  // [4] cases nature
  nature?: {
    assemblage?: boolean; miseEnService?: boolean; modification?: boolean; maintenance?: boolean;
    controleEtanchPeriodique?: boolean; controleEtanchNonPeriodique?: boolean; demantelement?: boolean;
    autre?: boolean; autreText?: string;
  };
  // [5] contrôle d'étanchéité
  detecteurManuel?: string;
  controleLe?: string;            // "JJ/MM/AAAA"
  systemePermanent?: "oui" | "non" | null; // [6]
  // [10] fuites
  fuitesConstatees?: "oui" | "non" | null;
  fuites?: Array<{ localisation?: string; reparation?: "realisee" | "a_faire" | null }>;
  // [11] manipulation
  manip?: {
    chargeeTotale?: string; vierge?: string; recycle?: string; regenere?: string; denominationSiChangement?: string;
    recupereeTotale?: string; traitement?: string; reutilisation?: string; bsff?: string; contenants?: string;
  };
  // [12] ADR
  adr?: { un1078?: boolean; un1078Autres?: string; un3161?: boolean; un3161Autres?: string };
  // [13] installation destination
  destination?: string;
  observations?: string;          // [14]
  signataireOperateur?: { nom?: string; qualite?: string; date?: string; signatureDataUrl?: string };
};

/* ─── Charte ──────────────────────────────────────────────────────────────── */
const NAVY = "#0C1A2E";
const BLUE = "#00A5F5";
const HEADER_BG = "#DCEBF5";   // bleu pâle des bandeaux de section
const BORDER = "#222222";
const GREY = "#555555";

const PW = 595.28, PH = 841.89;
const MX = 26;
const X0 = MX, X1 = PW - MX;        // 26 .. 569
const CW = X1 - X0;

function v(s?: string | null): string { return (s ?? "").toString().trim(); }

/* ─── Helpers de dessin ───────────────────────────────────────────────────── */
function box(doc: Doc, x: number, y: number, w: number, h: number, fill?: string) {
  if (fill) doc.rect(x, y, w, h).fill(fill);
  doc.rect(x, y, w, h).lineWidth(0.6).strokeColor(BORDER).stroke();
}
function hline(doc: Doc, x: number, y: number, w: number) {
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.6).strokeColor(BORDER).stroke();
}
function vline(doc: Doc, x: number, y: number, h: number) {
  doc.moveTo(x, y).lineTo(x, y + h).lineWidth(0.6).strokeColor(BORDER).stroke();
}
// Texte dans une cellule (avec padding), tronqué à la largeur.
function txt(doc: Doc, s: string, x: number, y: number, w: number, opts: { size?: number; bold?: boolean; color?: string; align?: "left" | "center" | "right" } = {}) {
  doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.size ?? 7).fillColor(opts.color ?? "black");
  doc.text(s, x, y, { width: w, align: opts.align ?? "left", lineGap: 0.5, ellipsis: true });
}
// Bandeau de section centré (fond bleu pâle).
function sectionBar(doc: Doc, y: number, label: string, h = 12) {
  box(doc, X0, y, CW, h, HEADER_BG);
  txt(doc, label, X0, y + 3, CW, { size: 7.5, bold: true, align: "center", color: NAVY });
  return y + h;
}
// Case à cocher + libellé. Renvoie rien (positionnement manuel).
function check(doc: Doc, x: number, y: number, checked: boolean, label: string, w: number, size = 7) {
  const s = 7.5;
  doc.rect(x, y, s, s).lineWidth(0.6).strokeColor(BORDER).stroke();
  if (checked) {
    doc.save();
    doc.moveTo(x + 1.2, y + 1.2).lineTo(x + s - 1.2, y + s - 1.2)
      .moveTo(x + s - 1.2, y + 1.2).lineTo(x + 1.2, y + s - 1.2)
      .lineWidth(1).strokeColor("#0A66C2").stroke();
    doc.restore();
  }
  txt(doc, label, x + s + 3, y - 0.5, w - s - 3, { size });
}
// Champ « étiquette : valeur » sur une ligne.
function fieldInline(doc: Doc, x: number, y: number, w: number, label: string, value: string, labelW: number) {
  txt(doc, label, x, y, labelW, { size: 7, bold: true });
  txt(doc, value, x + labelW, y, w - labelW, { size: 8, color: NAVY });
}

/* ─── Construction de la fiche ────────────────────────────────────────────── */
function build(doc: Doc, d: CerfaData) {
  const op = { ...OPERATEUR_DEFAUT, ...(d.operateur ?? {}) };
  const det = d.detenteur ?? {};
  const eq = d.equipement ?? {};
  const nat = d.nature ?? {};
  const manip = d.manip ?? {};
  const adr = d.adr ?? {};
  const fuites = d.fuites ?? [];
  let y = 24;

  /* En-tête */
  txt(doc, "FICHE D'INTERVENTION", X0, y, CW, { size: 14, bold: true, align: "center", color: NAVY });
  txt(doc, "ClimExpert", X0, y + 2, 90, { size: 12, bold: true, color: BLUE });
  txt(doc, "cerfa", X1 - 80, y, 80, { size: 11, bold: true, align: "right", color: GREY });
  y += 16;
  txt(doc, "pour les opérations nécessitant une manipulation de fluides frigorigènes fluorés effectuées sur un équipement thermodynamique, prévue à l'article R. 543-82 du code de l'environnement et pour les contrôles d'étanchéité prévus au R. 543-79 du même code", X0 + 60, y, CW - 120, { size: 6, align: "center", color: GREY });
  txt(doc, "N° 15497*04", X1 - 80, y, 80, { size: 7, align: "right", color: GREY });
  y += 22;

  /* [1][2] Fiche N° | Opérateur | Détenteur */
  const rowH1 = 78;
  const cFiche = 52, cOp = (CW - cFiche) / 2;
  box(doc, X0, y, cFiche, rowH1);
  box(doc, X0 + cFiche, y, cOp, rowH1);
  box(doc, X0 + cFiche + cOp, y, cOp, rowH1);
  txt(doc, "Fiche N° :", X0 + 3, y + 3, cFiche - 6, { size: 6.5, bold: true });
  txt(doc, v(d.ficheNumero), X0 + 3, y + 14, cFiche - 6, { size: 8, color: NAVY });
  txt(doc, "[1] OPÉRATEUR (Nom, adresse et SIRET) :", X0 + cFiche + 3, y + 3, cOp - 6, { size: 6.5, bold: true });
  txt(doc, `${v(op.nom)}\n${v(op.adresse)}\n${v(op.siret)}`, X0 + cFiche + 3, y + 14, cOp - 6, { size: 7.5, color: NAVY });
  txt(doc, "[2] DÉTENTEUR (Nom, adresse et SIRET) :", X0 + cFiche + cOp + 3, y + 3, cOp - 6, { size: 6.5, bold: true });
  txt(doc, `${v(det.nom)}\n${v(det.adresse)}\n${v(det.siret)}`, X0 + cFiche + cOp + 3, y + 14, cOp - 6, { size: 7.5, color: NAVY });
  // N° attestation de capacité (sous opérateur)
  const attY = y + rowH1 - 18;
  hline(doc, X0 + cFiche, attY, cOp);
  txt(doc, "N° d'attestation de capacité :", X0 + cFiche + 3, attY + 3, 110, { size: 6.5, bold: true });
  txt(doc, v(d.attestationCapacite), X0 + cFiche + 115, attY + 3, cOp - 118, { size: 8, color: NAVY });
  y += rowH1;

  /* [3] Équipement concerné */
  const rowH3 = 42, c3a = 130;
  box(doc, X0, y, c3a, rowH3, HEADER_BG);
  txt(doc, "[3] Équipement concerné :", X0 + 3, y + rowH3 / 2 - 8, c3a - 6, { size: 7, bold: true, color: NAVY });
  const c3mid = X0 + c3a, c3midW = CW - c3a - 150;
  box(doc, c3mid, y, c3midW, rowH3);
  txt(doc, "Identification :", c3mid + 3, y + 3, 70, { size: 6.5, bold: true });
  txt(doc, v(eq.identification), c3mid + 3, y + 13, c3midW - 6, { size: 7.5, color: NAVY });
  // bloc droite fluide/charge/tonnage (3 lignes)
  const c3r = c3mid + c3midW, c3rW = 150, lh = rowH3 / 3;
  box(doc, c3r, y, c3rW, lh); box(doc, c3r, y + lh, c3rW, lh); box(doc, c3r, y + 2 * lh, c3rW, lh);
  fieldInline(doc, c3r + 3, y + 2, c3rW - 6, "Dénomination du fluide : R-", v(eq.fluide), 96);
  fieldInline(doc, c3r + 3, y + lh + 2, c3rW - 6, "Charge totale :", v(eq.chargeKg) ? v(eq.chargeKg) + " kg" : "", 62);
  fieldInline(doc, c3r + 3, y + 2 * lh + 2, c3rW - 6, "Tonnage éq. CO2 :", v(eq.tonnageCO2) ? v(eq.tonnageCO2) + " t" : "", 70);
  y += rowH3;

  /* [4] Nature de l'intervention */
  const rowH4 = 46, c4a = 130;
  box(doc, X0, y, c4a, rowH4, HEADER_BG);
  txt(doc, "[4] Nature de l'intervention :\ncocher une ou plusieurs cases", X0 + 3, y + rowH4 / 2 - 10, c4a - 6, { size: 7, bold: true, color: NAVY });
  box(doc, X0 + c4a, y, CW - c4a, rowH4);
  const c4col = X0 + c4a + 6, c4col2 = X0 + c4a + (CW - c4a) / 2;
  const c4w = (CW - c4a) / 2 - 10;
  check(doc, c4col, y + 4, !!nat.assemblage, "Assemblage de l'équipement", c4w);
  check(doc, c4col, y + 14, !!nat.miseEnService, "Mise en service de l'équipement", c4w);
  check(doc, c4col, y + 24, !!nat.modification, "Modification de l'équipement", c4w);
  check(doc, c4col, y + 34, !!nat.maintenance, "Maintenance de l'équipement", c4w);
  check(doc, c4col2, y + 4, !!nat.controleEtanchPeriodique, "Contrôle d'étanchéité périodique", c4w);
  check(doc, c4col2, y + 14, !!nat.controleEtanchNonPeriodique, "Contrôle d'étanchéité non périodique", c4w);
  check(doc, c4col2, y + 24, !!nat.demantelement, "Démantèlement", c4w);
  check(doc, c4col2, y + 34, !!nat.autre, `Autre (préciser) : ${v(nat.autreText)}`, c4w);
  y += rowH4;

  /* Bandeau Contrôle d'étanchéité / Identification / Contrôlé le */
  const c5a = 200, c5b = (CW - c5a) / 2;
  box(doc, X0, y, c5a, 12, HEADER_BG); txt(doc, "Contrôle d'étanchéité", X0, y + 3, c5a, { size: 7, bold: true, align: "center", color: NAVY });
  box(doc, X0 + c5a, y, c5b, 12, HEADER_BG); txt(doc, "Identification", X0 + c5a, y + 3, c5b, { size: 7, bold: true, align: "center", color: NAVY });
  box(doc, X0 + c5a + c5b, y, c5b, 12, HEADER_BG); txt(doc, "Contrôlé le", X0 + c5a + c5b, y + 3, c5b, { size: 7, bold: true, align: "center", color: NAVY });
  y += 12;
  // [5]
  box(doc, X0, y, c5a, 16); txt(doc, "[5] Détecteur manuel de fuite :", X0 + 3, y + 5, c5a - 6, { size: 6.5, bold: true });
  box(doc, X0 + c5a, y, c5b, 16); txt(doc, v(d.detecteurManuel), X0 + c5a + 3, y + 4, c5b - 6, { size: 8, align: "center", color: NAVY });
  box(doc, X0 + c5a + c5b, y, c5b, 16); txt(doc, v(d.controleLe), X0 + c5a + c5b, y + 4, c5b, { size: 9, align: "center", color: NAVY });
  y += 16;
  // [6]
  box(doc, X0, y, CW, 14);
  txt(doc, "[6] Présence d'un système permanent de détection de fuites :", X0 + 3, y + 4, 280, { size: 6.5, bold: true });
  check(doc, X0 + 330, y + 3, d.systemePermanent === "oui", "OUI", 40);
  check(doc, X0 + 410, y + 3, d.systemePermanent === "non", "NON", 40);
  y += 14;

  /* Fréquence minimale du contrôle périodique (bandeau) */
  y = sectionBar(doc, y, "Fréquence minimale du contrôle périodique");
  /* [7] Quantité de fluide — 3 lignes (HCFC / HFC-PFC / HFO), 3 colonnes de plages */
  const c7a = 220, c7b = 60, c7c = (CW - c7a - c7b) / 3;
  const rows7 = [
    { lbl: "HCFC", a: "2 kg ≤ Q < 30 kg", b: "30 kg ≤ Q < 300 kg", c: "Q ≥ 300 kg" },
    { lbl: "HFC / PFC", a: "5 t ≤ teqCO2 < 50 t", b: "50 t ≤ teqCO2 < 500 t", c: "teqCO2 ≥ 500 t" },
    { lbl: "HFO", a: "1 kg ≤ Q < 10 kg", b: "10 kg ≤ Q < 100 kg", c: "Q ≥ 100 kg" },
  ];
  box(doc, X0, y, c7a, 30);
  txt(doc, "[7] Quantité de fluide frigorigène dans l'équipement", X0 + 3, y + 10, c7a - 6, { size: 6.5, bold: true });
  rows7.forEach((r, i) => {
    const ry = y + i * 10;
    box(doc, X0 + c7a, ry, c7b, 10); txt(doc, r.lbl, X0 + c7a + 2, ry + 2.5, c7b - 4, { size: 6 });
    [r.a, r.b, r.c].forEach((rng, j) => {
      const cx = X0 + c7a + c7b + j * c7c;
      box(doc, cx, ry, c7c, 10);
      check(doc, cx + 2, ry + 1.5, false, rng, c7c - 4, 5.5);
    });
  });
  y += 30;
  // [8] et [9]
  const c89a = 280;
  [["[8] Équip. HCFC, HFC et HFO sans système permanent de détection des fuites", "12 mois", "6 mois", "3 mois"],
   ["[9] Équipements HFC et HFO avec système permanent de détection des fuites", "24 mois", "12 mois", "6 mois"]].forEach((r) => {
    box(doc, X0, y, c89a, 11); txt(doc, r[0], X0 + 3, y + 2.5, c89a - 6, { size: 6 });
    [r[1], r[2], r[3]].forEach((m, j) => {
      const cx = X0 + c89a + j * ((CW - c89a) / 3);
      box(doc, cx, y, (CW - c89a) / 3, 11);
      check(doc, cx + 2, y + 2, false, m, (CW - c89a) / 3 - 4, 6);
    });
    y += 11;
  });

  /* [10] Fuites constatées */
  const c10a = 90, c10c = 110, c10b = CW - c10a - c10c;
  box(doc, X0, y, c10a, 12, HEADER_BG); txt(doc, "[10] Fuites constatées", X0 + 2, y + 3, c10a - 4, { size: 6, bold: true, color: NAVY });
  box(doc, X0 + c10a, y, c10b, 12, HEADER_BG); txt(doc, "Localisation de la fuite", X0 + c10a, y + 3, c10b, { size: 6.5, bold: true, align: "center", color: NAVY });
  box(doc, X0 + c10a + c10b, y, c10c, 12, HEADER_BG); txt(doc, "Réparation de la fuite", X0 + c10a + c10b, y + 3, c10c, { size: 6.5, bold: true, align: "center", color: NAVY });
  y += 12;
  // oui/non dans la colonne gauche (une fois), puis 3 lignes
  check(doc, X0 + 3, y + 2, d.fuitesConstatees === "oui", "OUI", 40, 6);
  check(doc, X0 + 3, y + 13, d.fuitesConstatees === "non", "NON", 40, 6);
  for (let i = 0; i < 3; i++) {
    const ry = y + i * 12;
    const f = fuites[i] ?? {};
    box(doc, X0 + 44, ry, c10a - 44, 12); txt(doc, String(i + 1), X0 + 44, ry + 3, c10a - 44, { size: 7, align: "center" });
    box(doc, X0 + c10a, ry, c10b, 12); txt(doc, v(f.localisation), X0 + c10a + 3, ry + 3, c10b - 6, { size: 7, color: NAVY });
    const rx = X0 + c10a + c10b;
    box(doc, rx, ry, c10c, 12);
    check(doc, rx + 3, ry + 1, f.reparation === "realisee", "Réalisée", 55, 5.5);
    check(doc, rx + 3, ry + 6.5, f.reparation === "a_faire", "À faire", 55, 5.5);
  }
  box(doc, X0, y, 44, 36); // cadre oui/non
  y += 36;

  /* [11] Manipulation du fluide frigorigène */
  y = sectionBar(doc, y, "[11] Manipulation du fluide frigorigène");
  const half = CW / 2;
  const m11Left = [
    ["Quantité chargée totale (A+B+C) :", v(manip.chargeeTotale), "kg"],
    ["A - Dont fluide vierge :", v(manip.vierge), "kg"],
    ["Dénomination du fluide chargé si changement :", v(manip.denominationSiChangement), ""],
    ["B - Dont fluide recyclé (récupéré et réintroduit) :", v(manip.recycle), "kg"],
    ["C - Dont fluide régénéré :", v(manip.regenere), "kg"],
  ];
  const m11Right = [
    ["Quantité de fluide récupérée totale (D+E) :", v(manip.recupereeTotale), "kg"],
    ["D - Dont fluide destiné au traitement :", v(manip.traitement), "kg"],
    ["Si connu, numéro du BSFF (Trackdéchets) :", v(manip.bsff), ""],
    ["E - Dont fluide conservé pour réutilisation :", v(manip.reutilisation), "kg"],
    ["Identification du ou des contenants :", v(manip.contenants), ""],
  ];
  m11Left.forEach((r, i) => {
    const ry = y + i * 11;
    box(doc, X0, ry, half, 11);
    txt(doc, r[0], X0 + 3, ry + 2.5, half - 60, { size: 6 });
    txt(doc, r[1] ? `${r[1]} ${r[2]}` : "", X0 + half - 60, ry + 2, 57, { size: 7, align: "right", color: NAVY });
  });
  m11Right.forEach((r, i) => {
    const ry = y + i * 11;
    box(doc, X0 + half, ry, half, 11);
    txt(doc, r[0], X0 + half + 3, ry + 2.5, half - 60, { size: 6 });
    txt(doc, r[1] ? `${r[1]} ${r[2]}` : "", X0 + half + half - 60, ry + 2, 57, { size: 7, align: "right", color: NAVY });
  });
  y += 55;

  /* [12] Dénomination ADR/RID */
  y = sectionBar(doc, y, "[12] Dénomination ADR/RID");
  box(doc, X0, y, CW, 24);
  txt(doc, "Rubrique Déchets : 14 06 01* – CFC, HCFC, HFC, HFO – Fluides non-inflammables", X0 + 3, y + 2, CW - 6, { size: 6, bold: true });
  check(doc, X0 + 3, y + 10, !!adr.un1078, "UN 1078, Déchet Gaz frigorifique NSA, 2.2 (C/E)", 270, 6);
  txt(doc, `Autres fluides non-inflammables : ${v(adr.un1078Autres)}`, X0 + 300, y + 9.5, CW - 305, { size: 6 });
  y += 24;
  box(doc, X0, y, CW, 22);
  txt(doc, "Rubrique Déchets : 16 05 04* – HFC, HFO – Fluides inflammables", X0 + 3, y + 2, CW - 6, { size: 6, bold: true });
  check(doc, X0 + 3, y + 10, !!adr.un3161, "UN 3161, Déchet Gaz liquéfié inflammable NSA, 2.1 (B/D)", 270, 6);
  txt(doc, `Autres fluides inflammables : ${v(adr.un3161Autres)}`, X0 + 300, y + 9.5, CW - 305, { size: 6 });
  y += 22;

  /* [13] Installation destination */
  box(doc, X0, y, CW, 24);
  txt(doc, "[13] Installation prévue de destination du fluide récupéré (Nom, SIRET, adresse) :", X0 + 3, y + 2, CW - 6, { size: 6.5, bold: true });
  txt(doc, v(d.destination), X0 + 3, y + 11, CW - 6, { size: 7.5, color: NAVY });
  y += 24;

  /* [14] Observations */
  box(doc, X0, y, CW, 44);
  txt(doc, "[14] Observations :", X0 + 3, y + 2, CW - 6, { size: 6.5, bold: true });
  txt(doc, v(d.observations), X0 + 3, y + 12, CW - 6, { size: 8, color: NAVY });
  y += 44;

  /* Certification + signatures */
  txt(doc, "Je soussigné certifie que l'opération ci-dessus a été effectuée.", X0, y + 3, CW, { size: 7, align: "center" });
  y += 14;
  const sLabel = 70, sCol = (CW - sLabel) / 2;
  // en-têtes
  box(doc, X0, y, sLabel, 12); box(doc, X0 + sLabel, y, sCol, 12, HEADER_BG); box(doc, X0 + sLabel + sCol, y, sCol, 12, HEADER_BG);
  txt(doc, "Opérateur", X0 + sLabel, y + 3, sCol, { size: 7, bold: true, align: "center", color: NAVY });
  txt(doc, "Détenteur", X0 + sLabel + sCol, y + 3, sCol, { size: 7, bold: true, align: "center", color: NAVY });
  y += 12;
  const sig = d.signataireOperateur ?? {};
  const sRows = [
    ["Nom du Signataire :", v(sig.nom), ""],
    ["Qualité du Signataire :", v(sig.qualite), ""],
    ["Date et signature :", v(sig.date), ""],
  ];
  sRows.forEach((r, i) => {
    const rh = i === 2 ? 40 : 14;
    box(doc, X0, y, sLabel, rh); txt(doc, r[0], X0 + 2, y + 3, sLabel - 4, { size: 6.5, bold: true });
    box(doc, X0 + sLabel, y, sCol, rh); txt(doc, r[1], X0 + sLabel + 3, y + 3, sCol - 6, { size: 8, color: NAVY });
    box(doc, X0 + sLabel + sCol, y, sCol, rh);
    // signature image dans la dernière ligne, colonne opérateur
    if (i === 2 && sig.signatureDataUrl) {
      try {
        const b64 = sig.signatureDataUrl.split(",")[1];
        if (b64) {
          const img = Buffer.from(b64, "base64");
          doc.image(img, X0 + sLabel + 40, y + 4, { fit: [sCol - 50, rh - 8] });
        }
      } catch { /* ignore image invalide */ }
    }
    y += rh;
  });

  /* Note de conservation */
  y += 4;
  txt(doc, "Le détenteur d'un équipement dont la charge en HCFC est supérieure à 3 kg ou dont la charge en HFC est supérieure à 5 t éq CO2 doit conserver l'original de ce document pendant au moins 5 ans (article R. 543-82 du Code de l'environnement).", X0, y, CW, { size: 6, align: "center", color: GREY });
}

export async function generateCerfaPDF(data: CerfaData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  build(doc, data);
  doc.end();
  return done;
}

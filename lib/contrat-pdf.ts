// ClimExpert, Générateur de contrat d'entretien et de maintenance (PDF A4).
// Porté depuis le générateur .docx de Kamel : même logique (particulier/pro, TVA 10/20,
// mono/multisplit, calcul HT/TTC). Sortie PDF via pdfkit (serverless-friendly).
// Règle : AUCUN champ en rouge. Les champs manquants ressortent en gris discret, et
// l'attestation fluides est omise proprement tant que le n° n'est pas fourni.

import PDFDocument from "pdfkit";

/* ─── Prestataire (ClimExpert), à ajuster en un seul endroit ───────────────── */
const PRESTATAIRE = {
  raisonSociale: "CLIM EXPERT",
  formeCapital: "société par actions simplifiée (SAS) au capital de 1 000 €",
  siege: "200 rue de la Croix Nivert, 75015 Paris",
  rcs: "RCS de Paris sous le numéro 992 975 862",
  siret: "SIRET 992 975 862 00010",
  ape: "code APE 4322B",
  tva: "n° de TVA intracommunautaire FR 77 992 975 862",
  representant: "Kamel AISSAOUI",
  qualite: "Président",
  email: "contact@climexpert.fr",
  attestationFluides: "", // ← à renseigner plus tard (rien affiché tant que vide)
  assureur: "ERGO France",
  police: "SV75018041T42457",
};

/* ─── Médiateur de la consommation (particuliers), SMP (adhésion ClimExpert). ── */
const MEDIATEUR = {
  name: "Société de la Médiation Professionnelle (SMP)",
  contact: "Rue Marc Sangnier, 33130 Bègles, www.mediation-consommation-smp.fr",
};

/* ─── Charte ────────────────────────────────────────────────────────────────── */
const NAVY = "#0C1A2E";
const BLUE = "#00A5F5";
const GREY = "#555555";
const MISS = "#8A94A6"; // gris discret pour un champ non renseigné (jamais de rouge)
const LIGHT = "#F2F7FA";

export type ContratData = {
  clientType?: "particulier" | "professionnel";
  contract?: { number?: string; date?: string; place?: string; startDate?: string; duration?: string; notice?: string; visitsPerYear?: number };
  client?: { title?: string; name?: string; address?: string; postalCodeCity?: string; phone?: string; email?: string; legalForm?: string; siret?: string; representative?: string; representativeRole?: string };
  siteAddress?: string;
  equipment?: { brand?: string; fluid?: string; indoorCount?: number; units?: Array<{ type?: string; model?: string; powerKw?: string; charge?: string; serial?: string; location?: string; fluid?: string }> };
  finance?: { ttc?: number; ht?: number; vatRate?: number; depannage?: { ttc?: number; ht?: number } };
  mediator?: { name?: string; contact?: string };
  prestataire?: Partial<typeof PRESTATAIRE>;
};

type Seg = { t: string; bold?: boolean; italic?: boolean; color?: string };
type Doc = PDFKit.PDFDocument;

const euro = (n: number) => Number(n).toFixed(2).replace(".", ",") + " €";
// Champ : valeur si présente, sinon placeholder gris discret (jamais rouge).
function seg(value: unknown, fallback: string): Seg {
  const v = value === undefined || value === null ? "" : String(value).trim();
  return v ? { t: v } : { t: fallback, color: MISS };
}

const M = { top: 56, bottom: 64, left: 56, right: 56 };
function contentWidth(doc: Doc) { return doc.page.width - M.left - M.right; }

function fontFor(s: Seg) {
  if (s.bold) return "Helvetica-Bold";
  if (s.italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function ensureSpace(doc: Doc, needed: number) {
  if (doc.y + needed > doc.page.height - M.bottom) doc.addPage();
}

function heading(doc: Doc, text: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text(text, M.left, doc.y, { width: contentWidth(doc) });
  const y = doc.y + 2;
  doc.moveTo(M.left, y).lineTo(doc.page.width - M.right, y).lineWidth(0.8).strokeColor(BLUE).stroke();
  doc.x = M.left;
  doc.moveDown(0.4);
}

function para(doc: Doc, segs: Seg[] | string, opts: { size?: number; align?: "left" | "center" | "justify"; gap?: number } = {}) {
  const arr: Seg[] = typeof segs === "string" ? [{ t: segs }] : segs;
  const size = opts.size ?? 10;
  doc.fontSize(size);
  ensureSpace(doc, 16);
  const align = opts.align ?? "left";
  const w = contentWidth(doc);
  arr.forEach((s, i) => {
    doc.font(fontFor(s)).fillColor(s.color || "black");
    // Le 1er run impose la marge gauche + la largeur pleine page (évite que le curseur
    // reste calé à droite après un tableau → colonne étroite).
    if (i === 0) doc.text(s.t, M.left, doc.y, { continued: i < arr.length - 1, align, width: w, lineGap: 1 });
    else doc.text(s.t, { continued: i < arr.length - 1, align, lineGap: 1 });
  });
  doc.x = M.left;
  doc.moveDown((opts.gap ?? 0.5));
}

function bullet(doc: Doc, text: string) {
  doc.fontSize(10).font("Helvetica").fillColor("black");
  ensureSpace(doc, 14);
  doc.text("•  " + text, M.left + 6, doc.y, { width: contentWidth(doc) - 6, lineGap: 1, align: "left" });
  doc.x = M.left;
  doc.moveDown(0.15);
}

function note(doc: Doc, text: string) {
  doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(GREY);
  ensureSpace(doc, 14);
  doc.text(text, M.left, doc.y, { width: contentWidth(doc), align: "left", lineGap: 1 });
  doc.x = M.left;
  doc.moveDown(0.5);
}

/* ─── Tableaux ──────────────────────────────────────────────────────────────── */
type Col = { w: number; align?: "left" | "center" };
function drawTable(doc: Doc, cols: Col[], rows: Seg[][][], header: Seg[][]) {
  const pad = 4;
  const drawRow = (cells: Seg[][], isHeader: boolean) => {
    // hauteur de la ligne = max hauteur des cellules
    let h = 0;
    cells.forEach((cell, ci) => {
      const text = cell.map((s) => s.t).join("");
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(isHeader ? 8.5 : 8.5);
      const hh = doc.heightOfString(text, { width: cols[ci].w - 2 * pad });
      if (hh > h) h = hh;
    });
    h = Math.max(h + 2 * pad, 16);
    ensureSpace(doc, h);
    let x = M.left;
    const y = doc.y;
    cells.forEach((cell, ci) => {
      const w = cols[ci].w;
      // fond
      if (isHeader) doc.rect(x, y, w, h).fill(NAVY);
      else if ((rows.indexOf(cells as Seg[][]) % 2) === 1) doc.rect(x, y, w, h).fill(LIGHT);
      // bordure
      doc.rect(x, y, w, h).lineWidth(0.5).strokeColor("#CCCCCC").stroke();
      // texte
      const text = cell;
      doc.fontSize(8.5);
      text.forEach((s, i) => {
        doc.font(isHeader ? "Helvetica-Bold" : fontFor(s))
          .fillColor(isHeader ? "#FFFFFF" : (s.color || "black"))
          .text(s.t, x + pad, y + pad, { width: w - 2 * pad, align: cols[ci].align ?? "left", continued: i < text.length - 1, lineGap: 0 });
      });
      x += w;
    });
    doc.y = y + h;
  };
  drawRow(header, true);
  rows.forEach((r) => drawRow(r, false));
  doc.x = M.left;
  doc.moveDown(0.6);
}

/* ─── Logique métier ────────────────────────────────────────────────────────── */
function systemLabel(data: ContratData): string {
  const eq = data.equipment || {};
  const indoor = Array.isArray(eq.units) && eq.units.length
    ? eq.units.filter((u) => /intérieure/i.test(u.type || "")).length
    : Number(eq.indoorCount || 1);
  return indoor <= 1 ? "mono-split" : "multisplit";
}
function computePrice(price: { ttc?: number; ht?: number }, vatRate: number) {
  const r = vatRate / 100;
  if (price.ttc != null) { const ttc = Number(price.ttc); return { ht: ttc / (1 + r), ttc }; }
  if (price.ht != null) { const ht = Number(price.ht); return { ht, ttc: ht * (1 + r) }; }
  return null;
}

function clientBlock(doc: Doc, data: ContratData) {
  const c = data.client || {};
  const isPro = data.clientType === "professionnel";
  const adr = addressLine(c.address, c.postalCodeCity);
  if (isPro) {
    para(doc, [
      seg(c.name, "[Raison sociale]"),
      { t: ", " }, ...(c.legalForm ? [{ t: c.legalForm }] : []),
      { t: " dont le siège est situé " }, seg(adr, "[adresse]"),
      { t: ", immatriculée sous le SIRET " }, seg(c.siret, "[SIRET]"),
      { t: ", représentée par " }, seg(c.representative, "[représentant]"),
      { t: " en sa qualité de " }, { t: c.representativeRole || "gérant" },
      { t: ". Téléphone " }, seg(c.phone, "[tél]"),
      { t: ", courriel " }, seg(c.email, "[email]"), { t: "." },
    ]);
  } else {
    para(doc, [
      { t: (c.title ? c.title + " " : ""), bold: true },
      { ...seg(c.name, "[Nom du client]"), bold: true },
      { t: ", demeurant " }, seg(adr, "[adresse]"),
      { t: ", téléphone " }, seg(c.phone, "[tél]"),
      { t: ", courriel " }, seg(c.email, "[email]"), { t: "." },
    ]);
  }
}

function equipmentTable(doc: Doc, data: ContratData) {
  const eq = data.equipment || {};
  const fluid = eq.fluid || "R410A";
  const brand = eq.brand;
  let units = (Array.isArray(eq.units) && eq.units.length) ? eq.units : null;
  if (!units) {
    const indoor = Number(eq.indoorCount || 1);
    units = [{ type: "Unité extérieure (groupe)", location: "Extérieur" }];
    for (let i = 1; i <= indoor; i++) {
      units.push({ type: indoor === 1 ? "Unité intérieure (mono-split)" : `Unité intérieure n° ${i} (split)` });
    }
  }
  const cols: Col[] = [{ w: 98 }, { w: 92 }, { w: 60, align: "center" }, { w: 78 }, { w: 70 }, { w: 87 }];
  const header: Seg[][] = [["Type d'équipement"], ["Marque et modèle"], ["Puissance (kW)"], ["Fluide et charge"], ["N° de série"], ["Emplacement"]].map((c) => [{ t: c[0] }]);
  const rows: Seg[][][] = units.map((u) => {
    const model = u.model || brand;
    const charge = u.charge ? `${u.fluid || fluid} / ${u.charge}` : `${u.fluid || fluid}`;
    return [
      [seg(u.type, "[type]")],
      [seg(model, "[à compléter]")],
      [seg(u.powerKw, "-")],
      [{ t: charge }],
      [seg(u.serial, "-")],
      [seg(u.location, "-")],
    ];
  });
  drawTable(doc, cols, rows, header);
}

function financeTable(doc: Doc, data: ContratData, vatRate: number) {
  const label = systemLabel(data);
  const f = data.finance || {};
  const main = computePrice(f, vatRate);
  const cols: Col[] = [{ w: 245 }, { w: 80, align: "center" }, { w: 80, align: "center" }, { w: 78, align: "center" }];
  const header: Seg[][] = [[{ t: "Désignation" }], [{ t: "Montant HT" }], [{ t: "Taux TVA" }], [{ t: "Montant TTC" }]];
  const rows: Seg[][][] = [
    [
      [{ t: `Forfait annuel d'entretien préventif (${label})` }],
      [main ? { t: euro(main.ht) } : seg(null, "[HT]")],
      [{ t: `${vatRate} %` }],
      [main ? { t: euro(main.ttc), bold: true } : seg(null, "[TTC]")],
    ],
    [
      [{ t: "Option dépannage prioritaire (facultative)" }],
      [f.depannage ? { t: euro(computePrice(f.depannage, vatRate)!.ht) } : { t: "sur devis", color: GREY }],
      [{ t: `${vatRate} %` }],
      [f.depannage ? { t: euro(computePrice(f.depannage, vatRate)!.ttc) } : { t: "sur devis", color: GREY }],
    ],
  ];
  drawTable(doc, cols, rows, header);
}

// Évite le doublon quand le champ adresse contient déjà le code postal + ville.
function addressLine(address?: string, cpVille?: string): string {
  const a = (address || "").trim(), c = (cpVille || "").trim();
  if (!c) return a;
  if (a && a.toLowerCase().includes(c.toLowerCase())) return a;
  return [a, c].filter(Boolean).join(", ");
}

function frDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d; // déjà formaté ("1er juin 2026")
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/* ─── Construction du document ──────────────────────────────────────────────── */
function build(doc: Doc, data: ContratData) {
  const isPro = data.clientType === "professionnel";
  const pr = { ...PRESTATAIRE, ...(data.prestataire || {}) };
  const contract = data.contract || {};
  const c = data.client || {};
  const site = data.siteAddress || addressLine(c.address, c.postalCodeCity);
  const label = systemLabel(data);
  const vatRate = data.finance?.vatRate ?? (isPro ? 20 : 10);

  // En-tête : logo texte bicolore centré manuellement (pas de chevauchement)
  doc.font("Helvetica-Bold").fontSize(22);
  const w1 = doc.widthOfString("Clim"), w2 = doc.widthOfString("Expert");
  const lx = (doc.page.width - (w1 + w2)) / 2;
  doc.fillColor(NAVY).text("Clim", lx, doc.y, { continued: true, lineBreak: false });
  doc.fillColor(BLUE).text("Expert", { continued: false, lineBreak: false });
  // lineBreak:false n'avance PAS le curseur vertical → on le fait à la main (sinon le titre chevauche le logo).
  doc.x = M.left;
  doc.y += doc.currentLineHeight();
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(15).fillColor(NAVY).text("CONTRAT D'ENTRETIEN ET DE MAINTENANCE", M.left, doc.y, { width: contentWidth(doc), align: "center" });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(BLUE).text("Installations de climatisation et pompes à chaleur", M.left, doc.y, { width: contentWidth(doc), align: "center" });
  doc.moveDown(0.3);

  // Ligne « Contrat n°  …  Date : … » centrée manuellement
  doc.fontSize(10);
  const num = seg(contract.number, "[n°]");
  const dt = seg(frDate(contract.date), "[date]");
  const lineSegs = [
    { t: "Contrat n° ", f: "Helvetica", c: "black" },
    { t: num.t, f: "Helvetica-Bold", c: num.color || "black" },
    { t: "      Date : ", f: "Helvetica", c: "black" },
    { t: dt.t, f: "Helvetica-Bold", c: dt.color || "black" },
  ];
  let totalW = 0;
  lineSegs.forEach((p) => { doc.font(p.f); totalW += doc.widthOfString(p.t); });
  const lx2 = (doc.page.width - totalW) / 2, ly = doc.y;
  lineSegs.forEach((p, i) => {
    doc.font(p.f).fillColor(p.c);
    if (i === 0) doc.text(p.t, lx2, ly, { continued: true, lineBreak: false });
    else doc.text(p.t, { continued: i < lineSegs.length - 1, lineBreak: false });
  });
  // Idem : on avance sous la ligne n°/date (sinon le trait bleu passe à travers le texte).
  doc.x = M.left;
  doc.y = ly + doc.currentLineHeight();
  const yRule = doc.y + 4;
  doc.moveTo(M.left, yRule).lineTo(doc.page.width - M.right, yRule).lineWidth(1.2).strokeColor(BLUE).stroke();
  doc.moveDown(0.6);

  heading(doc, "Entre les soussignés");
  // Prestataire, attestation fluides omise proprement si vide (pas de rouge)
  const attest = pr.attestationFluides && pr.attestationFluides.trim()
    ? `, titulaire de l'attestation de capacité à la manipulation des fluides frigorigènes n° ${pr.attestationFluides}`
    : "";
  para(doc, [
    { t: pr.raisonSociale, bold: true },
    { t: `, ${pr.formeCapital}, dont le siège social est situé ${pr.siege}, immatriculée au ${pr.rcs}, ${pr.siret}, ${pr.ape}, ${pr.tva}${attest}, représentée par ${pr.representant} en sa qualité de ${pr.qualite}.` },
  ]);
  para(doc, [{ t: "ci-après dénommée « le Prestataire »,", italic: true }]);
  para(doc, [{ t: "ET", bold: true }]);
  clientBlock(doc, data);
  para(doc, [{ t: "ci-après dénommé « le Client »,", italic: true }]);
  para(doc, [{ t: "Il a été convenu et arrêté ce qui suit :", bold: true }]);

  heading(doc, "Article préliminaire. Préambule");
  para(doc, "Le présent contrat est conclu dans le cadre des obligations d'entretien des systèmes de climatisation et des pompes à chaleur prévues par le décret n° 2020-912 du 28 juillet 2020 et l'arrêté du 24 juillet 2020. Il a pour finalité de garantir le bon fonctionnement, la performance énergétique, la sécurité et la longévité de l'installation du Client, ainsi que sa conformité réglementaire, notamment au titre de la manipulation des fluides frigorigènes.");

  heading(doc, "Article 1. Objet du contrat");
  para(doc, [
    { t: "Le présent contrat définit les conditions dans lesquelles le Prestataire assure l'entretien périodique et la maintenance préventive de l'installation décrite à l'Article 2, située à l'adresse suivante : " },
    seg(site, "[adresse du site]"), { t: "." },
  ]);

  heading(doc, "Article 2. Désignation des équipements");
  para(doc, "L'installation couverte par le présent contrat est composée des équipements suivants :");
  equipmentTable(doc, data);
  note(doc, `Installation de type ${label}. La puissance nominale de l'installation correspond à la somme des puissances des machines présentes dans un même bâtiment. Lorsque cette puissance est comprise entre 4 kW et 70 kW, l'entretien est obligatoire selon une périodicité ne pouvant excéder deux ans.`);

  heading(doc, "Article 3. Nature des prestations");
  para(doc, "À chaque visite, le Prestataire réalise les opérations d'entretien préventif suivantes, adaptées au type d'installation :");
  [
    "Nettoyage ou remplacement des filtres des unités intérieures.",
    "Vérification et nettoyage des échangeurs (évaporateur et condenseur).",
    "Contrôle de l'étanchéité du circuit frigorifique et recherche de fuites conformément au règlement (UE) n° 517/2014 relatif aux gaz à effet de serre fluorés.",
    "Contrôle des pressions de fonctionnement et de la charge en fluide frigorigène.",
    "Vérification des raccordements et protections électriques, mesure des intensités absorbées.",
    "Contrôle de l'évacuation des condensats, nettoyage des bacs et des tuyauteries.",
    "Essais de fonctionnement en modes froid et chaud, vérification des régulations et thermostats.",
    "Contrôle des fixations, supports et de l'isolation des liaisons frigorifiques.",
    "Relevé des performances et conseils de bon usage remis au Client.",
  ].forEach((t) => bullet(doc, t));
  para(doc, "À l'issue de chaque visite, le Prestataire remet au Client une attestation d'entretien conforme à l'arrêté du 24 juillet 2020, accompagnée d'un compte rendu d'intervention.");

  const visits = Number(contract.visitsPerYear || 1);
  heading(doc, "Article 4. Fréquence et planification des visites");
  para(doc, [
    { t: "Le Prestataire réalise " }, { t: visits === 1 ? "une (1) visite" : `${visits} visites`, bold: true },
    { t: " d'entretien par an. La périodicité ne peut excéder deux ans pour les systèmes thermodynamiques dont la puissance nominale est comprise entre 4 kW et 70 kW, conformément au décret n° 2020-912. Les dates sont fixées d'un commun accord ; le Prestataire propose un rendez-vous au Client avec un préavis raisonnable." },
  ]);

  heading(doc, "Article 5. Prestations exclues");
  para(doc, "Sont exclus du forfait et font l'objet d'un devis distinct : les réparations, le remplacement de pièces défectueuses, la recharge en fluide frigorigène consécutive à une fuite, les interventions de dépannage, ainsi que les travaux résultant d'un mauvais usage, d'un défaut d'alimentation, d'actes de vandalisme, de gel, de surtension ou de toute cause étrangère à l'entretien normal. Les pièces et consommables remplacés sont facturés en supplément, sauf stipulation contraire écrite.");

  heading(doc, "Article 6. Obligations du Client");
  [
    "Assurer un accès libre et sécurisé aux équipements aux dates convenues.",
    "Maintenir l'alimentation électrique et les conditions permettant l'intervention.",
    "Signaler sans délai tout dysfonctionnement ou anomalie constaté.",
    "Ne pas faire intervenir de tiers non habilité sur l'installation pendant la durée du contrat.",
    "Régler les sommes dues selon les modalités de l'Article 8.",
  ].forEach((t) => bullet(doc, t));
  para(doc, "Les frais de déplacement sont compris dans le forfait annuel d'entretien. En cas d'absence du Client ou d'impossibilité d'accès à la date convenue, la visite est reportée à une nouvelle date fixée d'un commun accord.");

  heading(doc, "Article 7. Obligations du Prestataire");
  [
    "Exécuter les prestations selon les règles de l'art et la réglementation en vigueur.",
    "Faire intervenir un personnel qualifié et titulaire de l'attestation de capacité fluides frigorigènes.",
    "Remettre l'attestation d'entretien et le compte rendu après chaque visite.",
    "Respecter la confidentialité des informations relatives au Client.",
  ].forEach((t) => bullet(doc, t));

  heading(doc, "Article 8. Conditions financières");
  para(doc, "La rémunération du Prestataire est fixée comme suit :");
  financeTable(doc, data, vatRate);
  if (isPro) {
    note(doc, `L'installation étant située dans un local professionnel, le taux de TVA applicable est de ${vatRate} %. Le taux réduit de 10 % réservé à l'entretien dans un logement de plus de deux ans ne s'applique pas ici.`);
    para(doc, "Les frais de déplacement sont inclus dans le forfait annuel. Le règlement s'effectue par virement bancaire ou par carte bancaire, à réception de la facture. Le prix est révisable annuellement à la date anniversaire du contrat, le Client en étant informé au préalable. Tout retard de paiement entraîne des pénalités au taux légal en vigueur ainsi qu'une indemnité forfaitaire de recouvrement de 40 € (articles L. 441-10 et D. 441-5 du code de commerce).");
  } else {
    note(doc, `Le logement étant achevé depuis plus de deux ans, la main d'œuvre d'entretien relève du taux réduit de TVA de ${vatRate} %.`);
    para(doc, "Les frais de déplacement sont inclus dans le forfait annuel. Le règlement s'effectue par virement bancaire ou par carte bancaire, à réception de la facture. Le prix est révisable annuellement à la date anniversaire du contrat, le Client en étant informé au préalable. Tout retard de paiement entraîne des pénalités calculées au taux d'intérêt légal en vigueur, depuis la date d'échéance jusqu'au complet paiement.");
  }

  heading(doc, "Article 9. Délai d'intervention (option dépannage)");
  para(doc, "En cas de souscription de l'option dépannage, le Prestataire s'engage à intervenir dans un délai de 72 heures suivant la demande du Client, pendant les jours et heures ouvrés. Cette option est tarifée à l'Article 8.");

  const duration = contract.duration || "un (1) an";
  const notice = contract.notice || "deux (2) mois";
  heading(doc, "Article 10. Durée, reconduction et résiliation");
  para(doc, [
    { t: "Le contrat est conclu pour une durée de " }, { t: duration, bold: true },
    { t: " à compter du " }, { ...seg(frDate(contract.startDate), "[date de début]"), bold: true },
    { t: ". Il est renouvelé par tacite reconduction pour des périodes successives de même durée, sauf dénonciation par l'une des parties par lettre recommandée avec accusé de réception ou par voie électronique, moyennant un préavis de " },
    { t: notice, bold: true }, { t: " avant l'échéance." },
  ]);
  if (!isPro) {
    para(doc, "Conformément aux articles L. 215-1 et suivants du code de la consommation, le Prestataire informe le Client de sa faculté de ne pas reconduire le contrat, au plus tôt trois mois et au plus tard un mois avant le terme. Le Client ayant conclu le contrat à distance ou hors établissement dispose d'un délai de rétractation de quatorze jours, sauf renonciation expresse en cas d'exécution immédiate à sa demande.");
  }

  heading(doc, "Article 11. Responsabilité et assurance");
  para(doc, [
    { t: "Le Prestataire est tenu d'une obligation de moyens. Il est assuré au titre de sa responsabilité civile professionnelle auprès de " },
    seg(pr.assureur, "[assureur]"), { t: ", police n° " }, seg(pr.police, "[n° police]"),
    { t: ". Sa responsabilité ne saurait être engagée pour les dommages résultant de la vétusté de l'installation, d'un défaut d'origine, d'un usage non conforme ou de l'intervention d'un tiers." },
  ]);

  heading(doc, "Article 12. Fluides frigorigènes et environnement");
  para(doc, "Les opérations portant sur le circuit frigorifique sont réalisées par un personnel titulaire de l'attestation de capacité prévue par les articles R. 543-99 et suivants du code de l'environnement et par le règlement (UE) n° 517/2014. La récupération, le traitement et l'élimination des fluides et des déchets sont assurés conformément à la réglementation, avec établissement des bordereaux de suivi correspondants.");

  heading(doc, "Article 13. Protection des données personnelles");
  para(doc, `Les données personnelles communiquées par le Client sont traitées par le Prestataire pour la seule exécution du contrat, la facturation et le respect de ses obligations légales, conformément au règlement (UE) 2016/679. Le Client dispose d'un droit d'accès, de rectification, d'effacement et d'opposition qu'il peut exercer à l'adresse ${pr.email}.`);

  heading(doc, "Article 14. Force majeure");
  para(doc, "Aucune des parties ne pourra être tenue responsable d'un manquement à ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du code civil. L'exécution des obligations est suspendue pendant la durée de l'événement.");

  if (isPro) {
    heading(doc, "Article 15. Droit applicable et litiges");
    para(doc, "Le présent contrat est soumis au droit français. En cas de différend, les parties s'efforcent de trouver une solution amiable. À défaut de résolution amiable, le litige sera porté devant le tribunal de commerce compétent.");
  } else {
    const med = { ...MEDIATEUR, ...(data.mediator || {}) };
    heading(doc, "Article 15. Droit applicable, médiation et litiges");
    para(doc, [
      { t: "Le présent contrat est soumis au droit français. En cas de différend, les parties s'efforcent de trouver une solution amiable. À défaut, le Client peut recourir gratuitement au médiateur de la consommation " },
      seg(med.name, "[médiateur]"), { t: ", " }, seg(med.contact, "[coordonnées]"),
      { t: ". À défaut de résolution amiable, le litige sera porté devant les juridictions compétentes." },
    ]);
  }

  // Signatures
  doc.moveDown(0.8);
  para(doc, [
    { t: "Fait à " }, { ...seg(contract.place || "Paris", "[lieu]"), bold: true },
    { t: ", le " }, { ...seg(frDate(contract.date), "[date]"), bold: true },
    { t: ", en deux exemplaires originaux, chaque partie reconnaissant en avoir reçu un." },
  ]);
  signatureBlocks(doc, `Le Prestataire (${pr.raisonSociale})`, c.name ? `Le Client (${c.name})` : "Le Client");
}

function signatureBlocks(doc: Doc, leftTitle: string, rightTitle: string) {
  const h = 185;
  ensureSpace(doc, h + 8);
  doc.moveDown(0.3);
  const y0 = doc.y;
  const colW = (contentWidth(doc) - 18) / 2;
  const draw = (x: number, title: string) => {
    doc.rect(x, y0, colW, h).lineWidth(0.6).strokeColor("#BBBBBB").stroke();
    doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY).text(title, x + 10, y0 + 10, { width: colW - 20 });
    doc.font("Helvetica").fontSize(9).fillColor("black");
    doc.text("Nom et qualité :", x + 10, y0 + 34, { width: colW - 20 });
    doc.text("Date :", x + 10, y0 + 54, { width: colW - 20 });
    doc.text("Signature :", x + 10, y0 + 74, { width: colW - 20 });
    // grand espace libre sous « Signature : » pour signer
    doc.font("Helvetica-Oblique").fontSize(7).fillColor(GREY).text("précédée de la mention « Lu et approuvé, bon pour accord »", x + 10, y0 + h - 20, { width: colW - 20 });
  };
  draw(M.left, leftTitle);
  draw(M.left + colW + 18, rightTitle);
  doc.x = M.left;
  doc.y = y0 + h;
}

function footers(doc: Doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    // Neutralise la marge basse de CETTE page pour écrire dans le pied sans qu'une page
    // supplémentaire soit ajoutée par pdfkit.
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 40;
    doc.moveTo(M.left, y - 6).lineTo(doc.page.width - M.right, y - 6).lineWidth(0.5).strokeColor(BLUE).stroke();
    doc.font("Helvetica").fontSize(7).fillColor(GREY)
      .text(`${PRESTATAIRE.raisonSociale} · climexpert.fr · Île-de-France · SIREN 992 975 862     Page ${i + 1} / ${range.count}`,
        M.left, y, { width: contentWidth(doc), align: "center", lineBreak: false });
  }
}

export async function generateContratPDF(data: ContratData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: M, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  build(doc, data);
  footers(doc);
  doc.end();
  return done;
}

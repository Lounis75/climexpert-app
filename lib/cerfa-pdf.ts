// ClimExpert, Remplissage du CERFA 15497*04 « Fiche d'intervention » (fluides frigorigènes).
// On part du PDF OFFICIEL vierge (lib/cerfa-template-15497-04.pdf, AcroForm à 72 champs)
// et on remplit chaque champ par son nom avec pdf-lib → document rigoureusement identique
// à l'officiel, juste pré-rempli + signé. La signature (image PNG) est posée sur la cellule.

import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import path from "node:path";

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
  nature?: {
    assemblage?: boolean; miseEnService?: boolean; modification?: boolean; maintenance?: boolean;
    controleEtanchPeriodique?: boolean; controleEtanchNonPeriodique?: boolean; demantelement?: boolean;
    autre?: boolean; autreText?: string;
  };
  detecteurManuel?: string;
  controleLe?: string;                       // "JJ/MM/AAAA"
  systemePermanent?: "oui" | "non" | null;   // [6]
  quantiteRange?: string;                    // [7] ex "HCFC_2", "HFC_5", "HFO_1"…
  frequence?: string;                        // [8/9] ex "Sans_12m", "Avec_24m"…
  fuitesConstatees?: "oui" | "non" | null;   // [10]
  fuites?: Array<{ localisation?: string; reparation?: "realisee" | "a_faire" | null }>;
  manip?: {
    chargeeTotale?: string; vierge?: string; recycle?: string; regenere?: string; denominationSiChangement?: string;
    recupereeTotale?: string; traitement?: string; reutilisation?: string; bsff?: string; contenants?: string;
  };
  adr?: { un1078?: boolean; un1078Autres?: string; un3161?: boolean; un3161Autres?: string };
  destination?: string;                      // [13]
  observations?: string;                     // [14]
  signataireOperateur?: { nom?: string; qualite?: string; date?: string; signatureDataUrl?: string };
  signataireDetenteur?: { nom?: string; qualite?: string; date?: string; signatureDataUrl?: string };
};

let templateCache: Uint8Array | null = null;
function getTemplate(): Uint8Array {
  if (!templateCache) {
    templateCache = readFileSync(path.join(process.cwd(), "lib/cerfa-template-15497-04.pdf"));
  }
  return templateCache;
}

const v = (s?: string | null) => (s ?? "").toString().trim();

export async function generateCerfaPDF(d: CerfaData): Promise<Buffer> {
  const pdf = await PDFDocument.load(getTemplate());
  const form = pdf.getForm();

  const T = (name: string, val?: string) => { try { form.getTextField(name).setText(v(val)); } catch { /* champ absent */ } };
  const C = (name: string, on?: boolean) => { try { const cb = form.getCheckBox(name); if (on) cb.check(); else cb.uncheck(); } catch { /* */ } };

  const op = { ...OPERATEUR_DEFAUT, ...(d.operateur ?? {}) };
  const det = d.detenteur ?? {};
  const eq = d.equipement ?? {};
  const nat = d.nature ?? {};
  const manip = d.manip ?? {};
  const adr = d.adr ?? {};
  const sig = d.signataireOperateur ?? {};
  const dsig = d.signataireDetenteur ?? {};

  // [1][2]
  T("Fiche_no", d.ficheNumero);
  T("Operateur", [op.nom, op.adresse, op.siret].filter(Boolean).join("\n"));
  T("Attestation_no", d.attestationCapacite);
  T("Detenteur", [det.nom, det.adresse, det.siret].filter(Boolean).join("\n"));
  // [3]
  T("Equipement_ID", eq.identification);
  T("Equipement_Fluide", eq.fluide);          // le "R-" est déjà sur le formulaire
  T("Equipement_Charge", eq.chargeKg);
  T("Equipement_teqCO2", eq.tonnageCO2);
  // [4]
  C("Case_Assemblage", nat.assemblage);
  C("Case_MiseService", nat.miseEnService);
  C("Case_Modif", nat.modification);
  C("Case_Maintenance", nat.maintenance);
  C("Case_CtrlPerio", nat.controleEtanchPeriodique);
  C("Case_CtrlNonPerio", nat.controleEtanchNonPeriodique);
  C("Case_Demantel", nat.demantelement);
  C("Case_Autre", nat.autre || !!v(nat.autreText));
  T("Autre", nat.autreText);
  // [5]
  T("Detecteur_ID", d.detecteurManuel);
  const [jj, mm, aa] = v(d.controleLe).split("/");
  T("Controle_Jour", jj); T("Controle_Mois", mm); T("Controle_Annee", aa);
  // [6] OUI=1 / NON=2
  if (d.systemePermanent) { try { form.getRadioGroup("Bouton_Oui").select(d.systemePermanent === "oui" ? "1" : "2"); } catch { /* */ } }
  // [7] quantité de fluide (une plage)
  if (d.quantiteRange) C(`Case_${d.quantiteRange}`, true);
  // [8/9] fréquence
  if (d.frequence) C(`Case_${d.frequence}`, true);
  // [10] fuites
  C("Case_Fuite_Oui", d.fuitesConstatees === "oui");
  C("Case_Fuite_Non", d.fuitesConstatees === "non");
  (d.fuites ?? []).slice(0, 3).forEach((f, i) => {
    T(`Fuite_Loca_${i + 1}`, f.localisation);
    C(`Case_Rep_Fuite${i + 1}_realisee`, f.reparation === "realisee");
    C(`Case_Rep_Fuite${i + 1}_AFaire`, f.reparation === "a_faire");
  });
  // [11]
  T("11_Quantite", manip.chargeeTotale); T("11_QA", manip.vierge); T("11_Denom", manip.denominationSiChangement);
  T("11_QB", manip.recycle); T("11_QC", manip.regenere); T("11_QDE", manip.recupereeTotale);
  T("11_QD", manip.traitement); T("11_BSFF", manip.bsff); T("11_QE", manip.reutilisation); T("11_Contenant_ID", manip.contenants);
  // [12]
  C("Case_12_UN1078", adr.un1078); T("Autre-FF-NON-inflammable", adr.un1078Autres);
  C("Case_12_UN3161", adr.un3161); T("Autre-FF-inflammable", adr.un3161Autres);
  // [13][14]
  T("13_Instal", d.destination);
  T("14_Observations", d.observations);
  // Signatures (texte)
  T("Sign_Operateur_Nom", sig.nom); T("Sign_Operateur_Qualite", sig.qualite); T("Sign_Operateur_Date", sig.date);
  T("Sign_Detenteur_Nom", dsig.nom); T("Sign_Detenteur_Qualite", dsig.qualite); T("Sign_Detenteur_Date", dsig.date);

  // Signature manuscrite (image PNG), posée dans la cellule « Date et signature ».
  await drawSignature(pdf, form, "Sign_Operateur_Date", sig.signatureDataUrl);
  await drawSignature(pdf, form, "Sign_Detenteur_Date", dsig.signatureDataUrl);

  form.flatten(); // document final, non modifiable
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

async function drawSignature(pdf: PDFDocument, form: ReturnType<PDFDocument["getForm"]>, dateFieldName: string, dataUrl?: string) {
  if (!dataUrl) return;
  try {
    const b64 = dataUrl.split(",")[1];
    if (!b64) return;
    const png = await pdf.embedPng(Buffer.from(b64, "base64"));
    const widget = form.getTextField(dateFieldName).acroField.getWidgets()[0];
    const r = widget.getRectangle();
    const page = pdf.getPage(0);
    const maxW = Math.min(r.width * 0.55, 130);
    const dims = png.scaleToFit(maxW, r.height - 4);
    page.drawImage(png, { x: r.x + r.width - dims.width - 4, y: r.y + (r.height - dims.height) / 2, width: dims.width, height: dims.height });
  } catch { /* signature invalide → ignorée */ }
}

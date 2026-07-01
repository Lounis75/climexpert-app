import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";

// Coordonnées légales ClimExpert (reprises du devis officiel). La clé TVA (77) est calculée à
// partir du SIREN 992975862 : (12 + 3*(SIREN mod 97)) mod 97 = 77, donc FR77992975862.
const COMPANY = {
  name: "CLIM EXPERT",
  legal: "Société par actions simplifiée au capital social de 1 000,00 €",
  siren: "992 975 862",
  siret: "992 975 862 00010",
  tva: "FR77992975862",
  address: "200 rue de la Croix Nivert",
  city: "75015 Paris - France",
  phone: "+33 6 67 43 27 67",
  email: "contact@climexpert.fr",
  bank: "QONTO",
  iban: "FR76 1695 8000 0169 0729 0942 327",
  bic: "QNTOFRP1XXX",
  paymentTerms: "30 % à la signature du devis et 70 % à la livraison du chantier.",
  assurance: "Assurance décennale : ERGO France, contrat SV75018041T42457 (France métropolitaine et DROM).",
};

const C = { blue: "#0284c7", ink: "#0f172a", text: "#334155", muted: "#64748b", faint: "#94a3b8", line: "#e2e8f0", bg: "#f8fafc" };

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 70, paddingHorizontal: 44, fontSize: 9, fontFamily: "Helvetica", color: C.text, backgroundColor: "#ffffff" },

  // En-tête
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  logoMark: { width: 44, height: 44, backgroundColor: "#0ea5e9", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 11, justifyContent: "center" },
  logoBar: { height: 3.2, backgroundColor: "#ffffff", borderRadius: 2, marginBottom: 3 },
  docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.blue, marginTop: 14 },
  metaTable: { marginTop: 8 },
  metaLine: { flexDirection: "row", marginBottom: 2 },
  metaKey: { width: 92, fontSize: 8.5, color: C.muted },
  metaVal: { fontSize: 8.5, color: C.ink, fontFamily: "Helvetica-Bold" },

  party: { width: 200 },
  partyLabel: { fontSize: 8, color: C.faint, marginBottom: 2 },
  partyName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.blue, marginBottom: 2 },
  partyInfo: { fontSize: 8.5, color: C.text, lineHeight: 1.5 },

  // Titre objet
  objet: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.blue, marginTop: 6, marginBottom: 14 },

  // Tableau
  thead: { flexDirection: "row", backgroundColor: C.ink, paddingVertical: 7, paddingHorizontal: 8, borderRadius: "3 3 0 0" },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#cbd5e1" },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: "1 solid #f1f5f9" },
  trAlt: { backgroundColor: "#fbfcfe" },
  cDesig: { flex: 3 },
  cQty: { width: 42, textAlign: "center" },
  cPu: { width: 64, textAlign: "right" },
  cTva: { width: 38, textAlign: "center" },
  cHt: { width: 64, textAlign: "right" },
  cTtc: { width: 66, textAlign: "right" },
  cellText: { fontSize: 8.5, color: C.text },
  cellName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.ink },

  // Bas : détails TVA + récap
  bottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  tvaTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.blue, marginBottom: 6 },
  tvaHead: { flexDirection: "row", marginBottom: 3 },
  tvaCol: { fontSize: 7.5, color: C.faint },
  tvaRow: { flexDirection: "row", marginBottom: 2 },
  tvaCell: { fontSize: 8.5, color: C.text },

  recap: { width: 232 },
  recapTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.blue, marginBottom: 6 },
  recapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 10 },
  recapLabel: { fontSize: 9, color: C.muted },
  recapVal: { fontSize: 9, color: C.ink },
  recapTtc: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.blue, borderRadius: 4, marginTop: 3 },
  recapTtcLabel: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  recapTtcVal: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Paiement + signature
  pay: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  payBox: { width: 250, backgroundColor: C.bg, borderRadius: 5, padding: 11 },
  payTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 5 },
  payLine: { flexDirection: "row", marginBottom: 2 },
  payKey: { width: 78, fontSize: 8, color: C.muted },
  payVal: { fontSize: 8, color: C.ink, flex: 1 },
  signBox: { width: 220 },
  signLabel: { fontSize: 8, color: C.muted, marginBottom: 4, lineHeight: 1.5 },
  signFrame: { height: 70, border: "1 solid #cbd5e1", borderRadius: 5, backgroundColor: "#ffffff" },

  terms: { fontSize: 8, color: C.muted, marginTop: 14, lineHeight: 1.5 },

  // Pied de page
  footer: { position: "absolute", bottom: 30, left: 44, right: 44, borderTop: "1 solid #e2e8f0", paddingTop: 7 },
  footerText: { fontSize: 6.8, color: C.faint, textAlign: "center" },
});

function euros(ct: number | null | undefined) {
  if (!ct) return "0,00 €";
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }).replace(/[\u202f\u00a0]/g, " ");
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type Ligne = {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaireCt: number;
  tvaRate: string | number | null;
};

type DevisPDFProps = {
  number: string;
  createdAt: string;
  validUntil?: string | null;
  clientName: string;
  clientAddress?: string | null;
  description?: string | null;
  lignes: Ligne[];
  totalHtCt: number;
  totalTtcCt: number;
};

export default function DevisPDF({
  number, createdAt, validUntil, clientName, clientAddress, description, lignes, totalHtCt, totalTtcCt,
}: DevisPDFProps) {
  // Détails TVA par taux (arrondi par ligne, cohérent avec le total).
  const byRate: Record<string, { base: number; tva: number }> = {};
  for (const l of lignes) {
    const ht = l.quantite * l.prixUnitaireCt;
    const rate = String(Number(l.tvaRate ?? 20));
    const tva = Math.round(ht * (Number(rate) / 100));
    if (!byRate[rate]) byRate[rate] = { base: 0, tva: 0 };
    byRate[rate].base += ht;
    byRate[rate].tva += tva;
  }
  const tvaRows = Object.keys(byRate).sort((a, b) => Number(b) - Number(a));
  const totalTva = totalTtcCt - totalHtCt;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-tête : logo + Devis + numéro/dates  |  émetteur + client */}
        <View style={styles.header}>
          <View style={{ width: 230 }}>
            <View style={styles.logoMark}>
              <View style={[styles.logoBar, { width: 22 }]} />
              <View style={[styles.logoBar, { width: 16 }]} />
              <View style={[styles.logoBar, { width: 11, marginBottom: 0 }]} />
            </View>
            <Text style={styles.docTitle}>Devis</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaLine}><Text style={styles.metaKey}>Numéro</Text><Text style={styles.metaVal}>{number}</Text></View>
              <View style={styles.metaLine}><Text style={styles.metaKey}>Date d&apos;émission</Text><Text style={styles.metaVal}>{fmtDate(createdAt)}</Text></View>
              {validUntil ? <View style={styles.metaLine}><Text style={styles.metaKey}>Date d&apos;expiration</Text><Text style={styles.metaVal}>{fmtDate(validUntil)}</Text></View> : null}
            </View>
          </View>

          <View style={styles.party}>
            <Text style={styles.partyLabel}>Émetteur ou Émettrice</Text>
            <Text style={styles.partyName}>{COMPANY.name}</Text>
            <Text style={styles.partyInfo}>{COMPANY.address}{"\n"}{COMPANY.city}{"\n"}{COMPANY.email}{"\n"}{COMPANY.phone}</Text>
            <Text style={[styles.partyLabel, { marginTop: 12 }]}>Client ou Cliente</Text>
            <Text style={styles.partyName}>{clientName || "—"}</Text>
            {clientAddress ? <Text style={styles.partyInfo}>{clientAddress}</Text> : null}
          </View>
        </View>

        {/* Objet */}
        {description ? <Text style={styles.objet}>{description}</Text> : null}

        {/* Tableau des prestations */}
        <View style={styles.thead}>
          <Text style={[styles.th, styles.cDesig]}>Produits</Text>
          <Text style={[styles.th, styles.cQty]}>Qté</Text>
          <Text style={[styles.th, styles.cPu]}>Prix u. HT</Text>
          <Text style={[styles.th, styles.cTva]}>TVA</Text>
          <Text style={[styles.th, styles.cHt]}>Total HT</Text>
          <Text style={[styles.th, styles.cTtc]}>Total TTC</Text>
        </View>
        {lignes.map((l, i) => {
          const ht = l.quantite * l.prixUnitaireCt;
          const rate = Number(l.tvaRate ?? 20);
          const ttc = ht + Math.round(ht * (rate / 100));
          return (
            <View key={l.id} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
              <Text style={[styles.cellName, styles.cDesig]}>{l.designation}</Text>
              <Text style={[styles.cellText, styles.cQty]}>{l.quantite}</Text>
              <Text style={[styles.cellText, styles.cPu]}>{euros(l.prixUnitaireCt)}</Text>
              <Text style={[styles.cellText, styles.cTva]}>{rate}%</Text>
              <Text style={[styles.cellText, styles.cHt]}>{euros(ht)}</Text>
              <Text style={[styles.cellText, styles.cTtc]}>{euros(ttc)}</Text>
            </View>
          );
        })}

        {/* Détails TVA + Récapitulatif */}
        <View style={styles.bottom} wrap={false}>
          <View style={{ width: 230 }}>
            <Text style={styles.tvaTitle}>Détails TVA</Text>
            <View style={styles.tvaHead}>
              <Text style={[styles.tvaCol, { width: 60 }]}>Taux</Text>
              <Text style={[styles.tvaCol, { width: 90 }]}>Montant TVA</Text>
              <Text style={[styles.tvaCol, { width: 80 }]}>Base HT</Text>
            </View>
            {tvaRows.map((rate) => (
              <View key={rate} style={styles.tvaRow}>
                <Text style={[styles.tvaCell, { width: 60 }]}>{rate}%</Text>
                <Text style={[styles.tvaCell, { width: 90 }]}>{euros(byRate[rate].tva)}</Text>
                <Text style={[styles.tvaCell, { width: 80 }]}>{euros(byRate[rate].base)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.recap}>
            <Text style={styles.recapTitle}>Récapitulatif</Text>
            <View style={styles.recapRow}><Text style={styles.recapLabel}>Total HT</Text><Text style={styles.recapVal}>{euros(totalHtCt)}</Text></View>
            <View style={styles.recapRow}><Text style={styles.recapLabel}>Total TVA</Text><Text style={styles.recapVal}>{euros(totalTva)}</Text></View>
            <View style={styles.recapTtc}><Text style={styles.recapTtcLabel}>Total TTC</Text><Text style={styles.recapTtcVal}>{euros(totalTtcCt)}</Text></View>
          </View>
        </View>

        {/* Paiement + signature */}
        <View style={styles.pay} wrap={false}>
          <View style={styles.payBox}>
            <Text style={styles.payTitle}>Paiement</Text>
            <View style={styles.payLine}><Text style={styles.payKey}>Établissement</Text><Text style={styles.payVal}>{COMPANY.bank}</Text></View>
            <View style={styles.payLine}><Text style={styles.payKey}>IBAN</Text><Text style={styles.payVal}>{COMPANY.iban}</Text></View>
            <View style={styles.payLine}><Text style={styles.payKey}>BIC</Text><Text style={styles.payVal}>{COMPANY.bic}</Text></View>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Date et signature précédées de la mention{"\n"}« Bon pour accord »</Text>
            <View style={styles.signFrame} />
          </View>
        </View>

        {/* Conditions */}
        <Text style={styles.terms}>
          Modalités de paiement : {COMPANY.paymentTerms}{"\n"}
          Devis valable 30 jours à compter de sa date d&apos;émission. {COMPANY.assurance}
        </Text>

        {/* Pied de page légal */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${COMPANY.name} | ${COMPANY.legal} | N° SIREN ${COMPANY.siren} | N° de TVA ${COMPANY.tva}      ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

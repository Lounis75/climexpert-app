import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";

const COMPANY = {
  name: "CLIM EXPERT SAS",
  siret: "992 975 862 00010",
  tva: "FR77992975862",
  address: "200 rue de la Croix Nivert",
  city: "75015 Paris",
  phone: "06 67 43 27 67",
  email: "contact@climexpert.fr",
};

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 9, fontFamily: "Helvetica", color: "#1e293b", backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0284c7", marginBottom: 4 },
  companyInfo: { fontSize: 8, color: "#64748b", lineHeight: 1.6 },
  docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  docNumber: { fontSize: 10, color: "#64748b", textAlign: "right", marginTop: 4 },
  docDate: { fontSize: 8, color: "#94a3b8", textAlign: "right", marginTop: 2 },

  // Client block
  clientBlock: { backgroundColor: "#f8fafc", borderRadius: 6, padding: 14, marginBottom: 24, borderLeft: "3 solid #0284c7" },
  clientLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },

  // Meta row
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 24 },
  metaBox: { backgroundColor: "#f8fafc", borderRadius: 4, padding: 10, flex: 1 },
  metaLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  metaValue: { fontSize: 9, color: "#1e293b" },

  // Table
  tableHeader: { flexDirection: "row", backgroundColor: "#0f172a", borderRadius: "4 4 0 0", paddingVertical: 8, paddingHorizontal: 10 },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8" },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottom: "1 solid #f1f5f9" },
  tableRowAlt: { backgroundColor: "#fafafa" },
  cellDesig: { flex: 3 },
  cellQty: { width: 36, textAlign: "center" },
  cellPu: { width: 80, textAlign: "right" },
  cellTva: { width: 44, textAlign: "center" },
  cellTtc: { width: 80, textAlign: "right" },
  cellText: { fontSize: 9, color: "#334155" },

  // Totals
  totalsBlock: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
  totalsInner: { width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 10 },
  totalLabel: { fontSize: 9, color: "#64748b" },
  totalValue: { fontSize: 9, color: "#1e293b" },
  totalTtcRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "#0284c7", borderRadius: "0 0 4 4" },
  totalTtcLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  totalTtcValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Footer
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTop: "1 solid #e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },

  // Mentions
  mentions: { marginTop: 32, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  mentionText: { fontSize: 7, color: "#94a3b8", lineHeight: 1.6 },
});

function euros(ct: number | null | undefined) {
  if (!ct) return "0,00 €";
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
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
  description?: string | null;
  lignes: Ligne[];
  totalHtCt: number;
  totalTtcCt: number;
};

export default function DevisPDF({
  number, createdAt, validUntil, clientName, description, lignes, totalHtCt, totalTtcCt,
}: DevisPDFProps) {
  const totalTva = totalTtcCt - totalHtCt;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.companyInfo}>{COMPANY.address}{"\n"}{COMPANY.city}</Text>
            <Text style={styles.companyInfo}>Tél : {COMPANY.phone}</Text>
            <Text style={styles.companyInfo}>{COMPANY.email}</Text>
            <Text style={[styles.companyInfo, { marginTop: 6 }]}>SIRET : {COMPANY.siret}</Text>
            <Text style={styles.companyInfo}>TVA : {COMPANY.tva}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>DEVIS</Text>
            <Text style={styles.docNumber}>{number}</Text>
            <Text style={styles.docDate}>
              Émis le {new Date(createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.clientBlock}>
          <Text style={styles.clientLabel}>Destinataire</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          {validUntil && (
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Valable jusqu&apos;au</Text>
              <Text style={styles.metaValue}>
                {new Date(validUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
          )}
          {description && (
            <View style={[styles.metaBox, { flex: 2 }]}>
              <Text style={styles.metaLabel}>Objet</Text>
              <Text style={styles.metaValue}>{description}</Text>
            </View>
          )}
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.cellDesig]}>Désignation</Text>
          <Text style={[styles.tableHeaderText, styles.cellQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.cellPu]}>P.U. HT</Text>
          <Text style={[styles.tableHeaderText, styles.cellTva]}>TVA</Text>
          <Text style={[styles.tableHeaderText, styles.cellTtc]}>Total TTC</Text>
        </View>

        {lignes.map((l, i) => {
          const ht = l.quantite * l.prixUnitaireCt;
          const tva = Math.round(ht * (Number(l.tvaRate ?? 10) / 100));
          const ttc = ht + tva;
          return (
            <View key={l.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.cellText, styles.cellDesig]}>{l.designation}</Text>
              <Text style={[styles.cellText, styles.cellQty]}>{l.quantite}</Text>
              <Text style={[styles.cellText, styles.cellPu]}>{euros(l.prixUnitaireCt)}</Text>
              <Text style={[styles.cellText, styles.cellTva]}>{String(l.tvaRate ?? 10)}%</Text>
              <Text style={[styles.cellText, styles.cellTtc]}>{euros(ttc)}</Text>
            </View>
          );
        })}

        {/* Totaux */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{euros(totalHtCt)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>{euros(totalTva)}</Text>
            </View>
            <View style={styles.totalTtcRow}>
              <Text style={styles.totalTtcLabel}>Total TTC</Text>
              <Text style={styles.totalTtcValue}>{euros(totalTtcCt)}</Text>
            </View>
          </View>
        </View>

        {/* Mentions */}
        <View style={styles.mentions}>
          <Text style={styles.mentionText}>
            Ce devis est valable 30 jours à compter de sa date d&apos;émission, sauf mention contraire.
            Pour accepter ce devis, merci de le retourner signé avec la mention «Bon pour accord».
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{COMPANY.name} · SIRET {COMPANY.siret}</Text>
          <Text style={styles.footerText}>{number}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

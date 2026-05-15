import {
  Document, Page, Text, View, StyleSheet,
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

  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#059669", marginBottom: 4 },
  companyInfo: { fontSize: 8, color: "#64748b", lineHeight: 1.6 },
  docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  docNumber: { fontSize: 10, color: "#64748b", textAlign: "right", marginTop: 4 },
  docDate: { fontSize: 8, color: "#94a3b8", textAlign: "right", marginTop: 2 },

  clientBlock: { backgroundColor: "#f8fafc", borderRadius: 6, padding: 14, marginBottom: 24, borderLeft: "3 solid #059669" },
  clientLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },

  metaRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  metaBox: { backgroundColor: "#f8fafc", borderRadius: 4, padding: 10, flex: 1 },
  metaLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  metaValue: { fontSize: 9, color: "#1e293b" },
  metaValueAlert: { fontSize: 9, color: "#ef4444", fontFamily: "Helvetica-Bold" },

  amountBlock: { backgroundColor: "#f0fdf4", borderRadius: 8, padding: 20, marginBottom: 24, border: "1 solid #bbf7d0" },
  amountLabel: { fontSize: 8, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  amountRows: { flexDirection: "column", gap: 6 },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  amountRowLabel: { fontSize: 9, color: "#374151" },
  amountRowValue: { fontSize: 9, color: "#1e293b" },
  amountTtcRow: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #bbf7d0", paddingTop: 8, marginTop: 4 },
  amountTtcLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#059669" },
  amountTtcValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#059669" },

  paidBadge: { backgroundColor: "#d1fae5", borderRadius: 6, padding: "6 12", alignSelf: "flex-start", marginBottom: 16 },
  paidText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#059669" },

  rib: { backgroundColor: "#f8fafc", borderRadius: 6, padding: 14, marginBottom: 16, border: "1 solid #e2e8f0" },
  ribTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  ribRow: { flexDirection: "row", marginBottom: 3 },
  ribLabel: { fontSize: 8, color: "#64748b", width: 60 },
  ribValue: { fontSize: 8, color: "#1e293b", fontFamily: "Helvetica-Bold" },

  mentions: { marginTop: 24, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  mentionText: { fontSize: 7, color: "#94a3b8", lineHeight: 1.6 },

  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTop: "1 solid #e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

function euros(ct: number | null | undefined) {
  if (!ct) return "0,00 €";
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

type FacturePDFProps = {
  number: string;
  createdAt: string;
  dueDate?: string | null;
  paidAt?: string | null;
  clientName: string;
  devisNumber?: string;
  totalHtCt: number | null;
  totalTtcCt: number | null;
  tvaRate?: string | number | null;
  status: string;
};

export default function FacturePDF({
  number, createdAt, dueDate, paidAt, clientName, devisNumber,
  totalHtCt, totalTtcCt, tvaRate, status,
}: FacturePDFProps) {
  const ht = totalHtCt ?? 0;
  const ttc = totalTtcCt ?? 0;
  const tva = ttc - ht;
  const isOverdue = status === "en_attente" && dueDate && new Date(dueDate) < new Date();

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
            <Text style={styles.docTitle}>FACTURE</Text>
            <Text style={styles.docNumber}>{number}</Text>
            <Text style={styles.docDate}>
              Émise le {new Date(createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Payée badge */}
        {status === "payée" && paidAt && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>
              ✓ PAYÉE le {new Date(paidAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
        )}

        {/* Client */}
        <View style={styles.clientBlock}>
          <Text style={styles.clientLabel}>Facturé à</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Date d&apos;échéance</Text>
            <Text style={isOverdue ? styles.metaValueAlert : styles.metaValue}>
              {dueDate ? new Date(dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              {isOverdue ? "  (EN RETARD)" : ""}
            </Text>
          </View>
          {devisNumber && (
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Devis lié</Text>
              <Text style={styles.metaValue}>{devisNumber}</Text>
            </View>
          )}
        </View>

        {/* Montants */}
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Détail des montants</Text>
          <View style={styles.amountRows}>
            <View style={styles.amountRow}>
              <Text style={styles.amountRowLabel}>Total HT</Text>
              <Text style={styles.amountRowValue}>{euros(ht)}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountRowLabel}>TVA ({String(tvaRate ?? 10)}%)</Text>
              <Text style={styles.amountRowValue}>{euros(tva)}</Text>
            </View>
            <View style={styles.amountTtcRow}>
              <Text style={styles.amountTtcLabel}>Total TTC</Text>
              <Text style={styles.amountTtcValue}>{euros(ttc)}</Text>
            </View>
          </View>
        </View>

        {/* RIB / Modalités de paiement */}
        {status !== "payée" && (
          <View style={styles.rib}>
            <Text style={styles.ribTitle}>Modalités de règlement</Text>
            <Text style={[styles.mentionText, { marginBottom: 8 }]}>
              Règlement par virement bancaire, chèque ou espèces à l&apos;ordre de CLIM EXPERT SAS.
            </Text>
            <Text style={styles.mentionText}>
              En cas de retard de paiement, une pénalité de 3× le taux d&apos;intérêt légal sera appliquée,
              ainsi qu&apos;une indemnité forfaitaire de recouvrement de 40 €.
            </Text>
          </View>
        )}

        {/* Mentions légales */}
        <View style={styles.mentions}>
          <Text style={styles.mentionText}>
            CLIM EXPERT SAS — SIRET {COMPANY.siret} — TVA {COMPANY.tva}{"\n"}
            {COMPANY.address}, {COMPANY.city} — {COMPANY.phone} — {COMPANY.email}{"\n"}
            Conformément à l&apos;article L441-10 du Code de Commerce.
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

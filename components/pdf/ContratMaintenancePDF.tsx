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
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0284c7", marginBottom: 4 },
  companyInfo: { fontSize: 8, color: "#64748b", lineHeight: 1.6 },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right" },
  docNumber: { fontSize: 10, color: "#64748b", textAlign: "right", marginTop: 4 },
  docDate: { fontSize: 8, color: "#94a3b8", textAlign: "right", marginTop: 2 },
  typeBadge: { marginTop: 8, alignSelf: "flex-end", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4 },
  typeBadgeParticulier: { backgroundColor: "#e0f2fe" },
  typeBadgeProfessionnel: { backgroundColor: "#fef9c3" },
  typeBadgeTextParticulier: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#0284c7", textTransform: "uppercase", letterSpacing: 0.8 },
  typeBadgeTextProfessionnel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#b45309", textTransform: "uppercase", letterSpacing: 0.8 },

  // Client block
  clientBlock: { backgroundColor: "#f8fafc", borderRadius: 6, padding: 14, marginBottom: 24, borderLeft: "3 solid #0284c7" },
  clientLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 },
  clientInfo: { fontSize: 8, color: "#64748b", lineHeight: 1.6 },

  // Section titles
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 10, marginTop: 4, borderBottom: "1 solid #e2e8f0", paddingBottom: 4 },

  // Details table
  tableHeader: { flexDirection: "row", backgroundColor: "#0f172a", borderRadius: "4 4 0 0", paddingVertical: 8, paddingHorizontal: 10 },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8" },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottom: "1 solid #f1f5f9" },
  tableRowAlt: { backgroundColor: "#fafafa" },
  cellLabel: { flex: 1, fontSize: 9, color: "#64748b" },
  cellValue: { flex: 2, fontSize: 9, color: "#1e293b" },

  // Services grid
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  serviceItem: { width: "50%", flexDirection: "row", alignItems: "flex-start", paddingVertical: 5, paddingHorizontal: 8 },
  checkMark: { fontSize: 9, color: "#0284c7", fontFamily: "Helvetica-Bold", marginRight: 6, marginTop: 1 },
  serviceText: { fontSize: 9, color: "#334155", flex: 1 },

  // Pricing
  pricingBlock: { marginBottom: 24 },
  pricingRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, paddingHorizontal: 10, borderBottom: "1 solid #f1f5f9" },
  pricingLabel: { fontSize: 9, color: "#64748b" },
  pricingValue: { fontSize: 9, color: "#1e293b" },
  pricingTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 10, backgroundColor: "#0284c7", borderRadius: "0 0 4 4", marginTop: 2 },
  pricingTotalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  pricingTotalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Signature zone
  signatureZone: { flexDirection: "row", gap: 20, marginTop: 8 },
  signatureBox: { flex: 1, borderTop: "1 solid #e2e8f0", paddingTop: 10 },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#334155", marginBottom: 6 },
  signatureDash: { borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "dashed", borderRadius: 4, height: 64, marginTop: 4, justifyContent: "flex-end", padding: 6 },
  signatureDashHint: { fontSize: 7, color: "#cbd5e1", textAlign: "center" },
  signatureStampArea: { borderWidth: 1, borderColor: "#bae6fd", borderStyle: "dashed", borderRadius: 4, height: 64, marginTop: 4, backgroundColor: "#f0f9ff", justifyContent: "center", alignItems: "center" },
  signatureStampText: { fontSize: 7, color: "#7dd3fc", textAlign: "center" },

  // Footer
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTop: "1 solid #e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },

  // Page 2, Conditions générales
  cgPage: { padding: 48, fontSize: 9, fontFamily: "Helvetica", color: "#1e293b", backgroundColor: "#ffffff" },
  cgHeader: { marginBottom: 28, borderBottom: "2 solid #0284c7", paddingBottom: 12 },
  cgPageTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 },
  cgPageSubtitle: { fontSize: 9, color: "#64748b" },
  cgArticle: { marginBottom: 18 },
  cgArticleTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0284c7", marginBottom: 6, textTransform: "uppercase" },
  cgArticleText: { fontSize: 8.5, color: "#334155", lineHeight: 1.7 },
  cgFooter: { position: "absolute", bottom: 32, left: 48, right: 48, borderTop: "1 solid #e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  cgFooterText: { fontSize: 7, color: "#94a3b8" },
});

function euros(ct: number) {
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }).replace(/[\u202f\u00a0]/g, " ");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

interface ContratPDFProps {
  contrat: {
    id: string;
    type: "particulier" | "professionnel";
    marque: string;
    units: number;
    annees: number;
    prixUnitaireCt: number;
    startDate: string;
    endDate: string;
    signedAt?: string | null;
  };
  client: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  };
}

const SERVICES = [
  "Nettoyage complet des filtres",
  "Nettoyage de l’évaporateur et du condenseur",
  "Vérification du circuit frigorifène",
  "Contrôle électrique et mise en sécurité",
  "Vérification pompe de relevage",
  "Rapport d’intervention signé",
];

export default function ContratMaintenancePDF({ contrat, client }: ContratPDFProps) {
  const ref = `MAINT-${contrat.id.slice(0, 8).toUpperCase()}`;
  const sousTotal = contrat.prixUnitaireCt * contrat.units;
  const totalTtc = sousTotal * contrat.annees;
  const isParticulier = contrat.type === "particulier";

  return (
    <Document>
      {/* ─── PAGE 1, CONTRAT ─── */}
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.companyInfo}>{COMPANY.address}{"\n"}{COMPANY.city}</Text>
            <Text style={styles.companyInfo}>Tél : {COMPANY.phone}</Text>
            <Text style={styles.companyInfo}>{COMPANY.email}</Text>
            <Text style={[styles.companyInfo, { marginTop: 6 }]}>SIRET : {COMPANY.siret}</Text>
            <Text style={styles.companyInfo}>N° TVA : {COMPANY.tva}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>CONTRAT D&apos;ENTRETIEN{"\n"}DE CLIMATISATION</Text>
            <Text style={styles.docNumber}>{ref}</Text>
            <Text style={styles.docDate}>
              {contrat.signedAt
                ? `Signé le ${formatDate(contrat.signedAt)}`
                : `Émis le ${formatDate(contrat.startDate)}`}
            </Text>
            <View style={[styles.typeBadge, isParticulier ? styles.typeBadgeParticulier : styles.typeBadgeProfessionnel]}>
              <Text style={isParticulier ? styles.typeBadgeTextParticulier : styles.typeBadgeTextProfessionnel}>
                {isParticulier ? "Particulier" : "Professionnel"}
              </Text>
            </View>
          </View>
        </View>

        {/* Client block */}
        <View style={styles.clientBlock}>
          <Text style={styles.clientLabel}>Client</Text>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.address && <Text style={styles.clientInfo}>{client.address}</Text>}
          {client.city && <Text style={styles.clientInfo}>{client.city}</Text>}
          <Text style={styles.clientInfo}>Tél : {client.phone}</Text>
          {client.email && <Text style={styles.clientInfo}>{client.email}</Text>}
        </View>

        {/* Details table */}
        <Text style={styles.sectionTitle}>Détails du contrat</Text>
        <View style={{ marginBottom: 24 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cellLabel]}>Champ</Text>
            <Text style={[styles.tableHeaderText, styles.cellValue]}>Valeur</Text>
          </View>
          {[
            ["Équipement", contrat.marque],
            ["Nb d’unités", `${contrat.units} unité${contrat.units > 1 ? "s" : ""}`],
            ["Durée", `${contrat.annees} an${contrat.annees > 1 ? "s" : ""}`],
            ["Période", `${formatDate(contrat.startDate)} → ${formatDate(contrat.endDate)}`],
          ].map(([label, value], i) => (
            <View key={label} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.cellLabel}>{label}</Text>
              <Text style={styles.cellValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Services inclus */}
        <Text style={styles.sectionTitle}>Services inclus</Text>
        <View style={[styles.servicesGrid, { marginBottom: 24, backgroundColor: "#f8fafc", borderRadius: 6, padding: 8 }]}>
          {SERVICES.map((service) => (
            <View key={service} style={styles.serviceItem}>
              <Text style={styles.checkMark}>✓</Text>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <Text style={styles.sectionTitle}>Tarification</Text>
        <View style={styles.pricingBlock}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Détail</Text>
            <Text style={[styles.tableHeaderText, { width: 120, textAlign: "right" }]}>Montant TTC</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Prix unitaire (par an)</Text>
            <Text style={styles.pricingValue}>{euros(contrat.prixUnitaireCt)}</Text>
          </View>
          <View style={[styles.pricingRow, styles.tableRowAlt]}>
            <Text style={styles.pricingLabel}>Nb d&apos;unités</Text>
            <Text style={styles.pricingValue}>× {contrat.units}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Sous-total annuel</Text>
            <Text style={styles.pricingValue}>{euros(sousTotal)}</Text>
          </View>
          <View style={[styles.pricingRow, styles.tableRowAlt]}>
            <Text style={styles.pricingLabel}>Durée du contrat</Text>
            <Text style={styles.pricingValue}>× {contrat.annees} an{contrat.annees > 1 ? "s" : ""}</Text>
          </View>
          <View style={styles.pricingTotalRow}>
            <Text style={styles.pricingTotalLabel}>TOTAL TTC</Text>
            <Text style={styles.pricingTotalValue}>{euros(totalTtc)}</Text>
          </View>
        </View>

        {/* Signature zone */}
        <View style={styles.signatureZone}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Pour ClimExpert SAS</Text>
            <View style={styles.signatureStampArea}>
              <Text style={styles.signatureStampText}>Cachet et signature</Text>
              <Text style={styles.signatureStampText}>{COMPANY.name}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le client, {client.name}</Text>
            <View style={styles.signatureDash}>
              <Text style={styles.signatureDashHint}>Signature précédée de la mention{"\n"}« Lu et approuvé »</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{COMPANY.name} · SIRET {COMPANY.siret}</Text>
          <Text style={styles.footerText}>{ref}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>

      {/* ─── PAGE 2, CONDITIONS GÉNÉRALES ─── */}
      <Page size="A4" style={styles.cgPage}>

        <View style={styles.cgHeader}>
          <Text style={styles.cgPageTitle}>Conditions Générales du Contrat d&apos;Entretien</Text>
          <Text style={styles.cgPageSubtitle}>{COMPANY.name} · {ref}</Text>
        </View>

        {/* Article 1 */}
        <View style={styles.cgArticle}>
          <Text style={styles.cgArticleTitle}>Article 1, Objet du contrat</Text>
          <Text style={styles.cgArticleText}>
            Le présent contrat a pour objet la réalisation de prestations d&apos;entretien préventif sur les équipements de climatisation désignés à la page 1, installés à l&apos;adresse du client. Ces prestations comprennent toutes les opérations nécessaires au maintien en bon état de fonctionnement des unités couvertes, conformément aux préconisations des fabricants et aux règles de l&apos;art en vigueur dans le secteur du génie climatique. Le contrat ne constitue pas une assurance et ne saurait couvrir les pannes résultant d&apos;une cause extérieure aux équipements (surtension, foudre, intempéries, dégâts des eaux, etc.).
          </Text>
        </View>

        {/* Article 2 */}
        <View style={styles.cgArticle}>
          <Text style={styles.cgArticleTitle}>Article 2, Prestations incluses</Text>
          <Text style={styles.cgArticleText}>
            Dans le cadre du présent contrat, CLIM EXPERT SAS s&apos;engage à effectuer, au minimum une fois par an par unité couverte, les opérations suivantes : nettoyage complet des filtres à air, nettoyage de l&apos;évaporateur et du condenseur par voie chimique ou mécanique, vérification du circuit frigorigène (contrôle des pressions, recherche de fuites), contrôle des organes électriques et mise en sécurité (isolation, contacteurs, thermostats), vérification du bon fonctionnement de la pompe de relevage des condensats, ainsi que la remise d&apos;un rapport d&apos;intervention signé par le technicien. Ces interventions sont réalisées par un technicien qualifié, titulaire de l&apos;attestation d&apos;aptitude à la manipulation des fluides frigorigènes conformément au règlement (UE) n° 517/2014.
          </Text>
        </View>

        {/* Article 3 */}
        <View style={styles.cgArticle}>
          <Text style={styles.cgArticleTitle}>Article 3, Prestations exclues</Text>
          <Text style={styles.cgArticleText}>
            Sont expressément exclus du présent contrat : le remplacement de pièces détachées (compresseurs, cartes électroniques, vannes, résistances, motoréducteurs, etc.), le rechargement en fluide frigorigène, les travaux de réparation résultant d&apos;une détérioration accidentelle, d&apos;un acte de malveillance ou d&apos;un défaut d&apos;installation initial, les modifications ou extensions de l&apos;installation existante, ainsi que les déplacements d&apos;urgence hors des horaires d&apos;intervention habituels. Toute prestation non comprise dans le présent contrat fera l&apos;objet d&apos;un devis séparé préalable, accepté par le client avant exécution.
          </Text>
        </View>

        {/* Article 4 */}
        <View style={styles.cgArticle}>
          <Text style={styles.cgArticleTitle}>Article 4, Durée et renouvellement</Text>
          <Text style={styles.cgArticleText}>
            Le présent contrat est conclu pour une durée d&apos;un an renouvelable par tacite reconduction, sauf dénonciation par l&apos;une ou l&apos;autre des parties par lettre recommandée avec accusé de réception, au moins un (1) mois avant la date anniversaire. En cas de contrat pluriannuel, chaque année est facturée séparément selon les conditions tarifaires en vigueur à la date d&apos;émission de la facture annuelle. CLIM EXPERT SAS se réserve le droit d&apos;ajuster ses tarifs à chaque renouvellement, avec notification préalable au client au moins deux (2) mois avant l&apos;échéance.
          </Text>
        </View>

        {/* Article 5 */}
        <View style={styles.cgArticle}>
          <Text style={styles.cgArticleTitle}>Article 5, Tarifs et paiement</Text>
          <Text style={styles.cgArticleText}>
            Les prix indiqués sont exprimés en euros toutes taxes comprises (TTC). La facturation est effectuée annuellement, à la date anniversaire du contrat. Le règlement est exigible dans un délai de trente (30) jours à compter de la date d&apos;émission de la facture. En cas de retard de paiement, des pénalités seront appliquées au taux légal en vigueur, majoré de trois (3) points, sans qu&apos;une mise en demeure préalable soit nécessaire. Une indemnité forfaitaire de 40 € pour frais de recouvrement sera également due, conformément à l&apos;article L.441-10 du Code de commerce.
          </Text>
        </View>

        {/* Article 6 */}
        <View style={styles.cgArticle}>
          <Text style={styles.cgArticleTitle}>Article 6, Résiliation</Text>
          <Text style={styles.cgArticleText}>
            En dehors du cas de non-renouvellement visé à l&apos;article 4, le contrat peut être résilié avant son terme dans les cas suivants : manquement grave de l&apos;une des parties à ses obligations contractuelles, non corrigé dans un délai de quinze (15) jours suivant mise en demeure par lettre recommandée ; cessation définitive d&apos;utilisation des équipements couverts, sur justificatif. En cas de résiliation à l&apos;initiative du client hors motif légitime, les sommes versées au titre de la période en cours restent acquises à CLIM EXPERT SAS, et les échéances restant à courir seront dues à hauteur de 50 % à titre d&apos;indemnité forfaitaire. Toute résiliation doit être notifiée par lettre recommandée avec accusé de réception adressée au siège social de CLIM EXPERT SAS.
          </Text>
        </View>

        {/* CG Footer */}
        <View style={styles.cgFooter} fixed>
          <Text style={styles.cgFooterText}>{COMPANY.name} · SIRET {COMPANY.siret}</Text>
          <Text style={styles.cgFooterText}>{ref}, Conditions générales</Text>
          <Text style={styles.cgFooterText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

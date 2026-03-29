import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const DESIAN_PURPLE = "#4c0673";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: DESIAN_PURPLE,
    letterSpacing: 2,
  },
  headerMeta: {
    alignItems: "flex-end",
  },
  headerMetaLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  headerMetaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DESIAN_PURPLE,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  addressName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: DESIAN_PURPLE,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  tableRowAlt: {
    backgroundColor: "#f9f5fc",
  },
  tableCell: {
    fontSize: 9,
  },
  // Column widths
  colDescription: { width: "28%" },
  colDate: { width: "12%" },
  colHours: { width: "10%", textAlign: "right" },
  colPayRate: { width: "13%", textAlign: "right" },
  colChargeRate: { width: "13%", textAlign: "right" },
  colAmount: { width: "12%", textAlign: "right" },
  colChargeAmount: { width: "12%", textAlign: "right" },
  // Totals
  totalsContainer: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  totalsBox: {
    width: 260,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    marginVertical: 2,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#666",
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DESIAN_PURPLE,
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DESIAN_PURPLE,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#999",
  },
});

function penceToPounds(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export interface InvoicePdfLineItem {
  id: string;
  description: string;
  hours: number;
  payRate: number;
  chargeRate: number;
  payAmount: number;
  chargeAmount: number;
}

export interface InvoicePdfData {
  id: string;
  schoolName: string;
  schoolAddress: string;
  schoolPostcode: string;
  schoolContactName: string;
  schoolContactEmail: string;
  periodStart: string;
  periodEnd: string;
  totalPayAmount: number;
  totalChargeAmount: number;
  status: string;
  createdAt: Date;
  lineItems: InvoicePdfLineItem[];
}

function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const grossMargin = data.totalChargeAmount - data.totalPayAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaLabel}>Invoice ID</Text>
            <Text style={styles.headerMetaValue}>{data.id}</Text>
            <Text style={styles.headerMetaLabel}>Date</Text>
            <Text style={styles.headerMetaValue}>
              {formatDate(data.createdAt)}
            </Text>
            <Text style={styles.headerMetaLabel}>Status</Text>
            <Text style={styles.headerMetaValue}>
              {data.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* From / To */}
        <View style={[styles.section, styles.row]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.addressName}>Desian Education</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>To</Text>
            <Text style={styles.addressName}>{data.schoolName}</Text>
            <Text style={styles.addressText}>{data.schoolAddress}</Text>
            <Text style={styles.addressText}>{data.schoolPostcode}</Text>
            <Text style={styles.addressText}>{data.schoolContactName}</Text>
            <Text style={styles.addressText}>{data.schoolContactEmail}</Text>
          </View>
        </View>

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period</Text>
          <Text style={styles.addressText}>
            {formatDate(data.periodStart)} — {formatDate(data.periodEnd)}
          </Text>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Hours</Text>
            <Text style={[styles.tableHeaderCell, styles.colPayRate]}>
              Pay Rate
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colChargeRate]}>
              Charge Rate
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>
              Pay Amt
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colChargeAmount]}>
              Charge Amt
            </Text>
          </View>
          {data.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colHours]}>
                {item.hours.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, styles.colPayRate]}>
                {penceToPounds(item.payRate)}/hr
              </Text>
              <Text style={[styles.tableCell, styles.colChargeRate]}>
                {penceToPounds(item.chargeRate)}/hr
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {penceToPounds(item.payAmount)}
              </Text>
              <Text style={[styles.tableCell, styles.colChargeAmount]}>
                {penceToPounds(item.chargeAmount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Pay Cost</Text>
              <Text style={styles.totalsValue}>
                {penceToPounds(data.totalPayAmount)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Gross Margin</Text>
              <Text style={styles.totalsValue}>
                {penceToPounds(grossMargin)}
              </Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.grandTotalLabel}>Total Charge Amount</Text>
              <Text style={styles.grandTotalValue}>
                {penceToPounds(data.totalChargeAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by QuickSupply</Text>
          <Text style={styles.footerText}>
            Invoice {data.id} | {formatDate(data.createdAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

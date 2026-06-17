import { StyleSheet, Text, View } from "@react-pdf/renderer";

export const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  primarySoft: "#EEF2FF",
  text: "#111827",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E5E7EB",
  rowAlt: "#FAFAFA",
  good: "#16A34A",
  goodSoft: "#DCFCE7",
  bad: "#DC2626",
} as const;

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.text,
    padding: 32,
    paddingBottom: 50,
  },

  // Header band
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.primary,
    color: "white",
    borderRadius: 4,
    marginBottom: 14,
  },
  headerTitle: { fontSize: 14, fontWeight: 700, color: "white" },
  headerKicker: {
    fontSize: 8,
    color: "white",
    opacity: 0.85,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerMeta: { fontSize: 8, color: "white", opacity: 0.85, textAlign: "right" },
  headerMetaStrong: { fontSize: 9, color: "white", fontWeight: 700 },

  // Section
  section: { marginTop: 12, marginBottom: 4 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: COLORS.primary,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },

  // Key / value grid
  kvGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  kvCell: { width: "50%", paddingHorizontal: 4, marginBottom: 6 },
  kvCellThird: { width: "33.33%", paddingHorizontal: 4, marginBottom: 6 },
  kvCellFull: { width: "100%", paddingHorizontal: 4, marginBottom: 6 },
  kvLabel: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  kvValue: { fontSize: 9.5, color: COLORS.text, fontWeight: 500 },
  kvDash: { fontSize: 9.5, color: COLORS.faint, fontWeight: 400 },

  // Tables
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 7.5,
    color: COLORS.primaryDark,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowLast: { flexDirection: "row" },
  tableCell: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 8.5,
    color: COLORS.text,
  },
  tableCellMuted: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 8.5,
    color: COLORS.muted,
  },
  tableCellRight: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 8.5,
    color: COLORS.text,
    textAlign: "right",
  },

  // Flag chips
  chip: {
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primaryDark,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontSize: 7.5,
    fontWeight: 700,
    marginRight: 4,
    marginBottom: 4,
  },
  chipBad: {
    backgroundColor: "#FEE2E2",
    color: COLORS.bad,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.faint,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 4,
  },
  pageNumber: { fontSize: 7, color: COLORS.faint },
});

// --- Small helpers -----------------------------------------------------------

export function KV({
  label,
  value,
  width = "half",
}: {
  label: string;
  value: string | null | undefined;
  width?: "half" | "third" | "full";
}) {
  const isEmpty = !value || value === "—";
  const cellStyle =
    width === "third"
      ? styles.kvCellThird
      : width === "full"
        ? styles.kvCellFull
        : styles.kvCell;
  return (
    <View style={cellStyle}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={isEmpty ? styles.kvDash : styles.kvValue}>
        {isEmpty ? "—" : value}
      </Text>
    </View>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function DocHeader({
  kicker,
  title,
  meta,
}: {
  kicker: string;
  title: string;
  meta: { label: string; value: string }[];
}) {
  return (
    <View style={styles.headerBand}>
      <View>
        <Text style={styles.headerKicker}>{kicker}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View>
        {meta.map((m) => (
          <Text key={m.label} style={styles.headerMeta}>
            <Text style={styles.headerMetaStrong}>{m.label}: </Text>
            {m.value}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function PageFooter({ submissionUuid }: { submissionUuid: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        Submission #{submissionUuid.slice(0, 8)} · Generated{" "}
        {new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

// --- Data shape --------------------------------------------------------------

export type SubmissionForPdf = {
  uuid: string;
  status: string;
  namedInsured: string;
  targetEffectiveDate: Date | null;
  targetExpirationDate: Date | null;
  linesOfBusiness: string[];
  yearsInBusiness: number | null;
  annualRevenue: string | null;
  totalPayroll: string | null;
  businessDescription: string;
  additionalInsuredNames: string;
  certificatesOfInsuranceNotes: string;
  hasPriorCoverage: boolean;
  priorCarrier: string;
  priorExpirationDate: Date | null;
  claimsInLast5Years: number;
  hasPriorLosses5y: boolean;
  hasBankruptcy5y: boolean;
  hasIndictmentsOrConvictions: boolean;
  hasCivilJudgments: boolean;
  operatesOtherBusinesses: boolean;
  hasOnlinePresence: boolean;
  inBusiness12moNoPriorCoverage: boolean;
  requiresSignedLeaseWithHoldharmless: boolean;
  collectsCoiFromTenants: boolean;
  priorClaimsMoldOrAsbestos: boolean;
  accountExecutive: string;
  accountRepresentative: string;
  accountBroker: string;
  accountProducer: string;
  parentCompany: string;
  writingCompany: string;
  companyType: string;
  underwriterContact: string;
  division: string;
  branch: string;
  department: string;
  groupName: string;
  customer: {
    id: number;
    businessName: string;
    dba: string;
    businessEntity: string;
    federalId: string;
    naics: string;
    email: string;
    phone: string;
    firstName: string | null;
    lastName: string | null;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contacts: Array<{
    id: number;
    role: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    notes: string;
  }>;
  otherInsurance: Array<{
    id: number;
    carrierName: string;
    lineOfBusiness: string;
    policyNumber: string;
    policyEffectiveDate: Date | null;
    policyExpirationDate: Date | null;
    premium: string | null;
  }>;
  lossHistory: Array<{
    id: number;
    carrierName: string;
    policyNumber: string;
    lineOfBusiness: string;
    dateOfLoss: Date | null;
    kindOfLoss: string;
    description: string;
    claimStatus: string;
    amountOfLoss: string | null;
    amountPaid: string | null;
  }>;
  additionalInterests: Array<{
    id: number;
    interestType: string;
    name: string;
    contactName: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    descriptionOfOperations: string;
    isBonded: boolean;
    isLicensed: boolean;
    certificateRequired: boolean;
    certificateIssued: boolean;
  }>;
  locations: Array<{
    id: number;
    locationNumber: number;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    occupancyClass: string;
    buildings: Array<{
      id: number;
      buildingNumber: number;
      name: string;
      yearBuilt: number | null;
      totalSqft: number | null;
      numStories: number | null;
      numUnits: number | null;
      propertyUsage: string;
      tenantType: string;
      constructionType: string;
      roofType: string;
      roofCoveringType: string;
      electricalType: string;
      plumbingType: string;
      hvacType: string;
      sprinklered: boolean;
      insurableValue: string | null;
      replacementCost: string | null;
    }>;
  }>;
  glCoverage: {
    insuranceCarrier: string;
    lineOfBusiness: string;
    formOfCoverage: string;
    carrierParticipationPct: string;
    eachOccurrenceLimit: string;
    generalAggregate: string;
    productsCompletedOpsAggregate: string;
    personalAdvertisingInjuryLimit: string;
    medicalExpense: string;
    damageToRentedPremises: string;
    aggregateBasis: string;
  } | null;
  glClassifications: Array<{
    id: number;
    locationId: number;
    classCode: string;
    description: string;
    exposure: string;
  }>;
  optionalCoverages: Array<{
    id: number;
    name: string;
    value: { label?: string; limit?: number | null; type?: string | null };
  }>;
};

// --- Formatters --------------------------------------------------------------

export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtMoney(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtLimit(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${n / 1_000_000}M`;
  if (n >= 1_000) return `$${n / 1_000}K`;
  return `$${n}`;
}

export function fmtNum(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

export function customerDisplay(c: SubmissionForPdf["customer"]): string {
  return c.businessName || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || `Customer #${c.id}`;
}

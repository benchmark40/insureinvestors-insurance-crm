import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  DocHeader,
  KV,
  PageFooter,
  Section,
  customerDisplay,
  fmtDate,
  fmtLimit,
  fmtNum,
  styles,
  type SubmissionForPdf,
} from "./shared";

export function Acord126Document({ s }: { s: SubmissionForPdf }) {
  const gl = s.glCoverage;

  return (
    <Document
      title={`General Liability — ${customerDisplay(s.customer)}`}
      author="insureinvestors"
    >
      <Page size="LETTER" style={styles.page}>
        <DocHeader
          kicker="General Liability Section (ACORD 126 equivalent)"
          title={customerDisplay(s.customer)}
          meta={[
            { label: "Submission", value: `#${s.uuid.slice(0, 8)}` },
            { label: "Effective", value: fmtDate(s.targetEffectiveDate) },
            { label: "Expiration", value: fmtDate(s.targetExpirationDate) },
          ]}
        />

        <Section title="Coverage Information">
          <View style={styles.kvGrid}>
            <KV
              label="Insurance carrier"
              value={gl?.insuranceCarrier || "—"}
            />
            <KV
              label="Line of business"
              value={gl?.lineOfBusiness || "Commercial General Liability"}
            />
            <KV
              label="Form of coverage"
              value={
                gl?.formOfCoverage === "occurrence"
                  ? "Occurrence"
                  : gl?.formOfCoverage === "claims_made"
                    ? "Claims-Made"
                    : "—"
              }
            />
            <KV
              label="Carrier participation"
              value={
                gl?.carrierParticipationPct
                  ? `${gl.carrierParticipationPct}%`
                  : "—"
              }
            />
          </View>
        </Section>

        <Section title="Policy Limits">
          <View style={styles.kvGrid}>
            <KV
              label="Each occurrence"
              value={fmtLimit(gl?.eachOccurrenceLimit)}
            />
            <KV
              label="General aggregate"
              value={fmtLimit(gl?.generalAggregate)}
            />
            <KV
              label="Products & completed ops"
              value={fmtLimit(gl?.productsCompletedOpsAggregate)}
            />
            <KV
              label="Personal & advertising injury"
              value={fmtLimit(gl?.personalAdvertisingInjuryLimit)}
            />
            <KV
              label="Medical expense (any one person)"
              value={fmtLimit(gl?.medicalExpense)}
            />
            <KV
              label="Damage to rented premises"
              value={fmtLimit(gl?.damageToRentedPremises)}
            />
            <KV
              label="Aggregate basis"
              value={
                gl?.aggregateBasis === "policy"
                  ? "Per Policy"
                  : gl?.aggregateBasis === "per_location"
                    ? "Per Location"
                    : gl?.aggregateBasis === "per_project"
                      ? "Per Project"
                      : "—"
              }
            />
          </View>
        </Section>

        <Section
          title={`Classifications (${s.glClassifications.length})`}
        >
          {s.glClassifications.length === 0 ? (
            <Text style={{ fontSize: 9, color: "#9CA3AF" }}>
              No classifications on file.
            </Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "8%" }]}>
                  Loc
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "16%" }]}>
                  Class code
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "56%" }]}>
                  Description
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: "20%", textAlign: "right" },
                  ]}
                >
                  Exposure
                </Text>
              </View>
              {s.glClassifications.map((cls, i) => {
                const loc = s.locations.find((l) => l.id === cls.locationId);
                const isLast = i === s.glClassifications.length - 1;
                return (
                  <View
                    key={cls.id}
                    style={isLast ? styles.tableRowLast : styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { width: "8%" }]}>
                      L{loc?.locationNumber ?? "?"}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "16%", fontWeight: 700, color: "#3730A3" },
                      ]}
                    >
                      {cls.classCode}
                    </Text>
                    <Text style={[styles.tableCell, { width: "56%" }]}>
                      {cls.description}
                    </Text>
                    <Text style={[styles.tableCellRight, { width: "20%" }]}>
                      {fmtNum(cls.exposure)} sqft
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        <Section
          title={`Additional Coverages (${s.optionalCoverages.length})`}
        >
          {s.optionalCoverages.length === 0 ? (
            <Text style={{ fontSize: 9, color: "#9CA3AF" }}>
              No additional coverages selected.
            </Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "60%" }]}>
                  Coverage
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                  Limit / Type
                </Text>
              </View>
              {s.optionalCoverages.map((cov, i) => {
                const isLast = i === s.optionalCoverages.length - 1;
                const detail =
                  typeof cov.value.type === "string"
                    ? cov.value.type.charAt(0).toUpperCase() +
                      cov.value.type.slice(1)
                    : typeof cov.value.limit === "number"
                      ? fmtLimit(cov.value.limit)
                      : "Included";
                return (
                  <View
                    key={cov.id}
                    style={isLast ? styles.tableRowLast : styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { width: "60%" }]}>
                      {cov.value.label || cov.name}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "40%", fontWeight: 700, color: "#3730A3" },
                      ]}
                    >
                      {detail}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        <PageFooter submissionUuid={s.uuid} />
      </Page>
    </Document>
  );
}

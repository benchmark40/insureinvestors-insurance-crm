import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  COLORS,
  DocHeader,
  PageFooter,
  Section,
  customerDisplay,
  fmtDate,
  fmtMoney,
  fmtNum,
  styles,
  type SubmissionForPdf,
} from "./shared";

export function Acord140Document({ s }: { s: SubmissionForPdf }) {
  return (
    <Document
      title={`Property — ${customerDisplay(s.customer)}`}
      author="insureinvestors"
    >
      <Page size="LETTER" style={styles.page}>
        <DocHeader
          kicker="Property Section (ACORD 140 equivalent)"
          title={customerDisplay(s.customer)}
          meta={[
            { label: "Submission", value: `#${s.uuid.slice(0, 8)}` },
            { label: "Effective", value: fmtDate(s.targetEffectiveDate) },
            {
              label: "Locations",
              value: String(s.locations.length),
            },
          ]}
        />

        {s.locations.length === 0 ? (
          <Section title="Locations">
            <Text style={{ fontSize: 9, color: COLORS.faint }}>
              No locations on file for this submission.
            </Text>
          </Section>
        ) : (
          s.locations.map((loc) => {
            const addr = [
              loc.addressLine1,
              loc.addressLine2,
              loc.city,
              loc.state,
              loc.zipCode,
            ]
              .filter(Boolean)
              .join(", ");
            const totalSqft = loc.buildings.reduce(
              (sum, b) => sum + (b.totalSqft ?? 0),
              0,
            );
            const totalValue = loc.buildings.reduce(
              (sum, b) => sum + Number(b.insurableValue ?? 0),
              0,
            );
            return (
              <Section
                key={loc.id}
                title={`Location ${loc.locationNumber} · ${
                  addr || "No address on file"
                }`}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <Pill
                    label="Buildings"
                    value={String(loc.buildings.length)}
                  />
                  <Pill label="Total sqft" value={fmtNum(totalSqft)} />
                  <Pill
                    label="Total insurable value"
                    value={fmtMoney(totalValue)}
                  />
                  <Pill label="Occupancy class" value={loc.occupancyClass} />
                </View>

                {loc.buildings.length === 0 ? (
                  <Text
                    style={{
                      fontSize: 9,
                      color: COLORS.faint,
                      paddingTop: 4,
                    }}
                  >
                    No buildings on this location.
                  </Text>
                ) : (
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "6%" }]}>
                        #
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                        Name / Usage
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                        Construction
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                        Systems
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderCell,
                          { width: "8%", textAlign: "right" },
                        ]}
                      >
                        Year
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderCell,
                          { width: "10%", textAlign: "right" },
                        ]}
                      >
                        Sqft
                      </Text>
                      <Text
                        style={[
                          styles.tableHeaderCell,
                          { width: "18%", textAlign: "right" },
                        ]}
                      >
                        Insurable
                      </Text>
                    </View>
                    {loc.buildings.map((b, i) => {
                      const isLast = i === loc.buildings.length - 1;
                      return (
                        <View
                          key={b.id}
                          style={
                            isLast ? styles.tableRowLast : styles.tableRow
                          }
                        >
                          <Text style={[styles.tableCell, { width: "6%" }]}>
                            {b.buildingNumber}
                          </Text>
                          <Text style={[styles.tableCell, { width: "20%" }]}>
                            <Text style={{ fontWeight: 700 }}>
                              {b.name || `Building ${b.buildingNumber}`}
                            </Text>
                            {b.propertyUsage ? `\n${b.propertyUsage}` : ""}
                          </Text>
                          <Text style={[styles.tableCell, { width: "20%" }]}>
                            {b.constructionType || "—"}
                            {b.roofType ? `\nRoof: ${b.roofType}` : ""}
                            {b.roofCoveringType
                              ? `\nCovering: ${b.roofCoveringType}`
                              : ""}
                          </Text>
                          <Text style={[styles.tableCell, { width: "18%" }]}>
                            {[b.electricalType, b.plumbingType, b.hvacType]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                            {b.sprinklered ? `\nSprinklered` : ""}
                          </Text>
                          <Text
                            style={[
                              styles.tableCellRight,
                              { width: "8%" },
                            ]}
                          >
                            {b.yearBuilt ?? "—"}
                          </Text>
                          <Text
                            style={[
                              styles.tableCellRight,
                              { width: "10%" },
                            ]}
                          >
                            {fmtNum(b.totalSqft)}
                          </Text>
                          <Text
                            style={[
                              styles.tableCellRight,
                              {
                                width: "18%",
                                fontWeight: 700,
                                color: COLORS.primaryDark,
                              },
                            ]}
                          >
                            {fmtMoney(b.insurableValue)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Section>
            );
          })
        )}

        <PageFooter submissionUuid={s.uuid} />
      </Page>
    </Document>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.primarySoft,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 3,
        flexDirection: "row",
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 7,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 8, color: COLORS.primaryDark, fontWeight: 700 }}>
        {value || "—"}
      </Text>
    </View>
  );
}

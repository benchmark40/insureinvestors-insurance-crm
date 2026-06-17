import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  COLORS,
  KV,
  PageFooter,
  Section,
  customerDisplay,
  fmtDate,
  fmtLimit,
  fmtMoney,
  fmtNum,
  styles,
  type SubmissionForPdf,
} from "./shared";

// "Kitchen sink" full summary — cover page + every section.

export function SupplementalDocument({ s }: { s: SubmissionForPdf }) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const insured = customerDisplay(s.customer);

  return (
    <Document
      title={`Submission Summary — ${insured}`}
      author="insureinvestors"
    >
      {/* COVER */}
      <Page size="LETTER" style={styles.page}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.primary,
              width: 64,
              height: 64,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              ii
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            Submission Summary
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: COLORS.text,
              textAlign: "center",
              maxWidth: 380,
            }}
          >
            {insured}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 24,
              marginTop: 20,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <Pill label="Submission" value={`#${s.uuid.slice(0, 8)}`} />
            <Pill label="Status" value={s.status} />
            <Pill
              label="Lines"
              value={s.linesOfBusiness.join(", ") || "—"}
            />
          </View>
          <Text
            style={{
              marginTop: 32,
              fontSize: 9,
              color: COLORS.faint,
            }}
          >
            Generated {today}
          </Text>
        </View>
      </Page>

      {/* DETAIL */}
      <Page size="LETTER" style={styles.page}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            color: "white",
            padding: 12,
            borderRadius: 4,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              color: "white",
              opacity: 0.85,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Full Submission Summary
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
            {insured}
          </Text>
        </View>

        <Section title="Insured Information">
          <View style={styles.kvGrid}>
            <KV label="Customer #" value={String(s.customer.id)} />
            <KV label="Named insured" value={s.namedInsured} />
            <KV label="DBA" value={s.customer.dba} />
            <KV
              label="Primary contact"
              value={
                [s.customer.firstName, s.customer.lastName]
                  .filter(Boolean)
                  .join(" ") || null
              }
            />
            <KV label="Email" value={s.customer.email} />
            <KV label="Phone" value={s.customer.phone} />
            <KV label="NAICS" value={s.customer.naics} />
            <KV label="Federal ID" value={s.customer.federalId} />
            <KV
              label="Mailing address"
              value={
                [
                  [s.customer.addressLine1, s.customer.addressLine2]
                    .filter(Boolean)
                    .join(", "),
                  [s.customer.city, s.customer.state, s.customer.zipCode]
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ") || null
              }
              width="full"
            />
          </View>
        </Section>

        <Section title="Policy Information">
          <View style={styles.kvGrid}>
            <KV label="Status" value={s.status} />
            <KV
              label="Lines of business"
              value={s.linesOfBusiness.join(", ")}
            />
            <KV
              label="Target effective"
              value={fmtDate(s.targetEffectiveDate)}
            />
            <KV
              label="Target expiration"
              value={fmtDate(s.targetExpirationDate)}
            />
            <KV
              label="Years in business"
              value={s.yearsInBusiness?.toString() ?? null}
            />
            <KV label="Annual revenue" value={fmtMoney(s.annualRevenue)} />
          </View>
        </Section>

        <Section title="Business Operations">
          <Text
            style={{
              fontSize: 9,
              color: s.businessDescription ? COLORS.text : COLORS.faint,
            }}
          >
            {s.businessDescription || "—"}
          </Text>
        </Section>

        <Section title="Service Group / Company / Business Unit">
          <View style={styles.kvGrid}>
            <KV
              label="Account executive"
              value={s.accountExecutive}
              width="third"
            />
            <KV
              label="Account representative"
              value={s.accountRepresentative}
              width="third"
            />
            <KV label="Account broker" value={s.accountBroker} width="third" />
            <KV
              label="Account producer"
              value={s.accountProducer}
              width="third"
            />
            <KV label="Parent company" value={s.parentCompany} width="third" />
            <KV
              label="Writing company"
              value={s.writingCompany}
              width="third"
            />
            <KV label="Company type" value={s.companyType} width="third" />
            <KV
              label="Underwriter contact"
              value={s.underwriterContact}
              width="third"
            />
            <KV label="Division" value={s.division} width="third" />
            <KV label="Branch" value={s.branch} width="third" />
            <KV label="Department" value={s.department} width="third" />
            <KV label="Group" value={s.groupName} width="third" />
          </View>
        </Section>

        {/* Policy contacts */}
        {s.contacts.length > 0 && (
          <Section title={`Policy Contacts (${s.contacts.length})`}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                  Role
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "28%" }]}>
                  Name / Title
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "27%" }]}>
                  Contact
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "27%" }]}>
                  Address
                </Text>
              </View>
              {s.contacts.map((c, i) => {
                const isLast = i === s.contacts.length - 1;
                return (
                  <View
                    key={c.id}
                    style={isLast ? styles.tableRowLast : styles.tableRow}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "18%", textTransform: "capitalize" },
                      ]}
                    >
                      {c.role.replace("_", " ")}
                    </Text>
                    <Text style={[styles.tableCell, { width: "28%" }]}>
                      <Text style={{ fontWeight: 700 }}>{c.name || "—"}</Text>
                      {c.title ? `\n${c.title}` : ""}
                    </Text>
                    <Text style={[styles.tableCell, { width: "27%" }]}>
                      {c.email || "—"}
                      {c.phone ? `\n${c.phone}` : ""}
                    </Text>
                    <Text style={[styles.tableCell, { width: "27%" }]}>
                      {[c.addressLine1, c.city, c.state, c.zipCode]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {/* Current insurance */}
        {s.otherInsurance.length > 0 && (
          <Section title={`Current Insurance (${s.otherInsurance.length})`}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "26%" }]}>
                  Carrier
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "16%" }]}>
                  LOB
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                  Policy #
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                  Effective
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                  Expires
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: "16%", textAlign: "right" },
                  ]}
                >
                  Premium
                </Text>
              </View>
              {s.otherInsurance.map((o, i) => {
                const isLast = i === s.otherInsurance.length - 1;
                return (
                  <View
                    key={o.id}
                    style={isLast ? styles.tableRowLast : styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { width: "26%" }]}>
                      {o.carrierName || "—"}
                    </Text>
                    <Text style={[styles.tableCell, { width: "16%" }]}>
                      {o.lineOfBusiness || "—"}
                    </Text>
                    <Text style={[styles.tableCell, { width: "18%" }]}>
                      {o.policyNumber || "—"}
                    </Text>
                    <Text style={[styles.tableCell, { width: "12%" }]}>
                      {fmtDate(o.policyEffectiveDate)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "12%" }]}>
                      {fmtDate(o.policyExpirationDate)}
                    </Text>
                    <Text style={[styles.tableCellRight, { width: "16%" }]}>
                      {fmtMoney(o.premium)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {/* Loss history */}
        {s.lossHistory.length > 0 && (
          <Section title={`Loss History (${s.lossHistory.length})`}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                  Carrier
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                  Kind / Status
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "29%" }]}>
                  Description
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: "10%", textAlign: "right" },
                  ]}
                >
                  Loss
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    { width: "10%", textAlign: "right" },
                  ]}
                >
                  Paid
                </Text>
              </View>
              {s.lossHistory.map((l, i) => {
                const isLast = i === s.lossHistory.length - 1;
                return (
                  <View
                    key={l.id}
                    style={isLast ? styles.tableRowLast : styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { width: "13%" }]}>
                      {fmtDate(l.dateOfLoss)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "20%" }]}>
                      {l.carrierName || "—"}
                      {l.policyNumber ? `\n${l.policyNumber}` : ""}
                    </Text>
                    <Text style={[styles.tableCell, { width: "18%" }]}>
                      {l.kindOfLoss || "—"}
                      {l.claimStatus ? `\n${l.claimStatus}` : ""}
                    </Text>
                    <Text style={[styles.tableCell, { width: "29%" }]}>
                      {l.description || "—"}
                    </Text>
                    <Text style={[styles.tableCellRight, { width: "10%" }]}>
                      {fmtMoney(l.amountOfLoss)}
                    </Text>
                    <Text style={[styles.tableCellRight, { width: "10%" }]}>
                      {fmtMoney(l.amountPaid)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {/* Additional interests */}
        {s.additionalInterests.length > 0 && (
          <Section
            title={`Additional Interests (${s.additionalInterests.length})`}
          >
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                  Type
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>
                  Name
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "32%" }]}>
                  Address
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "16%" }]}>
                  Flags
                </Text>
              </View>
              {s.additionalInterests.map((a, i) => {
                const isLast = i === s.additionalInterests.length - 1;
                const flags = [
                  a.isBonded ? "Bonded" : null,
                  a.isLicensed ? "Licensed" : null,
                  a.certificateRequired ? "Cert req" : null,
                  a.certificateIssued ? "Cert iss" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <View
                    key={a.id}
                    style={isLast ? styles.tableRowLast : styles.tableRow}
                  >
                    <Text style={[styles.tableCell, { width: "22%" }]}>
                      {a.interestType || "—"}
                    </Text>
                    <Text style={[styles.tableCell, { width: "30%" }]}>
                      <Text style={{ fontWeight: 700 }}>
                        {a.name || "—"}
                      </Text>
                      {a.contactName ? `\n${a.contactName}` : ""}
                    </Text>
                    <Text style={[styles.tableCell, { width: "32%" }]}>
                      {[a.addressLine1, a.city, a.state, a.zipCode]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Text>
                    <Text style={[styles.tableCellMuted, { width: "16%" }]}>
                      {flags || "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {/* Locations + buildings */}
        {s.locations.length > 0 && (
          <Section title={`Locations & Buildings (${s.locations.length})`}>
            {s.locations.map((loc) => {
              const addr = [
                loc.addressLine1,
                loc.city,
                loc.state,
                loc.zipCode,
              ]
                .filter(Boolean)
                .join(", ");
              const totalValue = loc.buildings.reduce(
                (sum, b) => sum + Number(b.insurableValue ?? 0),
                0,
              );
              return (
                <View
                  key={loc.id}
                  style={{
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                  wrap={false}
                >
                  <View
                    style={{
                      backgroundColor: COLORS.primarySoft,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: COLORS.primaryDark,
                      }}
                    >
                      Location {loc.locationNumber} ·{" "}
                      {addr || "No address on file"}
                    </Text>
                    <Text style={{ fontSize: 8, color: COLORS.muted }}>
                      {loc.buildings.length} bldg ·{" "}
                      {fmtMoney(totalValue)} TIV
                    </Text>
                  </View>
                  {loc.buildings.length === 0 ? (
                    <Text
                      style={{
                        fontSize: 8.5,
                        color: COLORS.faint,
                        padding: 8,
                      }}
                    >
                      No buildings on this location.
                    </Text>
                  ) : (
                    loc.buildings.map((b, i) => (
                      <View
                        key={b.id}
                        style={{
                          flexDirection: "row",
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: COLORS.border,
                          padding: 6,
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            width: 30,
                            fontSize: 8,
                            fontWeight: 700,
                            color: COLORS.primaryDark,
                          }}
                        >
                          B{b.buildingNumber}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: 700 }}>
                            {b.name || `Building ${b.buildingNumber}`}
                          </Text>
                          <Text
                            style={{
                              fontSize: 7.5,
                              color: COLORS.muted,
                              marginTop: 1,
                            }}
                          >
                            {[
                              b.propertyUsage,
                              b.tenantType,
                              b.constructionType,
                              b.roofType,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 7.5,
                              color: COLORS.muted,
                              marginTop: 1,
                            }}
                          >
                            {[
                              b.yearBuilt
                                ? `Built ${b.yearBuilt}`
                                : null,
                              fmtNum(b.totalSqft) !== "—"
                                ? `${fmtNum(b.totalSqft)} sqft`
                                : null,
                              b.numStories
                                ? `${b.numStories} stories`
                                : null,
                              b.numUnits
                                ? `${b.numUnits} units`
                                : null,
                              b.sprinklered ? "Sprinklered" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              fontSize: 7,
                              color: COLORS.muted,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Insurable
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: COLORS.primaryDark,
                            }}
                          >
                            {fmtMoney(b.insurableValue)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </Section>
        )}

        {/* GL */}
        {s.glCoverage && (
          <Section title="General Liability Coverage">
            <View style={styles.kvGrid}>
              <KV
                label="Each occurrence"
                value={fmtLimit(s.glCoverage.eachOccurrenceLimit)}
              />
              <KV
                label="General aggregate"
                value={fmtLimit(s.glCoverage.generalAggregate)}
              />
              <KV
                label="Products & completed ops"
                value={fmtLimit(s.glCoverage.productsCompletedOpsAggregate)}
              />
              <KV
                label="Personal & advertising"
                value={fmtLimit(s.glCoverage.personalAdvertisingInjuryLimit)}
              />
              <KV
                label="Medical expense"
                value={fmtLimit(s.glCoverage.medicalExpense)}
              />
              <KV
                label="Damage to rented"
                value={fmtLimit(s.glCoverage.damageToRentedPremises)}
              />
              <KV
                label="Form"
                value={
                  s.glCoverage.formOfCoverage === "occurrence"
                    ? "Occurrence"
                    : "Claims-Made"
                }
              />
              <KV
                label="Basis"
                value={
                  s.glCoverage.aggregateBasis === "policy"
                    ? "Per Policy"
                    : s.glCoverage.aggregateBasis === "per_location"
                      ? "Per Location"
                      : "Per Project"
                }
              />
            </View>

            {s.glClassifications.length > 0 && (
              <View style={[styles.table, { marginTop: 6 }]}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: "8%" }]}>
                    Loc
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "16%" }]}>
                    Class
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
                  const loc = s.locations.find(
                    (l) => l.id === cls.locationId,
                  );
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
                          {
                            width: "16%",
                            fontWeight: 700,
                            color: COLORS.primaryDark,
                          },
                        ]}
                      >
                        {cls.classCode}
                      </Text>
                      <Text style={[styles.tableCell, { width: "56%" }]}>
                        {cls.description}
                      </Text>
                      <Text
                        style={[styles.tableCellRight, { width: "20%" }]}
                      >
                        {fmtNum(cls.exposure)} sqft
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Section>
        )}

        {/* Underwriting flags */}
        <Section title="Underwriting Flags">
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              { label: "Prior losses (5y)", on: s.hasPriorLosses5y },
              { label: "Bankruptcy (5y)", on: s.hasBankruptcy5y },
              {
                label: "Indictments / convictions",
                on: s.hasIndictmentsOrConvictions,
              },
              { label: "Civil judgments", on: s.hasCivilJudgments },
              {
                label: "Operates other businesses",
                on: s.operatesOtherBusinesses,
              },
              { label: "Online presence", on: s.hasOnlinePresence },
              {
                label: "12mo / no prior coverage",
                on: s.inBusiness12moNoPriorCoverage,
              },
              {
                label: "Signed lease w/ hold-harmless",
                on: s.requiresSignedLeaseWithHoldharmless,
              },
              {
                label: "COI from tenants",
                on: s.collectsCoiFromTenants,
              },
              {
                label: "Mold/asbestos prior claims",
                on: s.priorClaimsMoldOrAsbestos,
              },
            ]
              .filter((f) => f.on)
              .map((f) => (
                <Text key={f.label} style={styles.chip}>
                  {f.label}
                </Text>
              ))}
          </View>
          {![
            s.hasPriorLosses5y,
            s.hasBankruptcy5y,
            s.hasIndictmentsOrConvictions,
            s.hasCivilJudgments,
            s.operatesOtherBusinesses,
            s.hasOnlinePresence,
            s.inBusiness12moNoPriorCoverage,
            s.requiresSignedLeaseWithHoldharmless,
            s.collectsCoiFromTenants,
            s.priorClaimsMoldOrAsbestos,
          ].some(Boolean) && (
            <Text style={{ fontSize: 9, color: COLORS.faint }}>
              No flags set.
            </Text>
          )}
        </Section>

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
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 3,
      }}
    >
      <Text
        style={{
          fontSize: 7,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{ fontSize: 11, color: COLORS.primaryDark, fontWeight: 700 }}
      >
        {value || "—"}
      </Text>
    </View>
  );
}

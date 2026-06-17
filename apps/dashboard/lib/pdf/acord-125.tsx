import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  DocHeader,
  KV,
  PageFooter,
  Section,
  customerDisplay,
  fmtDate,
  fmtMoney,
  styles,
  type SubmissionForPdf,
} from "./shared";

export function Acord125Document({ s }: { s: SubmissionForPdf }) {
  return (
    <Document
      title={`Commercial Application — ${customerDisplay(s.customer)}`}
      author="insureinvestors"
    >
      <Page size="LETTER" style={styles.page}>
        <DocHeader
          kicker="Commercial Application (ACORD 125 equivalent)"
          title={customerDisplay(s.customer)}
          meta={[
            { label: "Submission", value: `#${s.uuid.slice(0, 8)}` },
            { label: "Status", value: s.status },
            { label: "Target effective", value: fmtDate(s.targetEffectiveDate) },
          ]}
        />

        <Section title="Named Insured">
          <View style={styles.kvGrid}>
            <KV label="Customer #" value={String(s.customer.id)} />
            <KV
              label="Business name"
              value={s.namedInsured || s.customer.businessName}
            />
            <KV label="DBA" value={s.customer.dba} />
            <KV label="Entity" value={s.customer.businessEntity} />
            <KV label="Federal ID" value={s.customer.federalId} />
            <KV label="NAICS" value={s.customer.naics} />
            <KV label="Email" value={s.customer.email} />
            <KV label="Phone" value={s.customer.phone} />
            <KV
              label="Mailing address"
              value={[s.customer.addressLine1, s.customer.addressLine2]
                .filter(Boolean)
                .join(", ")}
              width="full"
            />
            <KV
              label="City / State / Zip"
              value={[s.customer.city, s.customer.state, s.customer.zipCode]
                .filter(Boolean)
                .join(", ")}
              width="full"
            />
          </View>
        </Section>

        <Section title="Policy Terms">
          <View style={styles.kvGrid}>
            <KV label="Policy status" value={s.status} />
            <KV label="Lines of business" value={s.linesOfBusiness.join(", ")} />
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
            <KV label="Total payroll" value={fmtMoney(s.totalPayroll)} />
          </View>
        </Section>

        <Section title="Business Operations">
          <Text
            style={{
              fontSize: 9,
              color: s.businessDescription ? "#111827" : "#9CA3AF",
            }}
          >
            {s.businessDescription || "—"}
          </Text>
        </Section>

        <Section title="Prior Coverage">
          <View style={styles.kvGrid}>
            <KV
              label="Had prior coverage"
              value={s.hasPriorCoverage ? "Yes" : "No"}
            />
            <KV label="Prior carrier" value={s.priorCarrier} />
            <KV
              label="Prior expiration"
              value={fmtDate(s.priorExpirationDate)}
            />
            <KV
              label="Claims (5 years)"
              value={String(s.claimsInLast5Years)}
            />
          </View>
        </Section>

        <Section title="Service Group">
          <View style={styles.kvGrid}>
            <KV label="Account executive" value={s.accountExecutive} />
            <KV label="Account representative" value={s.accountRepresentative} />
            <KV label="Account broker" value={s.accountBroker} />
            <KV label="Account producer" value={s.accountProducer} />
            <KV label="Parent company" value={s.parentCompany} />
            <KV label="Writing company" value={s.writingCompany} />
            <KV label="Underwriter contact" value={s.underwriterContact} />
            <KV label="Department" value={s.department} />
          </View>
        </Section>

        <PageFooter submissionUuid={s.uuid} />
      </Page>
    </Document>
  );
}

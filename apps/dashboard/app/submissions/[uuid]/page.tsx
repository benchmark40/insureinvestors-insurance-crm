import { notFound } from "next/navigation";

import { getMortgageeByName } from "@insureinvestorsv2/lib/src/mortgagees";

import { PageShell } from "@/components/page-shell";
import { SubmissionHeader } from "@/components/submission-header";
import { CarriersTab } from "@/components/submission/carriers-tab";
import { DocumentsTab } from "@/components/submission/documents-tab";
import { GeneralTab } from "@/components/submission/general-tab";
import { GLTab } from "@/components/submission/gl-tab";
import { OverviewTab } from "@/components/submission/overview-tab";
import { PropertiesTab } from "@/components/submission/properties-tab";
import { SubmissionTabs } from "@/components/submission/submission-tabs";
import { UnderwritingTab } from "@/components/submission/underwriting-tab";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getSubmissionByUuid } from "@/lib/actions/submissions";
import { listProposals } from "@/lib/actions/proposals";

export const dynamic = "force-dynamic";

const SUBMISSION_TABS = [
  "overview",
  "general",
  "properties",
  "underwriting",
  "gl",
  "documents",
  "carriers",
] as const;

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { uuid } = await params;
  const { tab } = await searchParams;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();
  const proposals = await listProposals(uuid);

  const initialTab = SUBMISSION_TABS.includes(
    tab as (typeof SUBMISSION_TABS)[number],
  )
    ? (tab as string)
    : "overview";

  const customerName =
    submission.customer.businessName || submission.namedInsured || "Unnamed";

  // Normalize Prisma Decimals -> strings so we can pass to client components.
  const locations = submission.locations.map((loc) => ({
    id: loc.id,
    uuid: loc.uuid,
    locationNumber: loc.locationNumber,
    namedInsured: loc.namedInsured,
    addressLine1: loc.addressLine1,
    addressLine2: loc.addressLine2,
    city: loc.city,
    state: loc.state,
    zipCode: loc.zipCode,
    reapiPropertyId: loc.reapiPropertyId,
    mortgageeName: loc.mortgageeName,
    occupancyClass: loc.occupancyClass,
    commercialCookingExposure: loc.commercialCookingExposure,
    vacancyPresent: loc.vacancyPresent,
    demolitionPlanned: loc.demolitionPlanned,
    renovationDuringPolicyTerm: loc.renovationDuringPolicyTerm,
    nfpaNoncompliant: loc.nfpaNoncompliant,
    occupancyBelow60pct: loc.occupancyBelow60pct,
    tenantOwnedByApplicant: loc.tenantOwnedByApplicant,
    breachedBuildingCodes5y: loc.breachedBuildingCodes5y,
    hasHazardousChemicalsTenant: loc.hasHazardousChemicalsTenant,
    warehouseOtherThanGeneral: loc.warehouseOtherThanGeneral,
    warehouseOtherUseDescription: loc.warehouseOtherUseDescription,
    buildings: loc.buildings.map((b) => ({
      id: b.id,
      buildingNumber: b.buildingNumber,
      name: b.name,
      yearBuilt: b.yearBuilt,
      yearRenovated: b.yearRenovated,
      totalSqft: b.totalSqft,
      numStories: b.numStories,
      numUnits: b.numUnits,
      propertyType: b.propertyType,
      propertyUsage: b.propertyUsage,
      tenantType: b.tenantType,
      occupancyPercent: b.occupancyPercent
        ? b.occupancyPercent.toString()
        : null,
      constructionType: b.constructionType,
      roofType: b.roofType,
      roofCoveringType: b.roofCoveringType,
      roofCoveringYear: b.roofCoveringYear,
      electricalType: b.electricalType,
      electricalYear: b.electricalYear,
      plumbingType: b.plumbingType,
      plumbingYear: b.plumbingYear,
      hvacType: b.hvacType,
      hvacYear: b.hvacYear,
      sprinklered: b.sprinklered,
      sprinklerCoveragePct: b.sprinklerCoveragePct
        ? b.sprinklerCoveragePct.toString()
        : null,
      burglarAlarmType: b.burglarAlarmType,
      fireAlarmType: b.fireAlarmType,
      fireProtection: b.fireProtection,
      propertyCondition: b.propertyCondition,
      buildingExterior: b.buildingExterior,
      pool: b.pool,
      walkwaysDriveways: b.walkwaysDriveways,
      insurableValue: b.insurableValue ? b.insurableValue.toString() : null,
      replacementCost: b.replacementCost ? b.replacementCost.toString() : null,
      replacementPerSqft: b.replacementPerSqft
        ? b.replacementPerSqft.toString()
        : null,
      suggestedRent: b.suggestedRent ? b.suggestedRent.toString() : null,
      hazardKnobAndTubeWiring: b.hazardKnobAndTubeWiring,
      hazardFuses: b.hazardFuses,
      hazardFederalPacificPanel: b.hazardFederalPacificPanel,
      hazardZinscoPanel: b.hazardZinscoPanel,
      hazardPigtailWiring: b.hazardPigtailWiring,
      hazardAluminumWiring: b.hazardAluminumWiring,
      hazardPolybutylenePlumbing: b.hazardPolybutylenePlumbing,
      hazardSteelIronPlumbing: b.hazardSteelIronPlumbing,
      hazardEifsOver20pct: b.hazardEifsOver20pct,
      overThreeStories: b.overThreeStories,
      preExistingDamage: b.preExistingDamage,
      hazardNoCentralStationAlarm: b.hazardNoCentralStationAlarm,
      hazardSupplementalHeating: b.hazardSupplementalHeating,
    })),
  }));

  const buildingCount = locations.reduce(
    (n, l) => n + l.buildings.length,
    0,
  );
  const totalInsurableValue = locations
    .flatMap((l) => l.buildings)
    .reduce(
      (sum, b) => sum + (b.insurableValue ? Number(b.insurableValue) : 0),
      0,
    );

  return (
    <PageShell title="Submission">
      <SubmissionHeader
        uuid={submission.uuid}
        customerName={customerName}
        status={submission.status}
        createdAt={submission.createdAt}
        linesOfBusiness={(submission.linesOfBusiness as string[]) ?? []}
        locationCount={locations.length}
        buildingCount={buildingCount}
        quoteCount={submission.quotes.length}
        totalInsurableValue={totalInsurableValue}
        targetEffectiveDate={submission.targetEffectiveDate}
      />

      <SubmissionTabs initialTab={initialTab}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="properties">
            Properties ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="underwriting">Underwriting</TabsTrigger>
          <TabsTrigger value="gl">General Liability</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="carriers">
            Carriers ({submission.recipients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            submissionUuid={submission.uuid}
            customer={{
              id: submission.customer.id,
              uuid: submission.customer.uuid,
              businessName: submission.customer.businessName,
              dba: submission.customer.dba,
              firstName: submission.customer.firstName ?? "",
              lastName: submission.customer.lastName ?? "",
              email: submission.customer.email,
              phone: submission.customer.phone,
              city: submission.customer.city,
              state: submission.customer.state,
              zipCode: submission.customer.zipCode,
              naics: submission.customer.naics,
            }}
            submission={{
              status: submission.status,
              namedInsured: submission.namedInsured,
              targetEffectiveDate:
                submission.targetEffectiveDate?.toISOString() ?? null,
              targetExpirationDate:
                submission.targetExpirationDate?.toISOString() ?? null,
              linesOfBusiness:
                (submission.linesOfBusiness as string[]) ?? [],
              accountExecutive: submission.accountExecutive,
              accountRepresentative: submission.accountRepresentative,
              accountBroker: submission.accountBroker,
              accountProducer: submission.accountProducer,
              parentCompany: submission.parentCompany,
              writingCompany: submission.writingCompany,
              companyType: submission.companyType,
              underwriterContact: submission.underwriterContact,
              division: submission.division,
              branch: submission.branch,
              department: submission.department,
              groupName: submission.groupName,
              businessOrigin: submission.businessOrigin,
              leadSource: submission.leadSource,
            }}
          />
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <GeneralTab
            submissionUuid={submission.uuid}
            contacts={submission.contacts.map((c) => ({
              id: c.id,
              role: c.role,
              name: c.name,
              title: c.title,
              email: c.email,
              phone: c.phone,
              addressLine1: c.addressLine1,
              city: c.city,
              state: c.state,
              zipCode: c.zipCode,
              notes: c.notes,
            }))}
            otherInsurance={submission.otherInsurance.map((o) => ({
              id: o.id,
              carrierName: o.carrierName,
              lineOfBusiness: o.lineOfBusiness,
              policyNumber: o.policyNumber,
              planType: o.planType,
              policyEffectiveDate:
                o.policyEffectiveDate?.toISOString() ?? null,
              policyExpirationDate:
                o.policyExpirationDate?.toISOString() ?? null,
              premium: o.premium ? o.premium.toString() : null,
              notes: o.notes,
            }))}
            lossHistory={submission.lossHistory.map((l) => ({
              id: l.id,
              carrierName: l.carrierName,
              policyNumber: l.policyNumber,
              lineOfBusiness: l.lineOfBusiness,
              dateOfLoss: l.dateOfLoss?.toISOString() ?? null,
              reportedDate: l.reportedDate?.toISOString() ?? null,
              kindOfLoss: l.kindOfLoss,
              description: l.description,
              claimStatus: l.claimStatus,
              amountOfLoss: l.amountOfLoss ? l.amountOfLoss.toString() : null,
              amountPaid: l.amountPaid ? l.amountPaid.toString() : null,
              amountReserved: l.amountReserved
                ? l.amountReserved.toString()
                : null,
            }))}
            additionalInterests={submission.additionalInterests.map((a) => ({
              id: a.id,
              interestType: a.interestType,
              name: a.name,
              contactName: a.contactName,
              email: a.email,
              phone: a.phone,
              addressLine1: a.addressLine1,
              city: a.city,
              state: a.state,
              zipCode: a.zipCode,
              descriptionOfOperations: a.descriptionOfOperations,
              isBonded: a.isBonded,
              isLicensed: a.isLicensed,
              certificateRequired: a.certificateRequired,
              certificateIssued: a.certificateIssued,
              notes: a.notes,
            }))}
          />
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <PropertiesTab
            submissionUuid={submission.uuid}
            locations={locations.map((loc) => ({
              ...loc,
              mortgagee: getMortgageeByName(loc.mortgageeName),
            }))}
          />
        </TabsContent>

        <TabsContent value="carriers" className="mt-6">
          <CarriersTab
            submissionUuid={submission.uuid}
            customerName={customerName}
            recipients={submission.recipients.map((r) => ({
              id: r.id,
              status: r.status,
              sentAt: r.sentAt?.toISOString() ?? null,
              emailSubject: r.emailSubject,
              conversationId: r.conversationId,
              lastReplyAt: r.lastReplyAt?.toISOString() ?? null,
              replyCount: r.conversationId
                ? submission.emailResponses.filter(
                    (e) => e.conversationId === r.conversationId && !e.isFromUs,
                  ).length
                : 0,
              personnel: {
                id: r.personnel.id,
                firstName: r.personnel.firstName,
                lastName: r.personnel.lastName,
                email: r.personnel.email,
                title: r.personnel.title,
                carrier: {
                  id: r.personnel.carrier.id,
                  name: r.personnel.carrier.name,
                },
              },
            }))}
            quotes={submission.quotes.map((q) => ({
              id: q.id,
              status: q.status,
              quoteNumber: q.quoteNumber,
              premium: q.premium.toString(),
              policyFee: q.policyFee.toString(),
              otherFees: q.otherFees.toString(),
              taxes: q.taxes.toString(),
              commissionPct: q.commissionPct.toString(),
              commissionAmount: q.commissionAmount.toString(),
              effectiveDate: q.effectiveDate?.toISOString() ?? null,
              expirationDate: q.expirationDate?.toISOString() ?? null,
              receivedAt: q.receivedAt?.toISOString() ?? null,
              carrier: { id: q.carrier.id, name: q.carrier.name },
              recipientId: q.recipientId ?? null,
            }))}
            submissionStatus={submission.status}
            proposals={proposals}
            locations={submission.locations.map((loc) => ({
              id: loc.id,
              label: `Loc ${loc.locationNumber} — ${loc.addressLine1 || "(no address)"}, ${loc.city || ""} ${loc.state || ""}`.trim(),
              namedInsured: loc.namedInsured,
            }))}
            devMode={
              (process.env.DEV ?? "").trim().toLowerCase() === "true" ||
              (process.env.DEV ?? "").trim().toLowerCase() === "1" ||
              (process.env.DEV ?? "").trim().toLowerCase() === "yes"
            }
          />
        </TabsContent>

        <TabsContent value="underwriting" className="mt-6">
          <UnderwritingTab
            submissionUuid={submission.uuid}
            submission={{
              businessDescription: submission.businessDescription,
              additionalInsuredNames: submission.additionalInsuredNames,
              certificatesOfInsuranceNotes:
                submission.certificatesOfInsuranceNotes,
              hasPriorLosses5y: submission.hasPriorLosses5y,
              hasBankruptcy5y: submission.hasBankruptcy5y,
              hasIndictmentsOrConvictions:
                submission.hasIndictmentsOrConvictions,
              hasCivilJudgments: submission.hasCivilJudgments,
              operatesOtherBusinesses: submission.operatesOtherBusinesses,
              hasOnlinePresence: submission.hasOnlinePresence,
              inBusiness12moNoPriorCoverage:
                submission.inBusiness12moNoPriorCoverage,
              requiresSignedLeaseWithHoldharmless:
                submission.requiresSignedLeaseWithHoldharmless,
              collectsCoiFromTenants: submission.collectsCoiFromTenants,
              priorClaimsMoldOrAsbestos:
                submission.priorClaimsMoldOrAsbestos,
            }}
            locations={locations}
          />
        </TabsContent>

        <TabsContent value="gl" className="mt-6">
          <GLTab
            submissionUuid={submission.uuid}
            coverage={
              submission.glCoverage
                ? {
                    insuranceCarrier: submission.glCoverage.insuranceCarrier,
                    lineOfBusiness: submission.glCoverage.lineOfBusiness,
                    formOfCoverage: submission.glCoverage.formOfCoverage,
                    carrierParticipationPct:
                      submission.glCoverage.carrierParticipationPct.toString(),
                    eachOccurrenceLimit:
                      submission.glCoverage.eachOccurrenceLimit.toString(),
                    generalAggregate:
                      submission.glCoverage.generalAggregate.toString(),
                    productsCompletedOpsAggregate:
                      submission.glCoverage.productsCompletedOpsAggregate.toString(),
                    personalAdvertisingInjuryLimit:
                      submission.glCoverage.personalAdvertisingInjuryLimit.toString(),
                    medicalExpense:
                      submission.glCoverage.medicalExpense.toString(),
                    damageToRentedPremises:
                      submission.glCoverage.damageToRentedPremises.toString(),
                    aggregateBasis: submission.glCoverage.aggregateBasis,
                  }
                : null
            }
            classifications={submission.glClassifications.map((cls) => {
              const loc = submission.locations.find(
                (l) => l.id === cls.locationId,
              );
              const addrBits = loc
                ? [loc.addressLine1, loc.city, loc.state]
                    .filter(Boolean)
                    .join(", ")
                : "";
              return {
                id: cls.id,
                locationId: cls.locationId,
                locationNumber: loc?.locationNumber ?? 0,
                locationAddress: addrBits,
                classCode: cls.classCode,
                description: cls.description,
                exposure: cls.exposure.toString(),
              };
            })}
            optionalCoverages={submission.optionalCoverages.map((oc) => ({
              id: oc.id,
              name: oc.name,
              value:
                (oc.value as {
                  label?: string;
                  limit?: number | null;
                  type?: string | null;
                }) ?? {},
            }))}
            locations={submission.locations.map((loc) => {
              const totalSqft = loc.buildings.reduce(
                (s, b) => s + (b.totalSqft ?? 0),
                0,
              );
              return {
                id: loc.id,
                locationNumber: loc.locationNumber,
                address: loc.addressLine1,
                city: loc.city,
                state: loc.state,
                totalSqft,
              };
            })}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab
            submissionUuid={submission.uuid}
            documents={submission.documents.map((d) => {
              const u = d.uploadedBy;
              const uploadedByName = u
                ? u.name ||
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  null
                : null;
              return {
                id: d.id,
                filename: d.filename,
                mimeType: d.mimeType,
                sizeBytes: d.sizeBytes,
                uploadedAt: d.uploadedAt.toISOString(),
                uploadedByName,
              };
            })}
          />
        </TabsContent>
      </SubmissionTabs>
    </PageShell>
  );
}

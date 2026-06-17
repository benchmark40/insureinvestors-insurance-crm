import { db } from "@insureinvestorsv2/db";

import { type AuthContext } from "@/lib/require-auth";
import { type SubmissionForPdf } from "@/lib/pdf/shared";

/**
 * Load a submission with everything we need to render any of the four PDFs.
 * Broker-scoped: returns null if the submission doesn't belong to this broker.
 */
export async function loadSubmissionForPdf(
  ctx: AuthContext,
  submissionUuid: string,
): Promise<SubmissionForPdf | null> {
  const row = await db.submission.findFirst({
    where: { uuid: submissionUuid, customer: { brokerId: ctx.broker.id } },
    include: {
      customer: true,
      locations: {
        orderBy: { locationNumber: "asc" },
        include: { buildings: { orderBy: { buildingNumber: "asc" } } },
      },
      contacts: { orderBy: { id: "asc" } },
      otherInsurance: { orderBy: { id: "asc" } },
      lossHistory: { orderBy: { id: "asc" } },
      additionalInterests: { orderBy: { id: "asc" } },
      glCoverage: true,
      glClassifications: { orderBy: { id: "asc" } },
      optionalCoverages: { orderBy: { name: "asc" } },
    },
  });
  if (!row) return null;

  return {
    uuid: row.uuid,
    status: row.status,
    namedInsured: row.namedInsured,
    targetEffectiveDate: row.targetEffectiveDate,
    targetExpirationDate: row.targetExpirationDate,
    linesOfBusiness: (row.linesOfBusiness as string[]) ?? [],
    yearsInBusiness: row.yearsInBusiness,
    annualRevenue: row.annualRevenue ? row.annualRevenue.toString() : null,
    totalPayroll: row.totalPayroll ? row.totalPayroll.toString() : null,
    businessDescription: row.businessDescription,
    additionalInsuredNames: row.additionalInsuredNames,
    certificatesOfInsuranceNotes: row.certificatesOfInsuranceNotes,
    hasPriorCoverage: row.hasPriorCoverage,
    priorCarrier: row.priorCarrier,
    priorExpirationDate: row.priorExpirationDate,
    claimsInLast5Years: row.claimsInLast5Years,
    hasPriorLosses5y: row.hasPriorLosses5y,
    hasBankruptcy5y: row.hasBankruptcy5y,
    hasIndictmentsOrConvictions: row.hasIndictmentsOrConvictions,
    hasCivilJudgments: row.hasCivilJudgments,
    operatesOtherBusinesses: row.operatesOtherBusinesses,
    hasOnlinePresence: row.hasOnlinePresence,
    inBusiness12moNoPriorCoverage: row.inBusiness12moNoPriorCoverage,
    requiresSignedLeaseWithHoldharmless: row.requiresSignedLeaseWithHoldharmless,
    collectsCoiFromTenants: row.collectsCoiFromTenants,
    priorClaimsMoldOrAsbestos: row.priorClaimsMoldOrAsbestos,
    accountExecutive: row.accountExecutive,
    accountRepresentative: row.accountRepresentative,
    accountBroker: row.accountBroker,
    accountProducer: row.accountProducer,
    parentCompany: row.parentCompany,
    writingCompany: row.writingCompany,
    companyType: row.companyType,
    underwriterContact: row.underwriterContact,
    division: row.division,
    branch: row.branch,
    department: row.department,
    groupName: row.groupName,
    customer: {
      id: row.customer.id,
      businessName: row.customer.businessName,
      dba: row.customer.dba,
      businessEntity: row.customer.businessEntity,
      federalId: row.customer.federalId,
      naics: row.customer.naics,
      email: row.customer.email,
      phone: row.customer.phone,
      firstName: row.customer.firstName,
      lastName: row.customer.lastName,
      addressLine1: row.customer.addressLine1,
      addressLine2: row.customer.addressLine2,
      city: row.customer.city,
      state: row.customer.state,
      zipCode: row.customer.zipCode,
    },
    contacts: row.contacts.map((c) => ({
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
    })),
    otherInsurance: row.otherInsurance.map((o) => ({
      id: o.id,
      carrierName: o.carrierName,
      lineOfBusiness: o.lineOfBusiness,
      policyNumber: o.policyNumber,
      policyEffectiveDate: o.policyEffectiveDate,
      policyExpirationDate: o.policyExpirationDate,
      premium: o.premium ? o.premium.toString() : null,
    })),
    lossHistory: row.lossHistory.map((l) => ({
      id: l.id,
      carrierName: l.carrierName,
      policyNumber: l.policyNumber,
      lineOfBusiness: l.lineOfBusiness,
      dateOfLoss: l.dateOfLoss,
      kindOfLoss: l.kindOfLoss,
      description: l.description,
      claimStatus: l.claimStatus,
      amountOfLoss: l.amountOfLoss ? l.amountOfLoss.toString() : null,
      amountPaid: l.amountPaid ? l.amountPaid.toString() : null,
    })),
    additionalInterests: row.additionalInterests.map((a) => ({
      id: a.id,
      interestType: a.interestType,
      name: a.name,
      contactName: a.contactName,
      addressLine1: a.addressLine1,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      descriptionOfOperations: a.descriptionOfOperations,
      isBonded: a.isBonded,
      isLicensed: a.isLicensed,
      certificateRequired: a.certificateRequired,
      certificateIssued: a.certificateIssued,
    })),
    locations: row.locations.map((loc) => ({
      id: loc.id,
      locationNumber: loc.locationNumber,
      addressLine1: loc.addressLine1,
      addressLine2: loc.addressLine2,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      occupancyClass: loc.occupancyClass,
      buildings: loc.buildings.map((b) => ({
        id: b.id,
        buildingNumber: b.buildingNumber,
        name: b.name,
        yearBuilt: b.yearBuilt,
        totalSqft: b.totalSqft,
        numStories: b.numStories,
        numUnits: b.numUnits,
        propertyUsage: b.propertyUsage,
        tenantType: b.tenantType,
        constructionType: b.constructionType,
        roofType: b.roofType,
        roofCoveringType: b.roofCoveringType,
        electricalType: b.electricalType,
        plumbingType: b.plumbingType,
        hvacType: b.hvacType,
        sprinklered: b.sprinklered,
        insurableValue: b.insurableValue ? b.insurableValue.toString() : null,
        replacementCost: b.replacementCost ? b.replacementCost.toString() : null,
      })),
    })),
    glCoverage: row.glCoverage
      ? {
          insuranceCarrier: row.glCoverage.insuranceCarrier,
          lineOfBusiness: row.glCoverage.lineOfBusiness,
          formOfCoverage: row.glCoverage.formOfCoverage,
          carrierParticipationPct:
            row.glCoverage.carrierParticipationPct.toString(),
          eachOccurrenceLimit: row.glCoverage.eachOccurrenceLimit.toString(),
          generalAggregate: row.glCoverage.generalAggregate.toString(),
          productsCompletedOpsAggregate:
            row.glCoverage.productsCompletedOpsAggregate.toString(),
          personalAdvertisingInjuryLimit:
            row.glCoverage.personalAdvertisingInjuryLimit.toString(),
          medicalExpense: row.glCoverage.medicalExpense.toString(),
          damageToRentedPremises:
            row.glCoverage.damageToRentedPremises.toString(),
          aggregateBasis: row.glCoverage.aggregateBasis,
        }
      : null,
    glClassifications: row.glClassifications.map((c) => ({
      id: c.id,
      locationId: c.locationId,
      classCode: c.classCode,
      description: c.description,
      exposure: c.exposure.toString(),
    })),
    optionalCoverages: row.optionalCoverages.map((oc) => ({
      id: oc.id,
      name: oc.name,
      value:
        (oc.value as {
          label?: string;
          limit?: number | null;
          type?: string | null;
        }) ?? {},
    })),
  };
}

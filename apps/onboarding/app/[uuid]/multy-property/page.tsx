import { notFound } from "next/navigation";

import { getMortgageeByName } from "@insureinvestorsv2/lib/src/mortgagees";

import { PropertiesSection } from "@/components/forms/properties-section";
import { StepIndicator } from "@/components/step-indicator";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

export default async function MultyPropertyPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  // Normalize Prisma Decimal -> string for client serialization.
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
    mortgagee: getMortgageeByName(loc.mortgageeName),
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
      occupancyPercent: b.occupancyPercent ? b.occupancyPercent.toString() : null,
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
    })),
  }));

  return (
    <>
      <StepIndicator current="multy-property" />
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Add your properties
          </h1>
          <p className="text-muted-foreground mt-2">
            Each property can have one or more buildings. We use the building
            details to underwrite and price the policy.
          </p>
        </div>
        <PropertiesSection submissionUuid={submission.uuid} locations={locations} />
      </main>
    </>
  );
}

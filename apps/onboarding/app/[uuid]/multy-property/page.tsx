import { notFound } from "next/navigation";

import { PropertiesList } from "@/components/portfolio/properties-list";
import {
  locationToProperty,
  type SerializedLocation,
} from "@/components/portfolio/property";
import { PortfolioShell } from "@/components/portfolio/shell";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

const dec = (v: { toString(): string } | null | undefined): string | null =>
  v == null ? null : v.toString();

export default async function MultyPropertyPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  const properties = submission.locations
    .map((loc): SerializedLocation => ({
      id: loc.id,
      uuid: loc.uuid,
      locationNumber: loc.locationNumber,
      namedInsured: loc.namedInsured,
      addressLine1: loc.addressLine1,
      addressLine2: loc.addressLine2,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      county: loc.county,
      reapiPropertyId: loc.reapiPropertyId,
      mortgageeName: loc.mortgageeName,
      occupancy: loc.occupancy,
      marketValue: dec(loc.marketValue),
      landValue: dec(loc.landValue),
      estimatedEquity: dec(loc.estimatedEquity),
      mortgageBalance: dec(loc.mortgageBalance),
      buildings: loc.buildings.map((b) => ({
        id: b.id,
        buildingNumber: b.buildingNumber,
        propertyType: b.propertyType,
        propertyUsage: b.propertyUsage,
        tenantType: b.tenantType,
        constructionType: b.constructionType,
        roofType: b.roofType,
        roofCoveringType: b.roofCoveringType,
        buildingExterior: b.buildingExterior,
        propertyCondition: b.propertyCondition,
        walkwaysDriveways: b.walkwaysDriveways,
        fireProtection: b.fireProtection,
        electricalType: b.electricalType,
        plumbingType: b.plumbingType,
        hvacType: b.hvacType,
        fireAlarmType: b.fireAlarmType,
        occupancyPercent: dec(b.occupancyPercent),
        numUnits: b.numUnits,
        numStories: b.numStories,
        totalSqft: b.totalSqft,
        yearBuilt: b.yearBuilt,
        insurableValue: dec(b.insurableValue),
        suggestedRent: dec(b.suggestedRent),
        pool: b.pool,
        sprinklered: b.sprinklered,
      })),
    }))
    .map(locationToProperty);

  return (
    <PortfolioShell wide startOver>
      <PropertiesList
        submissionUuid={submission.uuid}
        initialProperties={properties}
      />
    </PortfolioShell>
  );
}

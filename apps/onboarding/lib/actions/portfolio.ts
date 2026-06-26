"use server";

/**
 * Portfolio-quote intake actions. Thin composition over the existing Location /
 * Building tables and the shared RealEstateAPI enrichment, returning fully
 * serialized property records (Prisma Decimals → strings) so the address-first
 * intake drawer can read new building ids back immediately without waiting on a
 * route revalidation. One design "property" === one Location + one Building.
 */

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  enrichAddress as enrichAddressShared,
  type AddressSuggestion,
} from "@insureinvestorsv2/lib/src/addresses";
import { BuildingPatchSchema } from "@insureinvestorsv2/lib/src/schemas/building";
import { LocationPatchSchema } from "@insureinvestorsv2/lib/src/schemas/location";

import type {
  PortfolioProperty,
  SerializedLocation,
} from "@/components/portfolio/property";
import { locationToProperty } from "@/components/portfolio/property";

const LOCATION_SELECT = {
  id: true,
  uuid: true,
  locationNumber: true,
  namedInsured: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  zipCode: true,
  county: true,
  reapiPropertyId: true,
  mortgageeName: true,
  occupancy: true,
  marketValue: true,
  landValue: true,
  estimatedEquity: true,
  mortgageBalance: true,
  buildings: {
    orderBy: { buildingNumber: "asc" as const },
    select: {
      id: true,
      buildingNumber: true,
      propertyType: true,
      propertyUsage: true,
      tenantType: true,
      constructionType: true,
      roofType: true,
      roofCoveringType: true,
      buildingExterior: true,
      propertyCondition: true,
      walkwaysDriveways: true,
      fireProtection: true,
      electricalType: true,
      plumbingType: true,
      hvacType: true,
      fireAlarmType: true,
      occupancyPercent: true,
      numUnits: true,
      numStories: true,
      totalSqft: true,
      yearBuilt: true,
      insurableValue: true,
      suggestedRent: true,
      pool: true,
      sprinklered: true,
    },
  },
};

type RawLocation = {
  id: number;
  uuid: string;
  locationNumber: number;
  namedInsured: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  reapiPropertyId: string;
  mortgageeName: string;
  occupancy: string;
  marketValue: { toString(): string } | null;
  landValue: { toString(): string } | null;
  estimatedEquity: { toString(): string } | null;
  mortgageBalance: { toString(): string } | null;
  buildings: Array<{
    id: number;
    buildingNumber: number;
    propertyType: string;
    propertyUsage: string;
    tenantType: string;
    constructionType: string;
    roofType: string;
    roofCoveringType: string;
    buildingExterior: string;
    propertyCondition: string;
    walkwaysDriveways: string;
    fireProtection: string;
    electricalType: string;
    plumbingType: string;
    hvacType: string;
    fireAlarmType: string;
    occupancyPercent: { toString(): string } | null;
    numUnits: number | null;
    numStories: number | null;
    totalSqft: number | null;
    yearBuilt: number | null;
    insurableValue: { toString(): string } | null;
    suggestedRent: { toString(): string } | null;
    pool: boolean;
    sprinklered: boolean;
  }>;
};

const dec = (v: { toString(): string } | null): string | null =>
  v == null ? null : v.toString();

function serialize(loc: RawLocation): SerializedLocation {
  return {
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
  };
}

async function loadRaw(locationUuid: string): Promise<RawLocation | null> {
  return (await db.location.findUnique({
    where: { uuid: locationUuid },
    select: LOCATION_SELECT,
  })) as RawLocation | null;
}

function revalidate(submissionUuid?: string) {
  if (submissionUuid) revalidatePath(`/${submissionUuid}/multy-property`);
}

/** Create a fresh empty property (Location) on a submission. */
export async function addProperty(
  submissionUuid: string,
): Promise<PortfolioProperty> {
  const submission = await db.submission.findUnique({
    where: { uuid: submissionUuid },
    select: { id: true, _count: { select: { locations: true } } },
  });
  if (!submission) throw new Error("Submission not found");

  const created = await db.location.create({
    data: {
      submissionId: submission.id,
      locationNumber: submission._count.locations + 1,
    },
    select: { uuid: true },
  });
  revalidate(submissionUuid);
  const raw = await loadRaw(created.uuid);
  return locationToProperty(serialize(raw!));
}

/** Ensure the property has exactly one building row; returns its id. */
async function ensureBuilding(locationId: number): Promise<number> {
  const existing = await db.building.findFirst({
    where: { locationId },
    orderBy: { buildingNumber: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await db.building.create({
    data: { locationId, buildingNumber: 1 },
    select: { id: true },
  });
  return created.id;
}

/**
 * Address-first confirm: enrich the picked address, persist the address +
 * site-level facts on the Location, and pre-fill the single Building from the
 * property record (only filling empties — never clobbering manual edits).
 */
export async function confirmPropertyAddress(
  locationUuid: string,
  picked: AddressSuggestion,
  submissionUuid?: string,
): Promise<PortfolioProperty | null> {
  const loc = await db.location.findUnique({
    where: { uuid: locationUuid },
    select: { id: true },
  });
  if (!loc) return null;

  const enriched = await enrichAddressShared(picked).catch(() => null);
  const addr = enriched?.address;

  await db.location.update({
    where: { uuid: locationUuid },
    data: {
      addressLine1: addr?.addressLine1 ?? picked.addressLine1,
      city: addr?.city ?? picked.city,
      state: (addr?.state ?? picked.state ?? "").slice(0, 2),
      zipCode: addr?.zipCode ?? picked.zipCode,
      county: addr?.county ?? picked.county,
      latitude: addr?.latitude ?? picked.latitude ?? null,
      longitude: addr?.longitude ?? picked.longitude ?? null,
      reapiPropertyId: enriched?.propertyId ?? picked.propertyId ?? "",
      marketValue: enriched?.location.marketValue ?? null,
      landValue: enriched?.location.landValue ?? null,
      estimatedEquity: enriched?.location.estimatedEquity ?? null,
      mortgageBalance: enriched?.location.mortgageBalance ?? null,
    },
  });

  const buildingId = await ensureBuilding(loc.id);
  if (enriched?.building) {
    const b = enriched.building;
    // Only fill columns that are still empty/zero so we never wipe edits.
    const current = await db.building.findUnique({
      where: { id: buildingId },
      select: {
        propertyType: true,
        propertyUsage: true,
        constructionType: true,
        roofType: true,
        propertyCondition: true,
        hvacType: true,
        yearBuilt: true,
        totalSqft: true,
        numStories: true,
        numUnits: true,
      },
    });
    await db.building.update({
      where: { id: buildingId },
      data: {
        propertyType: current?.propertyType || b.propertyType,
        propertyUsage: current?.propertyUsage || b.propertyUsage,
        constructionType: current?.constructionType || b.constructionType,
        roofType: current?.roofType || b.roofType,
        propertyCondition: current?.propertyCondition || b.propertyCondition,
        hvacType: current?.hvacType || b.hvacType,
        yearBuilt: current?.yearBuilt ?? b.yearBuilt,
        totalSqft: current?.totalSqft ?? b.totalSqft,
        numStories: current?.numStories ?? b.numStories,
        numUnits: current?.numUnits ?? b.numUnits,
        suggestedRent: b.suggestedRent ?? undefined,
        replacementPerSqft: b.replacementPerSqft ?? undefined,
        pool: b.pool || undefined,
        sprinklered: b.sprinklered || undefined,
      },
    });
  }

  revalidate(submissionUuid);
  const raw = await loadRaw(locationUuid);
  return raw ? locationToProperty(serialize(raw)) : null;
}

/** Persist the Location + single Building patches from the intake form. */
export async function savePropertyDetails(
  locationUuid: string,
  locationPatch: unknown,
  buildingPatch: unknown,
  submissionUuid?: string,
): Promise<PortfolioProperty | null> {
  const loc = await db.location.findUnique({
    where: { uuid: locationUuid },
    select: { id: true },
  });
  if (!loc) return null;

  const locData = LocationPatchSchema.parse(locationPatch);
  // submissionId / policyId are server-managed — never accept them from a patch.
  delete (locData as Record<string, unknown>).submissionId;
  delete (locData as Record<string, unknown>).policyId;
  await db.location.update({ where: { uuid: locationUuid }, data: locData });

  const buildingId = await ensureBuilding(loc.id);
  const bldData = BuildingPatchSchema.parse(buildingPatch);
  delete (bldData as Record<string, unknown>).locationId;
  await db.building.update({ where: { id: buildingId }, data: bldData });

  revalidate(submissionUuid);
  const raw = await loadRaw(locationUuid);
  return raw ? locationToProperty(serialize(raw)) : null;
}

/** Remove a property (Location + its buildings cascade). */
export async function removeProperty(
  locationUuid: string,
  submissionUuid?: string,
): Promise<void> {
  await db.location.delete({ where: { uuid: locationUuid } });
  revalidate(submissionUuid);
}

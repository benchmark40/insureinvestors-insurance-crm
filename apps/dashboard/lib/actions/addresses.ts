"use server";

/**
 * Address autocomplete + property enrichment for the underwriter dashboard.
 * Thin server wrappers over the shared RealEstateAPI logic in
 * @insureinvestorsv2/lib (the same code that drives the client onboarding flow),
 * with the dashboard's auth/ownership guards applied.
 */

import { db } from "@insureinvestorsv2/db";
import {
  enrichAddress as enrichAddressShared,
  enrichBuildingFromPropertyId,
  searchAddresses as searchAddressesShared,
  type AddressSuggestion,
  type EnrichedBuilding,
  type EnrichedProperty,
} from "@insureinvestorsv2/lib/src/addresses";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedLocation } from "@/lib/scope";

export type { AddressSuggestion, EnrichedBuilding, EnrichedProperty };

export async function searchAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  await requireAuth();
  return searchAddressesShared(query);
}

export async function enrichAddress(
  picked: AddressSuggestion,
): Promise<EnrichedProperty | null> {
  await requireAuth();
  return enrichAddressShared(picked);
}

export async function enrichBuildingFromLocation(
  locationUuid: string,
): Promise<EnrichedBuilding | null> {
  const ctx = await requireAuth();
  const location = await assertOwnedLocation(ctx, locationUuid);
  const row = await db.location.findUnique({
    where: { id: location.id },
    select: { reapiPropertyId: true },
  });
  return enrichBuildingFromPropertyId(row?.reapiPropertyId);
}

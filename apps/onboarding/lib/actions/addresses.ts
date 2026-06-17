"use server";

/**
 * Address autocomplete + property enrichment. Thin server wrappers over the
 * shared RealEstateAPI logic in @insureinvestorsv2/lib so the dashboard and the
 * client onboarding flow stay in lockstep. Only enrichBuildingFromLocation
 * touches the DB (to resolve the cached RealEstateAPI property id).
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

export type { AddressSuggestion, EnrichedBuilding, EnrichedProperty };

export async function searchAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  return searchAddressesShared(query);
}

export async function enrichAddress(
  picked: AddressSuggestion,
): Promise<EnrichedProperty | null> {
  return enrichAddressShared(picked);
}

export async function enrichBuildingFromLocation(
  locationUuid: string,
): Promise<EnrichedBuilding | null> {
  const location = await db.location.findUnique({
    where: { uuid: locationUuid },
    select: { reapiPropertyId: true },
  });
  return enrichBuildingFromPropertyId(location?.reapiPropertyId);
}

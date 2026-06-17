/**
 * Thin wrapper around RealEstateAPI (realestateapi.com), ported from the legacy
 * onboarding_app. Three endpoints drive the property intake flow:
 *
 *   AutoComplete   — typeahead address suggestions as the user types
 *   PropertySearch — resolve a picked suggestion to a single property `id`
 *   PropertyDetail — pull full property facts for that `id`
 *
 * The API key is read from REALESTATE_API_KEY (never hardcode it). When the key
 * is absent every call returns null/[] so callers can degrade gracefully
 * (addresses.ts falls back to free OpenStreetMap autocomplete).
 *
 * Auth header is `X-Api-Key` (case matters on their side).
 */

import { mapPropertyUse } from "./building-options";

export { mapPropertyUse };

const BASE = process.env.REALESTATE_API_URL ?? "https://api.realestateapi.com/v2";

export function realEstateConfigured(): boolean {
  return Boolean(process.env.REALESTATE_API_KEY);
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const key = process.env.REALESTATE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "X-Api-Key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      // Address data is volatile per keystroke; don't cache autocomplete.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Raw AutoComplete suggestion shape (address search, search_types: ["A"]). */
export type ReAutoHit = {
  id?: string;
  title?: string;
  address?: string;
  street?: string;
  house?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
};

export async function reAutocomplete(search: string): Promise<ReAutoHit[]> {
  const json = await post<{ data?: ReAutoHit[] }>("/AutoComplete", {
    search,
    search_types: ["A"],
  });
  return json?.data ?? [];
}

/** Minimal slice of the PropertySearch result we rely on. */
export type RePropertyHit = {
  id?: string;
  latitude?: number;
  longitude?: number;
  propertyUse?: string;
  propertyType?: string;
  address?: {
    address?: string;
    house?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
};

export async function rePropertySearch(addr: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  house?: string;
  address?: string;
}): Promise<RePropertyHit | null> {
  const json = await post<{ data?: RePropertyHit[] }>("/PropertySearch", {
    ...addr,
    size: 1,
  });
  return json?.data?.[0] ?? null;
}

/** The corner of PropertyDetail we map into location + building fields. */
export type RePropertyDetail = {
  propertyType?: string;
  floodZoneType?: string;
  pricePerSquareFoot?: number;
  estimatedMortgageBalance?: number;
  estimatedEquity?: number;
  propertyInfo?: {
    propertyUse?: string;
    yearBuilt?: number;
    yearRenovated?: number;
    stories?: number;
    unitsCount?: number;
    construction?: string;
    roofConstruction?: string;
    buildingSquareFeet?: number;
    lotSquareFeet?: number;
    pool?: boolean;
    safetyFireSprinklers?: boolean;
    buildingCondition?: string;
    airConditioningType?: string;
    pricePerSquareFoot?: number;
  };
  taxInfo?: {
    marketValue?: number;
    marketLandValue?: number;
  };
  demographics?: {
    suggestedRent?: number;
    medianIncome?: number;
  };
};

export async function rePropertyDetail(
  id: string,
): Promise<RePropertyDetail | null> {
  const json = await post<{ data?: RePropertyDetail }>("/PropertyDetail", {
    id,
  });
  return json?.data ?? null;
}

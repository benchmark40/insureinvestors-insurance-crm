/**
 * Address autocomplete + property enrichment (pure logic, no DB / no auth).
 *
 * Primary provider is RealEstateAPI (see realestate.ts), ported from the legacy
 * onboarding_app: AutoComplete for typeahead, then PropertySearch +
 * PropertyDetail on pick to pre-fill as much of the property/building as we can.
 *
 * When REALESTATE_API_KEY is not set we fall back to free OpenStreetMap
 * Nominatim for plain address autocomplete (no enrichment) so the form still
 * works in dev. Nominatim results are © OpenStreetMap contributors.
 *
 * Server-only module: import from a "use server" action (each app wraps these
 * with its own auth model), never from a client component.
 */

import {
  mapPropertyUse,
  reAutocomplete,
  realEstateConfigured,
  rePropertyDetail,
  rePropertySearch,
  type RePropertyDetail,
} from "./realestate";

export type AddressSuggestion = {
  displayName: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  // RealEstateAPI lookup keys — empty when the suggestion came from Nominatim.
  propertyId: string;
  house: string;
  street: string;
};

export async function searchAddresses(
  query: string,
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 4) return [];

  if (realEstateConfigured()) {
    const hits = await reAutocomplete(q);
    return hits.map((h) => {
      const line1 =
        h.address ?? [h.house, h.street].filter(Boolean).join(" ").trim();
      return {
        displayName: h.title ?? line1,
        addressLine1: line1,
        city: h.city ?? "",
        state: (h.state ?? "").slice(0, 2).toUpperCase(),
        zipCode: h.zip ?? "",
        county: h.county ?? "",
        latitude: Number(h.latitude ?? 0),
        longitude: Number(h.longitude ?? 0),
        propertyId: h.id ?? "",
        house: h.house ?? "",
        street: h.street ?? "",
      };
    });
  }

  return nominatimSearch(q);
}

/** Building fields we can pre-fill from a RealEstateAPI PropertyDetail record. */
export type EnrichedBuilding = {
  yearBuilt: number | null;
  yearRenovated: number | null;
  totalSqft: number | null;
  numStories: number | null;
  numUnits: number | null;
  propertyType: string;
  propertyUsage: string;
  constructionType: string;
  roofType: string;
  pool: boolean;
  sprinklered: boolean;
  suggestedRent: number | null;
  replacementPerSqft: number | null;
  propertyCondition: string;
  hvacType: string;
};

export type EnrichedProperty = {
  /** RealEstateAPI property id — persist on the Location to enrich more buildings. */
  propertyId: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    latitude: number | null;
    longitude: number | null;
  };
  location: {
    marketValue: number | null;
    landValue: number | null;
    estimatedEquity: number | null;
    mortgageBalance: number | null;
  };
  building: EnrichedBuilding;
};

/** Our condition options; map RealEstateAPI buildingCondition onto them. */
const CONDITION_MAP: Record<string, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};
/** Conservative AC-type → our HVAC options. Only the unambiguous cases. */
const HVAC_MAP: Record<string, string> = {
  CENTRAL: "Central Air",
  "WINDOW A/C": "Window Units",
};

/** Map a PropertyDetail record onto the building fields we pre-fill. Shared by
 *  the address-pick path and the "add another building" path. */
function mapDetailToBuilding(detail: RePropertyDetail): EnrichedBuilding {
  const info = detail.propertyInfo ?? {};
  const demo = detail.demographics ?? {};
  const { propertyUsage, propertyType } = mapPropertyUse(
    info.propertyUse ?? detail.propertyType,
  );
  return {
    yearBuilt: pos(info.yearBuilt),
    yearRenovated: pos(info.yearRenovated),
    totalSqft: pos(info.buildingSquareFeet),
    numStories: pos(info.stories),
    numUnits: pos(info.unitsCount),
    propertyType,
    propertyUsage,
    constructionType: info.construction ?? "",
    roofType: info.roofConstruction ?? "",
    pool: Boolean(info.pool),
    sprinklered: Boolean(info.safetyFireSprinklers),
    suggestedRent: pos(demo.suggestedRent),
    // pricePerSquareFoot is nested under propertyInfo in the live API; the
    // root-level field is a fallback in case the shape ever changes.
    replacementPerSqft: pos(info.pricePerSquareFoot ?? detail.pricePerSquareFoot),
    propertyCondition: CONDITION_MAP[(info.buildingCondition ?? "").toUpperCase()] ?? "",
    hvacType: HVAC_MAP[(info.airConditioningType ?? "").toUpperCase()] ?? "",
  };
}

/**
 * Resolve a picked suggestion to full property facts via PropertySearch +
 * PropertyDetail. Returns null when enrichment is unavailable (no API key, or
 * the address didn't resolve to a known property).
 */
export async function enrichAddress(
  picked: AddressSuggestion,
): Promise<EnrichedProperty | null> {
  if (!realEstateConfigured()) return null;

  // Prefer the property id we already have from AutoComplete; otherwise resolve
  // it through PropertySearch.
  let hit = null as Awaited<ReturnType<typeof rePropertySearch>>;
  let propertyId = picked.propertyId;

  if (!propertyId) {
    hit = await rePropertySearch({
      street: picked.street || picked.addressLine1,
      house: picked.house,
      city: picked.city,
      state: picked.state,
      zip: picked.zipCode,
      address: picked.addressLine1,
    });
    propertyId = hit?.id ?? "";
  }

  if (!propertyId) return null;
  const detail = await rePropertyDetail(propertyId);
  if (!detail) return null;

  const tax = detail.taxInfo ?? {};
  const addr = hit?.address ?? {};

  return {
    propertyId,
    address: {
      addressLine1: addr.address || picked.addressLine1,
      city: addr.city || picked.city,
      state: (addr.state || picked.state).slice(0, 2).toUpperCase(),
      zipCode: addr.zip || picked.zipCode,
      county: addr.county || picked.county,
      latitude: num(hit?.latitude) ?? nz(picked.latitude),
      longitude: num(hit?.longitude) ?? nz(picked.longitude),
    },
    location: {
      marketValue: pos(tax.marketValue),
      landValue: pos(tax.marketLandValue),
      estimatedEquity: pos(detail.estimatedEquity),
      mortgageBalance: pos(detail.estimatedMortgageBalance),
    },
    building: mapDetailToBuilding(detail),
  };
}

/**
 * Re-derive building pre-fill data from a RealEstateAPI property id (cached on
 * the Location when the address was picked). Used when adding more buildings
 * after a page reload. Returns null when enrichment is unavailable.
 */
export async function enrichBuildingFromPropertyId(
  propertyId: string | null | undefined,
): Promise<EnrichedBuilding | null> {
  if (!realEstateConfigured() || !propertyId) return null;
  const detail = await rePropertyDetail(propertyId);
  if (!detail) return null;
  return mapDetailToBuilding(detail);
}

/** Coerce to a finite number or null. */
function num(x: unknown): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
/** Like num(), but treat 0 / negatives as "no data" (null). */
function pos(x: unknown): number | null {
  const n = num(x);
  return n && n > 0 ? n : null;
}
/** Non-zero passthrough for coordinates we already hold. */
function nz(x: number): number | null {
  return x ? x : null;
}

// --------------------------------------------------------------------------
// Nominatim fallback (free, US-only, no API key). Address autocomplete only —
// no property enrichment.
// --------------------------------------------------------------------------

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

type NominatimHit = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
    postcode?: string;
    county?: string;
  };
};

const STATE_ABBREV: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY",
};

function toStateAbbrev(full: string | undefined, iso: string | undefined) {
  if (iso && iso.startsWith("US-")) return iso.slice(3);
  if (!full) return "";
  return STATE_ABBREV[full] ?? "";
}

async function nominatimSearch(q: string): Promise<AddressSuggestion[]> {
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=5&countrycodes=us`;
  let raw: NominatimHit[] = [];
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "insureinvestorsv2/0.1 (alberto@insurecert.com)",
        Accept: "application/json",
      },
    });
    if (!resp.ok) return [];
    raw = (await resp.json()) as NominatimHit[];
  } catch {
    return [];
  }

  return raw.map((hit) => {
    const a = hit.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    return {
      displayName: hit.display_name,
      addressLine1: street,
      city: a.city ?? a.town ?? a.village ?? "",
      state: toStateAbbrev(a.state, a["ISO3166-2-lvl4"]),
      zipCode: a.postcode ?? "",
      county: a.county ?? "",
      latitude: Number(hit.lat),
      longitude: Number(hit.lon),
      propertyId: "",
      house: a.house_number ?? "",
      street: a.road ?? "",
    };
  });
}

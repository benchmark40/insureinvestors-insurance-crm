/**
 * Bridges the flat design "property" (one address, one set of fields) to the
 * Location + Building records the backend stores. One design property === one
 * Location with a single Building.
 */

import type { BuildingPatch } from "@insureinvestorsv2/lib/src/schemas/building";
import type { LocationPatch } from "@insureinvestorsv2/lib/src/schemas/location";

import type { PropertyValues } from "./schema";

export type SerializedBuilding = {
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
  occupancyPercent: string | null;
  numUnits: number | null;
  numStories: number | null;
  totalSqft: number | null;
  yearBuilt: number | null;
  insurableValue: string | null;
  suggestedRent: string | null;
  pool: boolean;
  sprinklered: boolean;
};

export type SerializedLocation = {
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
  marketValue: string | null;
  landValue: string | null;
  estimatedEquity: string | null;
  mortgageBalance: string | null;
  buildings: SerializedBuilding[];
};

export type PortfolioProperty = {
  /** Location uuid — the stable id for this property. */
  uuid: string;
  locationNumber: number;
  /** First building's numeric id (null only before the building row exists). */
  buildingId: number | null;
  address: string;
  line1: string;
  city: string;
  region: string;
  county: string;
  reapiPropertyId: string;
  marketValue: string | null;
  landValue: string | null;
  estimatedEquity: string | null;
  mortgageBalance: string | null;
  confirmed: boolean;
  values: PropertyValues;
};

const s = (v: unknown) => (v == null ? "" : String(v));

export function locationToProperty(loc: SerializedLocation): PortfolioProperty {
  const b = loc.buildings[0];
  const values: PropertyValues = {
    owner: loc.namedInsured,
    mortgage: loc.mortgageeName,
    occupancy: loc.occupancy,
    occupancyPct: s(b?.occupancyPercent),
    propType: s(b?.propertyType),
    propUse: s(b?.propertyUsage),
    units: s(b?.numUnits),
    stories: s(b?.numStories),
    tiv: s(b?.insurableValue),
    lossRents: s(b?.suggestedRent),
    yearBuilt: s(b?.yearBuilt),
    construction: s(b?.constructionType),
    roofShape: s(b?.roofType),
    roofMaterial: s(b?.roofCoveringType),
    bldgSqft: s(b?.totalSqft),
    pool: b?.pool ? "Yes" : b ? "No" : "",
    condition: s(b?.propertyCondition),
    plumbing: s(b?.plumbingType),
    wiring: s(b?.electricalType),
    hvac: s(b?.hvacType),
    exterior: s(b?.buildingExterior),
    walkways: s(b?.walkwaysDriveways),
    fireProtection: s(b?.fireProtection),
    sprinklered: b?.sprinklered ? "Yes" : b ? "No" : "",
    fireAlarm: s(b?.fireAlarmType),
    tenantType: s(b?.tenantType),
  };
  const line1 = loc.addressLine1;
  const region = [loc.state, loc.zipCode].filter(Boolean).join(" ");
  // "Confirmed" once we have an address + at least the auto-filled basics.
  const confirmed = Boolean(loc.addressLine1 && b);
  return {
    uuid: loc.uuid,
    locationNumber: loc.locationNumber,
    buildingId: b?.id ?? null,
    address: [line1, loc.city, region].filter(Boolean).join(", "),
    line1,
    city: loc.city,
    region,
    county: loc.county,
    reapiPropertyId: loc.reapiPropertyId,
    marketValue: loc.marketValue,
    landValue: loc.landValue,
    estimatedEquity: loc.estimatedEquity,
    mortgageBalance: loc.mortgageBalance,
    confirmed,
    values,
  };
}

const toInt = (v: string): number | null => {
  const n = parseInt(String(v).replace(/[^0-9.]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const toPct = (v: string): number | null => {
  if (!v) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return null;
  return Math.min(100, Math.max(0, n));
};
const toMoney = (v: string): number | null => {
  if (!v) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? null : n;
};

/** Location columns owned by the design property. */
export function toLocationPatch(v: PropertyValues): LocationPatch {
  return {
    namedInsured: v.owner ?? "",
    mortgageeName: v.mortgage ?? "",
    occupancy: v.occupancy ?? "",
  };
}

/** Building columns owned by the design property. */
export function toBuildingPatch(v: PropertyValues): BuildingPatch {
  return {
    propertyType: v.propType ?? "",
    propertyUsage: v.propUse ?? "",
    tenantType: v.tenantType ?? "",
    constructionType: v.construction ?? "",
    roofType: v.roofShape ?? "",
    roofCoveringType: v.roofMaterial ?? "",
    buildingExterior: v.exterior ?? "",
    propertyCondition: v.condition ?? "",
    walkwaysDriveways: v.walkways ?? "",
    fireProtection: v.fireProtection ?? "",
    plumbingType: v.plumbing ?? "",
    electricalType: v.wiring ?? "",
    hvacType: v.hvac ?? "",
    fireAlarmType: v.fireAlarm ?? "",
    numUnits: toInt(v.units ?? ""),
    numStories: toInt(v.stories ?? ""),
    totalSqft: toInt(v.bldgSqft ?? ""),
    yearBuilt: toInt(v.yearBuilt ?? ""),
    occupancyPercent: toPct(v.occupancyPct ?? ""),
    insurableValue: toMoney(v.tiv ?? ""),
    suggestedRent: toMoney(v.lossRents ?? ""),
    pool: v.pool === "Yes",
    sprinklered: v.sprinklered === "Yes",
  };
}

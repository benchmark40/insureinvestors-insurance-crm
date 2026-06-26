/**
 * Field schema for the address-first property intake, mapped onto the existing
 * Location + Building backend. The four sections mirror the Benchmark design
 * (Location · Coverage · Condition · Safety); the select options are pulled from
 * our canonical building-option enums so the values we persist stay valid.
 *
 * Each design "property" is modelled as one Location with a single Building.
 * `PropertyValues` is a flat record keyed by the design field keys; the mapper
 * helpers below split it into a LocationPatch and a BuildingPatch. A handful of
 * design fields have no dedicated column (contents/flood coverage amounts, land
 * sqft, the "year updated" ranges, secondary building condition) — those are
 * kept in UI state only and are noted where they appear.
 */

import {
  ALARM_OPTIONS,
  CONDITION_OPTIONS,
  CONSTRUCTION_TYPE_OPTIONS,
  ELECTRICAL_OPTIONS,
  EXTERIOR_OPTIONS,
  HVAC_OPTIONS,
  PLUMBING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  ROOF_COVERING_OPTIONS,
  ROOF_TYPE_OPTIONS,
  TENANT_TYPE_OPTIONS,
} from "@insureinvestorsv2/lib/src/building-options";

/* design-only option sets that have no canonical backend enum */
export const OCCUPANCY = [
  "Owner Occupied",
  "Tenant Occupied",
  "Vacant",
  "Seasonal / Short-term",
];
export const FIRE_PROTECTION = [
  "Fire Extinguisher per Unit",
  "Smoke Detectors",
  "Monitored Alarm",
  "None",
];
export const UPDATED_RANGE = [
  "Past 5 Years",
  "5–15 Years Ago",
  "15–25 Years Ago",
  "25+ Years Ago",
];
export const YESNO = ["Yes", "No"];

export type FieldType =
  | "text"
  | "number"
  | "money"
  | "select"
  | "coverage";

export type FieldDef = {
  k: string;
  label: string;
  type: FieldType;
  opts?: readonly string[];
  suffix?: string;
  info?: string;
  optional?: boolean;
  placeholder?: string;
  /** secondary "year updated" / panel select shown beneath the main control (UI-only) */
  meta?: { k: string; label: string; opts: readonly string[] };
};

export type SectionDef = {
  id: "location" | "coverage" | "condition" | "safety";
  title: string;
  icon: string;
  blurb: string;
  groups: { title: string; fields: FieldDef[] }[];
};

export const SECTIONS: SectionDef[] = [
  {
    id: "location",
    title: "Location Details",
    icon: "pin",
    blurb: "Where the property sits and who owns it.",
    groups: [
      {
        title: "Ownership",
        fields: [
          { k: "owner", label: "Named Insured", type: "text", placeholder: "610 Retail LLC" },
          { k: "mortgage", label: "Mortgagee", type: "text", placeholder: "Chase Bank", optional: true },
          { k: "occupancy", label: "Occupancy", type: "select", opts: OCCUPANCY },
          { k: "occupancyPct", label: "Occupancy %", type: "number", suffix: "%" },
        ],
      },
      {
        title: "Classification",
        fields: [
          { k: "propType", label: "Property Type", type: "select", opts: PROPERTY_TYPE_OPTIONS },
          { k: "propUse", label: "Property Use", type: "select", opts: PROPERTY_USE_OPTIONS },
          { k: "units", label: "Number of Units", type: "number" },
          { k: "stories", label: "Number of Stories", type: "number" },
        ],
      },
    ],
  },
  {
    id: "coverage",
    title: "Property Coverage",
    icon: "shield",
    blurb: "What you want insured on this property.",
    groups: [
      {
        title: "Insurable value",
        fields: [
          { k: "tiv", label: "Property's Insurable Value", type: "money", info: "Replacement cost of the structure." },
          { k: "lossRents", label: "Loss of Rents", type: "coverage", info: "Lost rent while the property is uninhabitable." },
          { k: "contents", label: "Content Coverage", type: "coverage", info: "Owned contents inside the building." },
          { k: "flood", label: "Flood Insurance", type: "coverage", info: "Separate layer for rising-water damage." },
        ],
      },
    ],
  },
  {
    id: "condition",
    title: "Property Condition",
    icon: "ruler",
    blurb: "Building specs and the condition of major systems.",
    groups: [
      {
        title: "Building details",
        fields: [
          { k: "yearBuilt", label: "Year Built", type: "number" },
          { k: "construction", label: "Construction Type", type: "select", opts: CONSTRUCTION_TYPE_OPTIONS },
          { k: "roofShape", label: "Roof Type", type: "select", opts: ROOF_TYPE_OPTIONS },
          { k: "roofMaterial", label: "Roof Covering", type: "select", opts: ROOF_COVERING_OPTIONS },
          { k: "bldgSqft", label: "Total Building SqFt", type: "number", suffix: "sq ft" },
          { k: "pool", label: "Swimming Pool", type: "select", opts: YESNO },
        ],
      },
      {
        title: "Condition & systems",
        fields: [
          { k: "condition", label: "Condition of Property", type: "select", opts: CONDITION_OPTIONS },
          { k: "roofUpdated", label: "Roof — last updated", type: "select", opts: UPDATED_RANGE, optional: true },
          { k: "plumbing", label: "Plumbing Type", type: "select", opts: PLUMBING_OPTIONS, meta: { k: "plumbingUpdated", label: "Year Updated", opts: UPDATED_RANGE } },
          { k: "wiring", label: "Electrical Wiring", type: "select", opts: ELECTRICAL_OPTIONS, meta: { k: "panel", label: "Panel Type", opts: ["Circuit Breakers", "Fuses", "Federal Pacific", "Zinsco"] } },
          { k: "hvac", label: "HVAC Type", type: "select", opts: HVAC_OPTIONS, meta: { k: "hvacUpdated", label: "Year Updated", opts: UPDATED_RANGE } },
          { k: "exterior", label: "Building Exterior", type: "select", opts: EXTERIOR_OPTIONS, meta: { k: "exteriorUpdated", label: "Year Updated", opts: UPDATED_RANGE } },
        ],
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & Occupancy",
    icon: "flame",
    blurb: "Protection features and how the building is used.",
    groups: [
      {
        title: "Premises & safety",
        fields: [
          { k: "walkways", label: "Walkways and Driveways", type: "select", opts: CONDITION_OPTIONS },
          { k: "fireProtection", label: "Fire Protection", type: "select", opts: FIRE_PROTECTION },
          { k: "sprinklered", label: "Sprinklered", type: "select", opts: YESNO },
          { k: "fireAlarm", label: "Fire Alarm", type: "select", opts: ALARM_OPTIONS, optional: true },
        ],
      },
      {
        title: "Building usage",
        fields: [
          { k: "tenantType", label: "Tenant Type", type: "select", opts: TENANT_TYPE_OPTIONS },
          { k: "buildingCondition", label: "Building Condition", type: "select", opts: CONDITION_OPTIONS, optional: true },
        ],
      },
    ],
  },
];

export const ALL_FIELDS: (FieldDef & { section: SectionDef["id"] })[] = [];
SECTIONS.forEach((s) =>
  s.groups.forEach((g) => g.fields.forEach((f) => ALL_FIELDS.push({ ...f, section: s.id }))),
);

/** Required keys for the completeness ring (skip optional + coverage add-ons). */
export const REQUIRED_KEYS = ALL_FIELDS.filter(
  (f) => !f.optional && f.type !== "coverage",
).map((f) => f.k);

export type PropertyValues = Record<string, string>;

export function completeness(p: PropertyValues) {
  const filled = REQUIRED_KEYS.filter(
    (k) => p[k] != null && String(p[k]).trim() !== "",
  ).length;
  return { filled, total: REQUIRED_KEYS.length, pct: filled / REQUIRED_KEYS.length };
}

export function sectionDone(p: PropertyValues, sectionId: SectionDef["id"]) {
  const keys = ALL_FIELDS.filter(
    (f) => f.section === sectionId && !f.optional && f.type !== "coverage",
  ).map((f) => f.k);
  return keys.every((k) => p[k] != null && String(p[k]).trim() !== "");
}

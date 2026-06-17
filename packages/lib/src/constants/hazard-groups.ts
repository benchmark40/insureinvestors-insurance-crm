/**
 * Underwriter question set, grouped to match the legacy questionnaire's parents.
 * Each FlagDef maps to a typed column on Submission / Location / Building.
 * The Underwriting tab renders these in three contexts:
 *   - Submission-level flags: once at the top of the tab
 *   - Location-level flags: inside each Location card
 *   - Building-level flags: inside each Building card under a Location
 *
 * "Occupancy class" options are mutually-exclusive per location; rendered as a
 * Select rather than a list of Booleans. See OCCUPANCY_CLASS_OPTIONS.
 */

export type FlagDef = {
  field: string;
  label: string;
  help?: string;
};

// =============================================================================
// Group 1 — General Policy Info (Submission)
// =============================================================================
export const SUBMISSION_GENERAL_INFO_FLAGS: FlagDef[] = [
  {
    field: "hasOnlinePresence",
    label:
      "Has a website or online business listing (Facebook, Yelp, Google, etc.)",
  },
  { field: "hasPriorLosses5y", label: "Losses in the last 5 years" },
  { field: "operatesOtherBusinesses", label: "Operates other businesses besides this one" },
  {
    field: "inBusiness12moNoPriorCoverage",
    label: "In business >12 months with no prior insurance coverage",
  },
  { field: "hasBankruptcy5y", label: "Declared bankruptcy in the past 5 years" },
];

// =============================================================================
// Group 2 — Legal / character flags (Submission)
// =============================================================================
export const SUBMISSION_LEGAL_FLAGS: FlagDef[] = [
  {
    field: "hasIndictmentsOrConvictions",
    label:
      "Indicted or convicted of any degree of crime, fraud, bribery or arson on any property",
  },
  {
    field: "hasCivilJudgments",
    label:
      "Found legally liable regarding any complaint of wrongful eviction, discriminatory rental practices or invasion of privacy",
  },
  {
    field: "requiresSignedLeaseWithHoldharmless",
    label:
      "Each commercial rental requires a signed lease agreement with hold-harmless wording in favor of the applicant",
  },
];

// =============================================================================
// Group 3 — Lease / tenant requirements (Submission + Location)
// =============================================================================
export const SUBMISSION_LEASE_FLAGS: FlagDef[] = [
  {
    field: "collectsCoiFromTenants",
    label: "Collects current Certificates of Insurance from each commercial tenant",
  },
  {
    field: "priorClaimsMoldOrAsbestos",
    label: "Prior claims history involves mold or asbestos",
  },
];

/** Per-location flags that belong logically with Group 3 (location-specific). */
export const LOCATION_LEASE_FLAGS: FlagDef[] = [
  {
    field: "commercialCookingExposure",
    label: "Includes commercial cooking or restaurant exposure",
  },
  {
    field: "nfpaNoncompliant",
    label:
      "Does NOT comply with a required NFPA Life Safety Code (smoke detectors, egress, exit lighting, etc.)",
  },
  {
    field: "renovationDuringPolicyTerm",
    label: "Non-structural renovation work will take place during the policy term",
  },
  {
    field: "demolitionPlanned",
    label: "Currently being demolished or planned for demolition",
  },
];

// =============================================================================
// Group 4 — Does any location have… (Location + Building)
// =============================================================================
export const LOCATION_LOCATION_HAS_FLAGS: FlagDef[] = [
  {
    field: "breachedBuildingCodes5y",
    label: "Properties in breach of State or Federal building codes within the last 5 years",
  },
  { field: "vacancyPresent", label: "Any property at this location is vacant" },
];

export const BUILDING_LOCATION_HAS_FLAGS: FlagDef[] = [
  { field: "hazardKnobAndTubeWiring", label: "Knob-and-tube wiring present" },
  { field: "hazardAluminumWiring", label: "Aluminum wiring present" },
  { field: "hazardFuses", label: "Fuses present" },
  { field: "hazardFederalPacificPanel", label: "Federal Pacific circuit breakers" },
  { field: "hazardZinscoPanel", label: "Zinsco or Split-Bus electrical panels" },
  { field: "hazardPigtailWiring", label: "Pig-tailed wiring" },
  {
    field: "hazardEifsOver20pct",
    label: "More than 20% EIFS (Exterior Insulation Finishing System) exposure",
  },
  { field: "preExistingDamage", label: "Known pre-existing damage" },
  {
    field: "hazardSupplementalHeating",
    label:
      "Heated by wood-burning stoves, pellet stoves, space heaters, or supplemental devices",
  },
  { field: "hazardPolybutylenePlumbing", label: "Polybutylene plumbing" },
  { field: "hazardSteelIronPlumbing", label: "Steel or iron plumbing" },
];

// =============================================================================
// Group 6 — Other location-level flags + risky tenant exposures
// =============================================================================
export const LOCATION_OTHER_FLAGS: FlagDef[] = [
  { field: "occupancyBelow60pct", label: "Less than 60% occupied" },
  {
    field: "tenantOwnedByApplicant",
    label: "Has a tenant business owned or operated by the applicant",
  },
  {
    field: "hasHazardousChemicalsTenant",
    label:
      "Has a tenant working with or storing toxic, hazardous, highly-flammable, or explosive substances",
  },
  {
    field: "warehouseOtherThanGeneral",
    label: "Any warehouses occupied or used for anything other than general warehousing",
  },
];

export const BUILDING_OTHER_FLAGS: FlagDef[] = [
  { field: "overThreeStories", label: "Building is over 3 stories" },
];

// =============================================================================
// Convenience — keep the older names exported so anything still importing them
// continues to compile. New code should use the group-specific arrays above.
// =============================================================================
export const SUBMISSION_BUSINESS_FLAGS: FlagDef[] = [
  ...SUBMISSION_GENERAL_INFO_FLAGS,
  ...SUBMISSION_LEGAL_FLAGS,
  ...SUBMISSION_LEASE_FLAGS,
];

export const LOCATION_SITUATIONAL_FLAGS: FlagDef[] = [
  ...LOCATION_LEASE_FLAGS,
  ...LOCATION_LOCATION_HAS_FLAGS,
  ...LOCATION_OTHER_FLAGS,
];

export const BUILDING_ELECTRICAL_HAZARDS: FlagDef[] = BUILDING_LOCATION_HAS_FLAGS.filter(
  (f) =>
    [
      "hazardKnobAndTubeWiring",
      "hazardAluminumWiring",
      "hazardFuses",
      "hazardFederalPacificPanel",
      "hazardZinscoPanel",
      "hazardPigtailWiring",
    ].includes(f.field),
);

export const BUILDING_PLUMBING_HAZARDS: FlagDef[] = BUILDING_LOCATION_HAS_FLAGS.filter(
  (f) =>
    ["hazardPolybutylenePlumbing", "hazardSteelIronPlumbing"].includes(f.field),
);

export const BUILDING_STRUCTURAL_FLAGS: FlagDef[] = [
  ...BUILDING_LOCATION_HAS_FLAGS.filter((f) =>
    [
      "hazardEifsOver20pct",
      "preExistingDamage",
      "hazardSupplementalHeating",
    ].includes(f.field),
  ),
  ...BUILDING_OTHER_FLAGS,
];

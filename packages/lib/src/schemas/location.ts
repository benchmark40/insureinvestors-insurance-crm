import { z } from "zod";

import { toPatchSchema } from "./patch";

export const OccupancyClassSchema = z.enum([
  "none",
  "adult_day_care",
  "adult_entertainment_club",
  "agriculture",
  "arts_entertainment_recreation",
  "auto_repair_or_sales",
  "aviation_or_aerospace",
  "bowling_alley",
  "children_playcenter",
  "church_or_worship",
  "daycare",
  "detective_or_investigative",
  "distillery_or_liquor",
  "mobile_or_manufactured_home",
  "nursing_home",
  "paint_sales_or_mixing",
  "rehabilitation_housing",
  "shelter",
  "sorority_or_fraternity",
]);

export const LocationSchema = z.object({
  submissionId: z.number().int().nullable().optional(),
  policyId: z.number().int().nullable().optional(),

  locationNumber: z.number().int().positive().default(1),

  namedInsured: z.string().default(""),

  addressLine1: z.string().default(""),
  addressLine2: z.string().default(""),
  city: z.string().default(""),
  state: z.string().max(2).default(""),
  zipCode: z.string().default(""),
  county: z.string().default(""),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),

  // real-estate enrichment (cached from RealEstateAPI PropertyDetail)
  reapiPropertyId: z.string().default(""),
  marketValue: z.coerce.number().nullable().optional(),
  landValue: z.coerce.number().nullable().optional(),
  estimatedEquity: z.coerce.number().nullable().optional(),
  mortgageBalance: z.coerce.number().nullable().optional(),

  interestType: z.string().default(""),
  occupancy: z.string().default(""),
  protectionClass: z.string().default(""),
  coastalClass: z.string().default(""),
  tierRate: z.string().default(""),
  fireDistrict: z.string().default(""),
  hydrantDistanceFt: z.number().int().nonnegative().nullable().optional(),
  fireStationDistanceMi: z.coerce.number().nonnegative().nullable().optional(),

  mortgageeName: z.string().default(""),
  loanNumber: z.string().default(""),
  escrowed: z.boolean().default(false),

  commercialCookingExposure: z.boolean().default(false),
  vacancyPresent: z.boolean().default(false),
  demolitionPlanned: z.boolean().default(false),
  renovationDuringPolicyTerm: z.boolean().default(false),
  nfpaNoncompliant: z.boolean().default(false),
  occupancyBelow60pct: z.boolean().default(false),
  tenantOwnedByApplicant: z.boolean().default(false),
  breachedBuildingCodes5y: z.boolean().default(false),
  hasHazardousChemicalsTenant: z.boolean().default(false),
  warehouseOtherThanGeneral: z.boolean().default(false),
  warehouseOtherUseDescription: z.string().default(""),

  occupancyClass: OccupancyClassSchema.default("none"),
});

export type LocationInput = z.infer<typeof LocationSchema>;

export const LocationPatchSchema = toPatchSchema(LocationSchema).refine(
  (data) => {
    // app-layer enforcement of the "anchored to exactly one parent" rule
    // when both keys are present in a patch payload
    const hasSub = data.submissionId !== undefined && data.submissionId !== null;
    const hasPol = data.policyId !== undefined && data.policyId !== null;
    if (data.submissionId !== undefined && data.policyId !== undefined) {
      return hasSub !== hasPol;
    }
    return true;
  },
  { message: "Location must be anchored to exactly one of submissionId or policyId." },
);
export type LocationPatch = z.infer<typeof LocationPatchSchema>;

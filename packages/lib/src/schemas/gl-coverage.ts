import { z } from "zod";

import { toPatchSchema } from "./patch";

export const GLFormOfCoverageSchema = z.enum(["occurrence", "claims_made"]);
export const GLAggregateBasisSchema = z.enum([
  "policy",
  "per_location",
  "per_project",
]);

export const SubmissionGLCoverageSchema = z.object({
  insuranceCarrier: z.string().default("Atain Specialty Insurance Company"),
  lineOfBusiness: z.string().default("Commercial General Liability"),
  formOfCoverage: GLFormOfCoverageSchema.default("occurrence"),
  carrierParticipationPct: z.coerce.number().min(0).max(100).default(100),

  eachOccurrenceLimit: z.coerce.number().nonnegative().default(1_000_000),
  generalAggregate: z.coerce.number().nonnegative().default(2_000_000),
  productsCompletedOpsAggregate: z.coerce
    .number()
    .nonnegative()
    .default(2_000_000),
  personalAdvertisingInjuryLimit: z.coerce
    .number()
    .nonnegative()
    .default(1_000_000),
  medicalExpense: z.coerce.number().nonnegative().default(5_000),
  damageToRentedPremises: z.coerce.number().nonnegative().default(100_000),
  aggregateBasis: GLAggregateBasisSchema.default("policy"),
});

export const SubmissionGLCoveragePatchSchema = toPatchSchema(
  SubmissionGLCoverageSchema,
);
export type SubmissionGLCoveragePatch = z.infer<
  typeof SubmissionGLCoveragePatchSchema
>;

export const SubmissionGLClassificationSchema = z.object({
  locationId: z.number().int().positive(),
  classCode: z.string().default(""),
  description: z.string().default(""),
  exposure: z.coerce.number().nonnegative().default(0),
  rate: z.coerce.number().nonnegative().default(0),
  premium: z.coerce.number().nonnegative().default(0),
});
export const SubmissionGLClassificationPatchSchema = toPatchSchema(
  SubmissionGLClassificationSchema,
);
export type SubmissionGLClassificationInput = z.infer<
  typeof SubmissionGLClassificationSchema
>;
export type SubmissionGLClassificationPatch = z.infer<
  typeof SubmissionGLClassificationPatchSchema
>;

export const SubmissionOptionalCoverageSchema = z.object({
  name: z.string().min(1),
  value: z.record(z.string(), z.unknown()).default({}),
});
export type SubmissionOptionalCoverageInput = z.infer<
  typeof SubmissionOptionalCoverageSchema
>;

// Static dropdown options for the limit selectors.
export const GL_LIMIT_OPTIONS = {
  eachOccurrence: [300_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000],
  generalAggregate: [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 10_000_000, 20_000_000],
  productsCompletedOps: [1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 10_000_000, 20_000_000],
  personalAdvertising: [300_000, 500_000, 1_000_000, 2_000_000],
  medicalExpense: [500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000],
  damageToRented: [5_000, 25_000, 50_000, 100_000, 300_000, 500_000, 1_000_000],
} as const;

// Additional Coverages catalog — matches the legacy AC_DEFS list.
export const GL_ADDITIONAL_COVERAGES = [
  {
    key: "employmentPractices",
    label: "Employment Practices Liability",
    limitOptions: [100_000, 250_000, 500_000, 1_000_000],
  },
  {
    key: "abuseMolestation",
    label: "Abuse & Molestation",
    limitOptions: [100_000, 250_000, 500_000, 1_000_000],
  },
  {
    key: "waiverOfSubrogation",
    label: "Waiver of Subrogation",
    typeOptions: ["none", "blanket", "scheduled"] as const,
  },
  {
    key: "electronicDataLiability",
    label: "Electronic Data Liability",
    limitOptions: [25_000, 50_000, 100_000],
  },
  {
    key: "assaultBattery",
    label: "Assault & Battery",
    limitOptions: [100_000, 300_000, 500_000, 1_000_000],
  },
  { key: "cyberCoverage", label: "Cyber Coverage" },
  {
    key: "hiredNonOwnedAuto",
    label: "Hired & Non-Owned Auto",
    limitOptions: [500_000, 1_000_000, 2_000_000],
  },
] as const;

export type AdditionalCoverageKey = (typeof GL_ADDITIONAL_COVERAGES)[number]["key"];

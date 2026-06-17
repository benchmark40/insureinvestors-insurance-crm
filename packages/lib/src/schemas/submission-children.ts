import { z } from "zod";

import { toPatchSchema } from "./patch";

export const SubmissionContactRoleSchema = z.enum([
  "primary",
  "billing",
  "claims",
  "loss_control",
  "other",
]);
export type SubmissionContactRole = z.infer<typeof SubmissionContactRoleSchema>;

export const SubmissionContactSchema = z.object({
  role: SubmissionContactRoleSchema.default("primary"),
  name: z.string().default(""),
  title: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  addressLine1: z.string().default(""),
  city: z.string().default(""),
  state: z.string().max(2).default(""),
  zipCode: z.string().default(""),
  notes: z.string().default(""),
});
export const SubmissionContactPatchSchema = toPatchSchema(
  SubmissionContactSchema,
);
export type SubmissionContactPatch = z.infer<typeof SubmissionContactPatchSchema>;

export const SubmissionOtherInsuranceSchema = z.object({
  carrierName: z.string().default(""),
  lineOfBusiness: z.string().default(""),
  policyNumber: z.string().default(""),
  planType: z.string().default(""),
  policyEffectiveDate: z.coerce.date().optional().nullable(),
  policyExpirationDate: z.coerce.date().optional().nullable(),
  premium: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().default(""),
});
export const SubmissionOtherInsurancePatchSchema = toPatchSchema(
  SubmissionOtherInsuranceSchema,
);
export type SubmissionOtherInsurancePatch = z.infer<
  typeof SubmissionOtherInsurancePatchSchema
>;

export const SubmissionLossHistorySchema = z.object({
  carrierName: z.string().default(""),
  policyNumber: z.string().default(""),
  lineOfBusiness: z.string().default(""),
  dateOfLoss: z.coerce.date().optional().nullable(),
  reportedDate: z.coerce.date().optional().nullable(),
  kindOfLoss: z.string().default(""),
  description: z.string().default(""),
  claimStatus: z.string().default(""),
  amountOfLoss: z.coerce.number().nonnegative().nullable().optional(),
  amountPaid: z.coerce.number().nonnegative().nullable().optional(),
  amountReserved: z.coerce.number().nonnegative().nullable().optional(),
});
export const SubmissionLossHistoryPatchSchema = toPatchSchema(
  SubmissionLossHistorySchema,
);
export type SubmissionLossHistoryPatch = z.infer<
  typeof SubmissionLossHistoryPatchSchema
>;

export const SubmissionAdditionalInterestSchema = z.object({
  interestType: z.string().default(""),
  name: z.string().default(""),
  contactName: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  addressLine1: z.string().default(""),
  city: z.string().default(""),
  state: z.string().max(2).default(""),
  zipCode: z.string().default(""),
  descriptionOfOperations: z.string().default(""),
  isBonded: z.boolean().default(false),
  isLicensed: z.boolean().default(false),
  certificateRequired: z.boolean().default(false),
  certificateIssued: z.boolean().default(false),
  notes: z.string().default(""),
});
export const SubmissionAdditionalInterestPatchSchema = toPatchSchema(
  SubmissionAdditionalInterestSchema,
);
export type SubmissionAdditionalInterestPatch = z.infer<
  typeof SubmissionAdditionalInterestPatchSchema
>;

import { z } from "zod";

import { toPatchSchema } from "./patch";

export const SubmissionStatusSchema = z.enum([
  "draft",
  "ready",
  "sent",
  "partial",
  "quoted",
  "bound",
  "declined",
  "lost",
  "expired",
]);

export const SubmissionSchema = z.object({
  status: SubmissionStatusSchema.default("draft"),

  targetEffectiveDate: z.coerce.date().optional().nullable(),
  targetExpirationDate: z.coerce.date().optional().nullable(),
  linesOfBusiness: z.array(z.string()).default([]),

  namedInsured: z.string().default(""),
  businessEntity: z.string().default(""),
  federalId: z.string().default(""),

  yearsInBusiness: z.number().int().nonnegative().nullable().optional(),
  annualRevenue: z.coerce.number().nonnegative().nullable().optional(),
  totalPayroll: z.coerce.number().nonnegative().nullable().optional(),
  hasPriorCoverage: z.boolean().default(false),
  priorCarrier: z.string().default(""),
  priorExpirationDate: z.coerce.date().optional().nullable(),
  claimsInLast5Years: z.number().int().nonnegative().default(0),

  // overview — service group / company type / business unit (free text)
  accountExecutive: z.string().default(""),
  accountRepresentative: z.string().default(""),
  accountBroker: z.string().default(""),
  accountProducer: z.string().default(""),
  parentCompany: z.string().default(""),
  writingCompany: z.string().default(""),
  companyType: z.string().default(""),
  underwriterContact: z.string().default(""),
  division: z.string().default(""),
  branch: z.string().default(""),
  department: z.string().default(""),
  groupName: z.string().default(""),
  businessOrigin: z.string().default(""),
  leadSource: z.string().default(""),

  // underwriter-only
  businessDescription: z.string().default(""),
  additionalInsuredNames: z.string().default(""),
  certificatesOfInsuranceNotes: z.string().default(""),
  hasPriorLosses5y: z.boolean().default(false),
  hasBankruptcy5y: z.boolean().default(false),
  hasIndictmentsOrConvictions: z.boolean().default(false),
  hasCivilJudgments: z.boolean().default(false),
  operatesOtherBusinesses: z.boolean().default(false),
  hasOnlinePresence: z.boolean().default(false),
  inBusiness12moNoPriorCoverage: z.boolean().default(false),
  requiresSignedLeaseWithHoldharmless: z.boolean().default(false),
  collectsCoiFromTenants: z.boolean().default(false),
  priorClaimsMoldOrAsbestos: z.boolean().default(false),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

export const SubmissionPatchSchema = toPatchSchema(SubmissionSchema);
export type SubmissionPatch = z.infer<typeof SubmissionPatchSchema>;

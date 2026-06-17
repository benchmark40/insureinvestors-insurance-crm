import { z } from "zod";

import { toPatchSchema } from "./patch";

export const CustomerSchema = z.object({
  customerType: z.enum(["commercial", "personal"]).default("commercial"),
  businessName: z.string().default(""),
  dba: z.string().default(""),
  businessEntity: z.string().default(""),
  federalId: z.string().default(""),
  naics: z.string().default(""),
  sic: z.string().default(""),
  inBusinessSince: z.coerce.date().optional().nullable(),

  firstName: z.string().default(""),
  lastName: z.string().default(""),
  dateOfBirth: z.coerce.date().optional().nullable(),

  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),

  addressLine1: z.string().default(""),
  addressLine2: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  zipCode: z.string().default(""),
  county: z.string().default(""),

  billAddressSameAsMailing: z.boolean().default(true),
  billAddressLine1: z.string().default(""),
  billAddressLine2: z.string().default(""),
  billCity: z.string().default(""),
  billState: z.string().default(""),
  billZipCode: z.string().default(""),

  notes: z.string().default(""),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

// toPatchSchema (not .partial()) so omitted keys don't get reset to their
// .default("") — see schemas/patch.ts. A single-field update must not wipe the
// rest of the customer record.
export const CustomerPatchSchema = toPatchSchema(CustomerSchema);
export type CustomerPatch = z.infer<typeof CustomerPatchSchema>;

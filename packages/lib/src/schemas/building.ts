import { z } from "zod";

import { toPatchSchema } from "./patch";

export const BuildingSchema = z.object({
  locationId: z.number().int(),
  buildingNumber: z.number().int().positive().default(1),
  name: z.string().default(""),

  propertyType: z.string().default(""),
  propertyUsage: z.string().default(""),
  tenantType: z.string().default(""),
  occupancyPercent: z.coerce.number().min(0).max(100).nullable().optional(),
  numUnits: z.number().int().nonnegative().nullable().optional(),
  numStories: z.number().int().nonnegative().nullable().optional(),

  totalSqft: z.number().int().nonnegative().nullable().optional(),
  yearBuilt: z.number().int().nonnegative().nullable().optional(),
  yearRenovated: z.number().int().nonnegative().nullable().optional(),

  constructionType: z.string().default(""),
  roofType: z.string().default(""),
  roofCoveringType: z.string().default(""),
  roofCoveringYear: z.number().int().nonnegative().nullable().optional(),

  electricalType: z.string().default(""),
  electricalYear: z.number().int().nonnegative().nullable().optional(),
  plumbingType: z.string().default(""),
  plumbingYear: z.number().int().nonnegative().nullable().optional(),
  hvacType: z.string().default(""),
  hvacYear: z.number().int().nonnegative().nullable().optional(),

  sprinklered: z.boolean().default(false),
  sprinklerCoveragePct: z.coerce.number().min(0).max(100).nullable().optional(),
  burglarAlarmType: z.string().default(""),
  fireAlarmType: z.string().default(""),

  propertyCondition: z.string().default(""),
  buildingExterior: z.string().default(""),
  pool: z.boolean().default(false),
  walkwaysDriveways: z.string().default(""),
  fireProtection: z.string().default(""),

  insurableValue: z.coerce.number().nonnegative().nullable().optional(),
  replacementCost: z.coerce.number().nonnegative().nullable().optional(),
  replacementPerSqft: z.coerce.number().nonnegative().nullable().optional(),
  suggestedRent: z.coerce.number().nonnegative().nullable().optional(),

  // underwriter-only hazard flags
  hazardKnobAndTubeWiring: z.boolean().default(false),
  hazardFuses: z.boolean().default(false),
  hazardFederalPacificPanel: z.boolean().default(false),
  hazardZinscoPanel: z.boolean().default(false),
  hazardPigtailWiring: z.boolean().default(false),
  hazardAluminumWiring: z.boolean().default(false),
  hazardPolybutylenePlumbing: z.boolean().default(false),
  hazardSteelIronPlumbing: z.boolean().default(false),
  hazardEifsOver20pct: z.boolean().default(false),
  overThreeStories: z.boolean().default(false),
  preExistingDamage: z.boolean().default(false),
  hazardNoCentralStationAlarm: z.boolean().default(false),
  hazardSupplementalHeating: z.boolean().default(false),
});

export type BuildingInput = z.infer<typeof BuildingSchema>;

export const BuildingPatchSchema = toPatchSchema(BuildingSchema);
export type BuildingPatch = z.infer<typeof BuildingPatchSchema>;

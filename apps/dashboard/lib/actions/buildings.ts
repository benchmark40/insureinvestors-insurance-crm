"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  BuildingPatchSchema,
  type BuildingPatch,
} from "@insureinvestorsv2/lib";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedBuilding, assertOwnedLocation } from "@/lib/scope";

export async function updateBuilding(
  id: number,
  patch: BuildingPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const building = await assertOwnedBuilding(ctx, id);
  const parsed = BuildingPatchSchema.parse(patch);
  const { locationId: _l, ...safe } = parsed;
  await db.building.update({ where: { id: building.id }, data: safe });
  revalidatePath("/", "layout");
}

export async function createBuilding(
  locationUuid: string,
  initial?: BuildingPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const location = await assertOwnedLocation(ctx, locationUuid);
  const count = await db.building.count({
    where: { locationId: location.id },
  });

  const data = {
    locationId: location.id,
    buildingNumber: count + 1,
  };
  if (initial) {
    // locationId is set above; never accept it from the caller's patch.
    const { locationId: _l, ...safe } = BuildingPatchSchema.parse(initial);
    Object.assign(data, safe);
  }

  await db.building.create({ data });
  revalidatePath("/", "layout");
}

export async function deleteBuilding(id: number): Promise<void> {
  const ctx = await requireAuth();
  const building = await assertOwnedBuilding(ctx, id);
  await db.building.delete({ where: { id: building.id } });
  revalidatePath("/", "layout");
}

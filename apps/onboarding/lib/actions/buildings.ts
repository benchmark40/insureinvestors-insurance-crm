"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  BuildingPatchSchema,
  type BuildingPatch,
} from "@insureinvestorsv2/lib";

export async function createBuilding(
  locationUuid: string,
  initial?: BuildingPatch,
): Promise<void> {
  const location = await db.location.findUnique({
    where: { uuid: locationUuid },
    include: { _count: { select: { buildings: true } } },
  });
  if (!location) throw new Error("Location not found");

  const data = {
    locationId: location.id,
    buildingNumber: location._count.buildings + 1,
  };
  if (initial) {
    // locationId is set above; never accept it from the caller's patch.
    const { locationId: _l, ...safe } = BuildingPatchSchema.parse(initial);
    Object.assign(data, safe);
  }

  await db.building.create({ data });
  revalidatePath("/", "layout");
}

export async function updateBuilding(
  id: number,
  patch: BuildingPatch,
): Promise<void> {
  const parsed = BuildingPatchSchema.parse(patch);
  // locationId is set at creation; never accept from the patch.
  const { locationId: _l, ...safe } = parsed;
  await db.building.update({ where: { id }, data: safe });
  revalidatePath("/", "layout");
}

export async function deleteBuilding(id: number): Promise<void> {
  await db.building.delete({ where: { id } });
  revalidatePath("/", "layout");
}

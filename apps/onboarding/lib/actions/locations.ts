"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  LocationPatchSchema,
  type LocationPatch,
} from "@insureinvestorsv2/lib";

export async function createLocation(submissionUuid: string): Promise<void> {
  const submission = await db.submission.findUnique({
    where: { uuid: submissionUuid },
    include: { _count: { select: { locations: true } } },
  });
  if (!submission) throw new Error("Submission not found");

  await db.location.create({
    data: {
      submissionId: submission.id,
      locationNumber: submission._count.locations + 1,
    },
  });
  revalidatePath(`/${submissionUuid}`, "layout");
}

export async function updateLocation(
  uuid: string,
  patch: LocationPatch,
): Promise<void> {
  const parsed = LocationPatchSchema.parse(patch);
  // Polymorphic anchor fields are managed server-side; never accept from the patch.
  const { submissionId: _s, policyId: _p, ...safe } = parsed;
  await db.location.update({ where: { uuid }, data: safe });
  revalidatePath("/", "layout");
}

export async function deleteLocation(uuid: string): Promise<void> {
  const location = await db.location.findUnique({
    where: { uuid },
    include: { submission: true },
  });
  if (!location) return;
  await db.location.delete({ where: { uuid } });
  if (location.submission) {
    revalidatePath(`/${location.submission.uuid}`, "layout");
  }
}

"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  LocationPatchSchema,
  type LocationPatch,
} from "@insureinvestorsv2/lib";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedLocation, assertOwnedSubmission } from "@/lib/scope";

export async function updateLocation(
  uuid: string,
  patch: LocationPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const location = await assertOwnedLocation(ctx, uuid);
  const parsed = LocationPatchSchema.parse(patch);
  const { submissionId: _s, policyId: _p, ...safe } = parsed;
  await db.location.update({ where: { id: location.id }, data: safe });
  revalidatePath("/", "layout");
}

export async function createSubmissionLocation(
  submissionUuid: string,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const count = await db.location.count({ where: { submissionId: sub.id } });
  await db.location.create({
    data: {
      submissionId: sub.id,
      locationNumber: count + 1,
    },
  });
  revalidatePath(`/submissions/${submissionUuid}`);
}

export async function deleteSubmissionLocation(uuid: string): Promise<void> {
  const ctx = await requireAuth();
  const location = await assertOwnedLocation(ctx, uuid);
  const row = await db.location.findUnique({
    where: { id: location.id },
    select: { submission: { select: { uuid: true } } },
  });
  await db.location.delete({ where: { id: location.id } });
  if (row?.submission) {
    revalidatePath(`/submissions/${row.submission.uuid}`);
  }
}

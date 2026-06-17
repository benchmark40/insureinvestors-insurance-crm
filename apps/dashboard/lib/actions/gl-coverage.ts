"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  SubmissionGLClassificationPatchSchema,
  SubmissionGLClassificationSchema,
  SubmissionGLCoveragePatchSchema,
  SubmissionOptionalCoverageSchema,
  type SubmissionGLClassificationInput,
  type SubmissionGLClassificationPatch,
  type SubmissionGLCoveragePatch,
  type SubmissionOptionalCoverageInput,
} from "@insureinvestorsv2/lib";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedSubmission } from "@/lib/scope";

function bust(uuid: string) {
  revalidatePath(`/submissions/${uuid}`);
}

// -----------------------------------------------------------------------------
// GL coverage (one per submission)
// -----------------------------------------------------------------------------

export async function upsertGLCoverage(
  submissionUuid: string,
  patch: SubmissionGLCoveragePatch,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionGLCoveragePatchSchema.parse(patch);
  await db.submissionGLCoverage.upsert({
    where: { submissionId: sub.id },
    create: { submissionId: sub.id, ...parsed },
    update: parsed,
  });
  bust(submissionUuid);
}

// -----------------------------------------------------------------------------
// Classifications
// -----------------------------------------------------------------------------

export async function addGLClassification(
  submissionUuid: string,
  input: SubmissionGLClassificationInput,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionGLClassificationSchema.parse(input);
  // Confirm the referenced location belongs to this broker.
  const loc = await db.location.findFirst({
    where: {
      id: parsed.locationId,
      submission: { customer: { brokerId: ctx.broker.id } },
    },
    select: { id: true },
  });
  if (!loc) throw new Error("Location not found");
  const { locationId, ...rest } = parsed;
  await db.submissionGLClassification.create({
    data: {
      submissionId: sub.id,
      locationId,
      ...rest,
    },
  });
  bust(submissionUuid);
}

export async function addGLClassifications(
  submissionUuid: string,
  rows: SubmissionGLClassificationInput[],
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  // Parse and validate ownership of every row before writing.
  const parsedRows = rows.map((r) => SubmissionGLClassificationSchema.parse(r));
  const locationIds = [...new Set(parsedRows.map((r) => r.locationId))];
  const owned = await db.location.findMany({
    where: {
      id: { in: locationIds },
      submission: { customer: { brokerId: ctx.broker.id } },
    },
    select: { id: true },
  });
  if (owned.length !== locationIds.length) throw new Error("Location not found");
  await db.submissionGLClassification.createMany({
    data: parsedRows.map((r) => ({
      submissionId: sub.id,
      ...r,
    })),
  });
  bust(submissionUuid);
}

export async function updateGLClassification(
  submissionUuid: string,
  id: number,
  patch: SubmissionGLClassificationPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionGLClassificationPatchSchema.parse(patch);
  if (parsed.locationId !== undefined) {
    const loc = await db.location.findFirst({
      where: {
        id: parsed.locationId,
        submission: { customer: { brokerId: ctx.broker.id } },
      },
      select: { id: true },
    });
    if (!loc) throw new Error("Location not found");
  }
  await db.submissionGLClassification.update({
    where: { id, submissionId: sub.id },
    data: parsed,
  });
  bust(submissionUuid);
}

export async function deleteGLClassification(
  submissionUuid: string,
  id: number,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionGLClassification.delete({
    where: { id, submissionId: sub.id },
  });
  bust(submissionUuid);
}

// -----------------------------------------------------------------------------
// Optional coverages (additional coverages list)
// -----------------------------------------------------------------------------

export async function upsertOptionalCoverage(
  submissionUuid: string,
  input: SubmissionOptionalCoverageInput,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionOptionalCoverageSchema.parse(input);
  await db.submissionOptionalCoverage.upsert({
    where: {
      submissionId_name: { submissionId: sub.id, name: parsed.name },
    },
    create: {
      submissionId: sub.id,
      name: parsed.name,
      value: parsed.value as object,
    },
    update: { value: parsed.value as object },
  });
  bust(submissionUuid);
}

export async function deleteOptionalCoverage(
  submissionUuid: string,
  name: string,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionOptionalCoverage.deleteMany({
    where: { submissionId: sub.id, name },
  });
  bust(submissionUuid);
}

/**
 * Batch-apply a snapshot of additional coverages.
 * Coverages present in `keep` are upserted; anything else under this submission is deleted.
 */
export async function syncOptionalCoverages(
  submissionUuid: string,
  keep: SubmissionOptionalCoverageInput[],
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = keep.map((k) => SubmissionOptionalCoverageSchema.parse(k));
  const keepNames = parsed.map((k) => k.name);

  await db.$transaction([
    db.submissionOptionalCoverage.deleteMany({
      where: {
        submissionId: sub.id,
        name: { notIn: keepNames.length ? keepNames : ["__none__"] },
      },
    }),
    ...parsed.map((p) =>
      db.submissionOptionalCoverage.upsert({
        where: {
          submissionId_name: { submissionId: sub.id, name: p.name },
        },
        create: {
          submissionId: sub.id,
          name: p.name,
          value: p.value as object,
        },
        update: { value: p.value as object },
      }),
    ),
  ]);
  bust(submissionUuid);
}

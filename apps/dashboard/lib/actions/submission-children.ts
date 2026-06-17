"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  SubmissionAdditionalInterestPatchSchema,
  SubmissionContactPatchSchema,
  SubmissionLossHistoryPatchSchema,
  SubmissionOtherInsurancePatchSchema,
  type SubmissionAdditionalInterestPatch,
  type SubmissionContactPatch,
  type SubmissionLossHistoryPatch,
  type SubmissionOtherInsurancePatch,
} from "@insureinvestorsv2/lib";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedSubmission } from "@/lib/scope";

function bust(uuid: string) {
  revalidatePath(`/submissions/${uuid}`);
}

// -----------------------------------------------------------------------------
// SubmissionContact
// -----------------------------------------------------------------------------

export async function addSubmissionContact(
  submissionUuid: string,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionContact.create({ data: { submissionId: sub.id } });
  bust(submissionUuid);
}

export async function updateSubmissionContact(
  submissionUuid: string,
  id: number,
  patch: SubmissionContactPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionContactPatchSchema.parse(patch);
  await db.submissionContact.update({
    where: { id, submissionId: sub.id },
    data: parsed,
  });
  bust(submissionUuid);
}

export async function deleteSubmissionContact(
  submissionUuid: string,
  id: number,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionContact.delete({
    where: { id, submissionId: sub.id },
  });
  bust(submissionUuid);
}

// -----------------------------------------------------------------------------
// SubmissionOtherInsurance
// -----------------------------------------------------------------------------

export async function addSubmissionOtherInsurance(
  submissionUuid: string,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionOtherInsurance.create({ data: { submissionId: sub.id } });
  bust(submissionUuid);
}

export async function updateSubmissionOtherInsurance(
  submissionUuid: string,
  id: number,
  patch: SubmissionOtherInsurancePatch,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionOtherInsurancePatchSchema.parse(patch);
  await db.submissionOtherInsurance.update({
    where: { id, submissionId: sub.id },
    data: parsed,
  });
  bust(submissionUuid);
}

export async function deleteSubmissionOtherInsurance(
  submissionUuid: string,
  id: number,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionOtherInsurance.delete({
    where: { id, submissionId: sub.id },
  });
  bust(submissionUuid);
}

// -----------------------------------------------------------------------------
// SubmissionLossHistory
// -----------------------------------------------------------------------------

export async function addSubmissionLossHistory(
  submissionUuid: string,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionLossHistory.create({ data: { submissionId: sub.id } });
  bust(submissionUuid);
}

export async function updateSubmissionLossHistory(
  submissionUuid: string,
  id: number,
  patch: SubmissionLossHistoryPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionLossHistoryPatchSchema.parse(patch);
  await db.submissionLossHistory.update({
    where: { id, submissionId: sub.id },
    data: parsed,
  });
  bust(submissionUuid);
}

export async function deleteSubmissionLossHistory(
  submissionUuid: string,
  id: number,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionLossHistory.delete({
    where: { id, submissionId: sub.id },
  });
  bust(submissionUuid);
}

// -----------------------------------------------------------------------------
// SubmissionAdditionalInterest
// -----------------------------------------------------------------------------

export async function addSubmissionAdditionalInterest(
  submissionUuid: string,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionAdditionalInterest.create({
    data: { submissionId: sub.id },
  });
  bust(submissionUuid);
}

export async function updateSubmissionAdditionalInterest(
  submissionUuid: string,
  id: number,
  patch: SubmissionAdditionalInterestPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  const parsed = SubmissionAdditionalInterestPatchSchema.parse(patch);
  await db.submissionAdditionalInterest.update({
    where: { id, submissionId: sub.id },
    data: parsed,
  });
  bust(submissionUuid);
}

export async function deleteSubmissionAdditionalInterest(
  submissionUuid: string,
  id: number,
): Promise<void> {
  const ctx = await requireAuth();
  const sub = await assertOwnedSubmission(ctx, submissionUuid);
  await db.submissionAdditionalInterest.delete({
    where: { id, submissionId: sub.id },
  });
  bust(submissionUuid);
}

"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  SubmissionPatchSchema,
  type SubmissionPatch,
} from "@insureinvestorsv2/lib";

import { requireAuth } from "@/lib/require-auth";

export async function getSubmissionByUuid(uuid: string) {
  const { broker } = await requireAuth();
  return db.submission.findFirst({
    where: { uuid, customer: { brokerId: broker.id } },
    include: {
      customer: true,
      locations: {
        orderBy: { locationNumber: "asc" },
        include: { buildings: { orderBy: { buildingNumber: "asc" } } },
      },
      recipients: {
        include: {
          personnel: { include: { carrier: true } },
        },
      },
      emailResponses: { select: { conversationId: true, isFromUs: true } },
      quotes: { include: { carrier: true } },
      contacts: { orderBy: { id: "asc" } },
      otherInsurance: { orderBy: { id: "asc" } },
      lossHistory: { orderBy: { id: "asc" } },
      additionalInterests: { orderBy: { id: "asc" } },
      glCoverage: true,
      glClassifications: { orderBy: { id: "asc" } },
      optionalCoverages: { orderBy: { name: "asc" } },
      documents: {
        orderBy: { uploadedAt: "desc" },
        include: { uploadedBy: { select: { name: true, firstName: true, lastName: true } } },
      },
    },
  });
}

export async function updateSubmission(
  uuid: string,
  patch: SubmissionPatch,
): Promise<void> {
  const { broker } = await requireAuth();
  const submission = await db.submission.findFirst({
    where: { uuid, customer: { brokerId: broker.id } },
    select: { id: true },
  });
  if (!submission) throw new Error("Submission not found");

  const parsed = SubmissionPatchSchema.parse(patch);
  await db.submission.update({ where: { id: submission.id }, data: parsed });
  revalidatePath(`/submissions/${uuid}`);
  revalidatePath("/");
}

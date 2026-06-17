"use server";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import { FORM_LABELS, type FormType } from "@/lib/pdf/render";

export type AttachableForm = {
  type: FormType;
  label: string;
};

export type AttachableUpload = {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type SubmissionAttachables = {
  forms: AttachableForm[];
  uploads: AttachableUpload[];
};

const FORM_ORDER: FormType[] = [
  "acord-125",
  "acord-126",
  "acord-140",
  "supplemental",
];

export async function listSubmissionAttachables(
  submissionUuid: string,
): Promise<SubmissionAttachables> {
  const { broker } = await requireAuth();
  const submission = await db.submission.findFirst({
    where: { uuid: submissionUuid, customer: { brokerId: broker.id } },
    select: {
      id: true,
      documents: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
        },
      },
    },
  });
  if (!submission) throw new Error("Submission not found");

  return {
    forms: FORM_ORDER.map((t) => ({ type: t, label: FORM_LABELS[t] })),
    uploads: submission.documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  };
}

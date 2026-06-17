"use server";

import { readFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import { CONFIGURED_ASCEND_CARRIER_IDS } from "@/lib/configured-carriers";
import { sendMailViaGraph } from "@/lib/email/graph";
import { renderFormToBuffer, type FormType } from "@/lib/pdf/render";
import { fullStoragePath } from "@/lib/uploads";

// Microsoft Graph rejects sendMail payloads over ~4MB total. Cap conservatively.
const ATTACHMENT_TOTAL_LIMIT = 3 * 1024 * 1024;
const FORM_TYPES: ReadonlySet<FormType> = new Set([
  "acord-125",
  "acord-126",
  "acord-140",
  "supplemental",
]);

type Personnel = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
};

type Company = {
  id: number;
  name: string;
  naic: string;
  personnel: Personnel[];
};

export type RecipientCompanies = {
  carriers: Company[];
  wholesalers: Company[];
};

/**
 * Active parent companies + their personnel for the email composer, grouped by
 * kind. Writing companies (parentCompanyId IS NOT NULL) are excluded — they're
 * not email recipients themselves; they appear later when logging quotes.
 *
 * The list is restricted to carriers configured on our Ascend production
 * account: a Carrier appears only if its `ascendIdentifier` is one of the 68
 * approved slugs in CONFIGURED_ASCEND_CARRIER_IDS. To add a carrier later, tag
 * its row's ascendIdentifier with the matching Ascend slug.
 */
export async function listRecipientCompanies(): Promise<RecipientCompanies> {
  await requireAuth();
  const rows = await db.carrier.findMany({
    where: {
      isActive: true,
      parentCompanyId: null,
      ascendIdentifier: { in: [...CONFIGURED_ASCEND_CARRIER_IDS] },
    },
    orderBy: { name: "asc" },
    include: {
      personnel: {
        where: { isActive: true },
        orderBy: { lastName: "asc" },
      },
    },
  });

  const grouped: RecipientCompanies = { carriers: [], wholesalers: [] };
  for (const c of rows) {
    const company: Company = {
      id: c.id,
      name: c.name,
      naic: c.naic,
      personnel: c.personnel.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        title: p.title,
      })),
    };
    if (c.kind === "carrier") grouped.carriers.push(company);
    else if (c.kind === "wholesaler") grouped.wholesalers.push(company);
  }
  return grouped;
}

/**
 * Send a submission to one or more recipient personnel via Microsoft Graph.
 * Each personnelId becomes a SubmissionRecipient row. The email itself is sent
 * once with all addresses in `toRecipients`. Submission.status flips to "sent"
 * if it was draft/ready.
 */
export async function sendSubmissionToCarriers(
  submissionUuid: string,
  payload: {
    personnelIds: number[];
    subject: string;
    body: string;
    attachments?: {
      forms?: FormType[];
      uploadIds?: number[];
    };
  },
): Promise<void> {
  if (payload.personnelIds.length === 0) {
    throw new Error("Pick at least one recipient");
  }

  const ctx = await requireAuth();
  const submission = await db.submission.findFirst({
    where: {
      uuid: submissionUuid,
      customer: { brokerId: ctx.broker.id },
    },
    select: { id: true, status: true },
  });
  if (!submission) throw new Error("Submission not found");

  const personnel = await db.carrierPersonnel.findMany({
    where: { id: { in: payload.personnelIds }, isActive: true },
    select: { id: true, email: true },
  });
  if (personnel.length === 0) {
    throw new Error("None of the selected recipients are active");
  }

  const toEmails = personnel.map((p) => p.email).filter(Boolean);
  if (toEmails.length === 0) {
    throw new Error("Selected recipients have no email addresses on file");
  }

  // Gather attachments — render forms server-side, read uploads from disk.
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  let totalBytes = 0;

  const forms = (payload.attachments?.forms ?? []).filter((f) => FORM_TYPES.has(f));
  for (const form of forms) {
    const rendered = await renderFormToBuffer(ctx, submissionUuid, form);
    totalBytes += rendered.bytes.byteLength;
    attachments.push({
      filename: rendered.filename,
      content: rendered.bytes,
      contentType: rendered.contentType,
    });
  }

  const uploadIds = payload.attachments?.uploadIds ?? [];
  if (uploadIds.length > 0) {
    const docs = await db.submissionDocument.findMany({
      where: { id: { in: uploadIds }, submissionId: submission.id },
      select: { filename: true, mimeType: true, sizeBytes: true, storagePath: true },
    });
    for (const d of docs) {
      const bytes = await readFile(fullStoragePath(d.storagePath));
      totalBytes += bytes.byteLength;
      attachments.push({
        filename: d.filename,
        content: bytes,
        contentType: d.mimeType || "application/octet-stream",
      });
    }
  }

  if (totalBytes > ATTACHMENT_TOTAL_LIMIT) {
    const mb = (totalBytes / 1024 / 1024).toFixed(1);
    throw new Error(
      `Attachments total ${mb} MB — Graph caps direct sendMail at ~3 MB. Trim the selection or remove a large upload.`,
    );
  }

  // Send first — if Graph fails we don't want orphan "sent" recipient rows.
  const { messageId, conversationId } = await sendMailViaGraph({
    toEmails,
    subject: payload.subject,
    body: payload.body,
    attachments,
  });

  const now = new Date();
  await db.$transaction(async (tx) => {
    for (const p of personnel) {
      await tx.submissionRecipient.create({
        data: {
          submissionId: submission.id,
          personnelId: p.id,
          status: "sent",
          sentAt: now,
          emailSubject: payload.subject,
          emailBody: payload.body,
          messageId,
          conversationId,
        },
      });
    }

    if (submission.status === "draft" || submission.status === "ready") {
      await tx.submission.update({
        where: { id: submission.id },
        data: { status: "sent" },
      });
    }
  });

  revalidatePath(`/submissions/${submissionUuid}`);
  revalidatePath("/");
}

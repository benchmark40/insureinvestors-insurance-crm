"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import { getGraphAccessToken, graphFromMailbox } from "@/lib/email/graph";
import { saveAttachment } from "@/lib/storage/email-attachments";

function isDevMode(): boolean {
  const raw = (process.env.DEV ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export type ThreadAttachment = {
  id: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
};

export type ThreadOutbound = {
  kind: "outbound";
  id: number; // recipient id
  subject: string;
  body: string;
  sentAt: string | null;
  recipientName: string;
  recipientEmail: string;
};

export type ThreadResponse = {
  kind: "response";
  id: number;
  subject: string;
  body: string;
  bodyContentType: string;
  senderName: string;
  senderEmail: string;
  receivedAt: string;
  isFromUs: boolean;
  attachments: ThreadAttachment[];
};

export type ThreadEntry = ThreadOutbound | ThreadResponse;

export type SubmissionThread = {
  recipientId: number;
  conversationId: string | null;
  entries: ThreadEntry[];
};

export async function getSubmissionThread(
  submissionUuid: string,
  recipientId: number,
): Promise<SubmissionThread> {
  const { broker } = await requireAuth();

  const recipient = await db.submissionRecipient.findFirst({
    where: {
      id: recipientId,
      submission: { uuid: submissionUuid, customer: { brokerId: broker.id } },
    },
    include: { personnel: true, submission: { select: { id: true } } },
  });
  if (!recipient) throw new Error("Recipient not found");

  const outbound: ThreadOutbound = {
    kind: "outbound",
    id: recipient.id,
    subject: recipient.emailSubject,
    body: recipient.emailBody,
    sentAt: recipient.sentAt?.toISOString() ?? null,
    recipientName: `${recipient.personnel.firstName} ${recipient.personnel.lastName}`.trim(),
    recipientEmail: recipient.personnel.email,
  };

  const responses = recipient.conversationId
    ? await db.emailResponse.findMany({
        where: {
          submissionId: recipient.submission.id,
          conversationId: recipient.conversationId,
        },
        orderBy: { receivedAt: "asc" },
        include: { attachments: { orderBy: { id: "asc" } } },
      })
    : [];

  const entries: ThreadEntry[] = [
    outbound,
    ...responses.map<ThreadResponse>((r) => ({
      kind: "response",
      id: r.id,
      subject: r.subject,
      body: r.body,
      bodyContentType: r.bodyContentType,
      senderName: r.senderName,
      senderEmail: r.senderEmail,
      receivedAt: r.receivedAt.toISOString(),
      isFromUs: r.isFromUs,
      attachments: r.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        sizeBytes: a.sizeBytes,
        downloadUrl: `/api/email-attachments/${a.id}`,
      })),
    })),
  ];

  return {
    recipientId: recipient.id,
    conversationId: recipient.conversationId,
    entries,
  };
}

/**
 * Reply to the latest message in a conversation via Graph /messages/{id}/reply.
 * The webhook will later pick this up as an EmailResponse with isFromUs=true.
 */
export async function replyInThread(
  submissionUuid: string,
  recipientId: number,
  body: string,
): Promise<void> {
  if (!body.trim()) throw new Error("Reply body is empty");
  const { broker } = await requireAuth();

  const recipient = await db.submissionRecipient.findFirst({
    where: {
      id: recipientId,
      submission: { uuid: submissionUuid, customer: { brokerId: broker.id } },
    },
    select: {
      id: true,
      messageId: true,
      conversationId: true,
      submissionId: true,
    },
  });
  if (!recipient) throw new Error("Recipient not found");
  if (!recipient.conversationId) {
    throw new Error("This thread has no captured conversationId yet — try again in a moment");
  }

  // Find the latest message in this conversation we know about. Prefer the
  // latest EmailResponse (carrier reply); fall back to our original send.
  const latestResponse = await db.emailResponse.findFirst({
    where: {
      submissionId: recipient.submissionId,
      conversationId: recipient.conversationId,
    },
    orderBy: { receivedAt: "desc" },
    select: { messageId: true },
  });
  const replyToMessageId = latestResponse?.messageId ?? recipient.messageId;
  if (!replyToMessageId) {
    throw new Error("No Graph message id available to reply to");
  }

  const token = await getGraphAccessToken();
  const mailbox = graphFromMailbox();
  const isDev = (process.env.DEV ?? "").trim().toLowerCase() === "true";
  const comment = isDev
    ? `[DEV reply — would have sent in this thread]\n\n${body}`
    : body;

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(replyToMessageId)}/reply`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  });
  if (res.status !== 202) {
    const detail = await res.text();
    throw new Error(`Graph reply failed (${res.status}): ${detail}`);
  }

  revalidatePath(`/submissions/${submissionUuid}`);
}

/**
 * DEV-only — synthesize an inbound carrier reply by writing an EmailResponse
 * row directly. Used to test the thread UI and webhook-equivalent code path
 * without needing a real Outlook mailbox round-trip. Refuses unless DEV=true.
 *
 * The fake reply is attributed to the recipient's personnel email, so the UI
 * looks the same as a real ingestion.
 */
export async function simulateCarrierReply(
  submissionUuid: string,
  recipientId: number,
  body: string,
  attachment?: {
    filename: string;
    contentType: string;
    base64: string;
  },
): Promise<void> {
  if (!isDevMode()) {
    throw new Error("Simulator is only available when DEV=true");
  }
  if (!body.trim()) throw new Error("Reply body is empty");

  const { broker } = await requireAuth();
  const recipient = await db.submissionRecipient.findFirst({
    where: {
      id: recipientId,
      submission: { uuid: submissionUuid, customer: { brokerId: broker.id } },
    },
    include: {
      personnel: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!recipient) throw new Error("Recipient not found");

  // Make sure we have a conversationId — create a synthetic one so the thread
  // view can render even if the real send hasn't captured one yet.
  let conversationId = recipient.conversationId;
  if (!conversationId) {
    conversationId = `sim-${randomUUID()}`;
    await db.submissionRecipient.update({
      where: { id: recipient.id },
      data: { conversationId },
    });
  }

  const now = new Date();
  const senderName =
    `${recipient.personnel.firstName} ${recipient.personnel.lastName}`.trim();
  const created = await db.emailResponse.create({
    data: {
      submissionId: recipient.submissionId,
      conversationId,
      messageId: `sim-${randomUUID()}`,
      receivedAt: now,
      senderEmail: recipient.personnel.email,
      senderName,
      subject: `Re: ${recipient.emailSubject || "Submission"}`,
      body,
      bodyContentType: "text",
      isFromUs: false,
      isDraft: false,
      processedAt: now,
    },
  });

  if (attachment) {
    const bytes = Buffer.from(attachment.base64, "base64");
    if (bytes.byteLength > 25 * 1024 * 1024) {
      throw new Error("Simulated attachment exceeds 25 MB");
    }
    const saved = await saveAttachment(bytes, attachment.filename);
    await db.emailAttachment.create({
      data: {
        emailResponseId: created.id,
        filename: attachment.filename,
        contentType: attachment.contentType || "application/octet-stream",
        sizeBytes: saved.sizeBytes,
        storageKey: saved.storageKey,
      },
    });
  }

  await db.submissionRecipient.updateMany({
    where: { conversationId },
    data: { status: "replied", lastReplyAt: now },
  });

  revalidatePath(`/submissions/${submissionUuid}`);
}

/**
 * Microsoft Graph change-notification webhook for the shared mailbox.
 * Ported from program/webhook_views.py:EmailNotificationWebhookView.
 *
 * Flow:
 *   1. Validation handshake — Graph hits us with ?validationToken=... once at
 *      subscription create time. We echo the raw token as text/plain.
 *   2. Notifications — for each "created" notification we look up the
 *      subscription (by id + clientState), fetch the message via Graph,
 *      match by conversationId to a SubmissionRecipient, create an
 *      EmailResponse row, and save any attachments to local disk.
 */

import { NextResponse } from "next/server";

import { db } from "@insureinvestorsv2/db";

import {
  getGraphAccessToken,
  graphFromMailbox,
} from "@/lib/email/graph";
import { findActiveSubscription } from "@/lib/email/subscription";
import { saveAttachment } from "@/lib/storage/email-attachments";

export const runtime = "nodejs";

type GraphNotification = {
  subscriptionId: string;
  clientState: string;
  changeType: string;
  resourceData?: { id?: string };
};

type GraphMessage = {
  id: string;
  conversationId: string;
  receivedDateTime?: string;
  sentDateTime?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  subject?: string;
  uniqueBody?: { content?: string; contentType?: string };
  bodyPreview?: string;
  isDraft?: boolean;
};

type GraphAttachment = {
  id: string;
  name: string;
  contentType?: string;
  contentBytes?: string;
};

function plainText(token: string): NextResponse {
  return new NextResponse(token, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("validationToken");
  if (token) return plainText(token);
  return new NextResponse("Missing validation token", { status: 400 });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const qsToken = url.searchParams.get("validationToken");
  if (qsToken) return plainText(qsToken);

  // Graph sometimes POSTs the validationToken in the body too.
  const raw = await req.text();
  if (raw) {
    try {
      const probe = JSON.parse(raw) as { validationToken?: string };
      if (probe.validationToken) return plainText(probe.validationToken);
    } catch {
      // not JSON — fall through
    }
  }

  let payload: { value?: GraphNotification[] };
  try {
    payload = raw ? (JSON.parse(raw) as { value?: GraphNotification[] }) : {};
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  for (const notification of payload.value ?? []) {
    try {
      await processNotification(notification);
    } catch (err) {
      console.error("graph-email webhook: processNotification failed", err);
    }
  }
  return NextResponse.json({ ok: true });
}

async function processNotification(n: GraphNotification): Promise<void> {
  if (n.changeType !== "created") return;
  const messageId = n.resourceData?.id;
  if (!messageId) return;

  const sub = await findActiveSubscription(n.subscriptionId, n.clientState);
  if (!sub) {
    console.warn("graph-email webhook: no active subscription matches", n.subscriptionId);
    return;
  }

  await ingestMessage(messageId);
}

async function ingestMessage(messageId: string): Promise<void> {
  const token = await getGraphAccessToken();
  const mailbox = graphFromMailbox();

  const messageUrl =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}` +
    `/messages/${encodeURIComponent(messageId)}` +
    `?$select=id,conversationId,receivedDateTime,sentDateTime,from,subject,uniqueBody,bodyPreview,isDraft`;

  const msgRes = await fetch(messageUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: 'outlook.body-content-type="text"',
    },
  });
  if (msgRes.status !== 200) {
    console.warn("graph-email webhook: message fetch failed", msgRes.status);
    return;
  }
  const message = (await msgRes.json()) as GraphMessage;

  if (message.isDraft) return;
  const conversationId = message.conversationId;
  if (!conversationId) return;

  // Match the conversation to a SubmissionRecipient we sent.
  const recipient = await db.submissionRecipient.findFirst({
    where: { conversationId },
    select: { id: true, submissionId: true, messageId: true },
  });
  if (!recipient) return; // not a thread we own

  // Skip the initial outbound that started the conversation — that's our own send.
  if (recipient.messageId && recipient.messageId === message.id) return;

  // Already ingested?
  const existing = await db.emailResponse.findUnique({
    where: { messageId: message.id },
  });
  if (existing) return;

  const fromAddr = message.from?.emailAddress?.address ?? "";
  const fromName = message.from?.emailAddress?.name ?? "";
  const isFromUs = fromAddr.toLowerCase() === mailbox.toLowerCase();
  const ts = message.receivedDateTime ?? message.sentDateTime;
  if (!ts) return;

  const created = await db.emailResponse.create({
    data: {
      submissionId: recipient.submissionId,
      conversationId,
      messageId: message.id,
      receivedAt: new Date(ts),
      senderEmail: fromAddr,
      senderName: fromName,
      subject: message.subject ?? "",
      body: message.uniqueBody?.content ?? message.bodyPreview ?? "",
      bodyContentType: (message.uniqueBody?.contentType ?? "text").toLowerCase(),
      isFromUs,
      isDraft: false,
      processedAt: new Date(),
    },
  });

  await fetchAndStoreAttachments(token, mailbox, message.id, created.id);

  // Update recipient-level state for inbound replies.
  if (!isFromUs) {
    await db.submissionRecipient.updateMany({
      where: { conversationId },
      data: { status: "replied", lastReplyAt: new Date(ts) },
    });
  }
}

async function fetchAndStoreAttachments(
  token: string,
  mailbox: string,
  messageId: string,
  emailResponseId: number,
): Promise<void> {
  const url =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}` +
    `/messages/${encodeURIComponent(messageId)}/attachments`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status !== 200) return;
  const data = (await res.json()) as { value?: GraphAttachment[] };
  for (const att of data.value ?? []) {
    if (!att.contentBytes) continue; // skip reference attachments
    const bytes = Buffer.from(att.contentBytes, "base64");
    const saved = await saveAttachment(bytes, att.name ?? "attachment");
    await db.emailAttachment.create({
      data: {
        emailResponseId,
        filename: att.name ?? "attachment",
        contentType: att.contentType ?? "application/octet-stream",
        sizeBytes: saved.sizeBytes,
        storageKey: saved.storageKey,
      },
    });
  }
}

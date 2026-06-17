/**
 * Microsoft Graph subscription lifecycle for the shared inbox webhook.
 * Ported from program/utils/graph_api.py (legacy Django).
 *
 * Graph supports max 4230 minutes (~70.5h) for /messages subscriptions, so we
 * renew well before expiry on a periodic cron call.
 */

import { randomBytes } from "node:crypto";

import { db } from "@insureinvestorsv2/db";
import type { GraphSubscription, GraphSubscriptionStatus } from "@prisma/client";

import { getGraphAccessToken, graphFromMailbox } from "@/lib/email/graph";

const MAX_EXPIRY_MINUTES = 4230;
const RESOURCE_FOR = (mailbox: string) =>
  `users/${mailbox}/messages?$filter=isDraft eq false`;

function webhookUrl(): string {
  const url = process.env.GRAPH_WEBHOOK_URL ?? "";
  if (!url) {
    throw new Error(
      "GRAPH_WEBHOOK_URL is required (a public HTTPS URL ending in /api/webhooks/graph-email)",
    );
  }
  return url;
}

function expiryDate(minutes = MAX_EXPIRY_MINUTES): Date {
  return new Date(Date.now() + minutes * 60_000);
}

async function setStatus(
  sub: GraphSubscription,
  status: GraphSubscriptionStatus,
): Promise<void> {
  await db.graphSubscription.update({ where: { id: sub.id }, data: { status } });
}

/**
 * Create or renew the global subscription on the shared mailbox. Idempotent —
 * safe to call from a cron every few minutes.
 */
export async function ensureGlobalSubscription(): Promise<GraphSubscription> {
  const mailbox = graphFromMailbox();
  const resource = RESOURCE_FOR(mailbox);

  const existing = await db.graphSubscription.findFirst({
    where: { status: "active", resource },
    orderBy: { id: "desc" },
  });

  // Active, not near expiry → nothing to do.
  if (existing && existing.expirationAt.getTime() > Date.now() + 30 * 60_000) {
    return existing;
  }

  // Active but nearing expiry → renew in place.
  if (existing) {
    const renewed = await renewSubscription(existing);
    if (renewed) return renewed;
    await setStatus(existing, "error");
  }

  return createSubscription();
}

async function createSubscription(): Promise<GraphSubscription> {
  const mailbox = graphFromMailbox();
  const token = await getGraphAccessToken();
  const clientState = randomBytes(24).toString("base64url");
  const expirationAt = expiryDate();

  const body = {
    changeType: "created",
    notificationUrl: webhookUrl(),
    resource: RESOURCE_FOR(mailbox),
    expirationDateTime: expirationAt.toISOString(),
    clientState,
  };

  const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status !== 201) {
    const detail = await res.text();
    throw new Error(`Graph subscription create failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { id: string; resource: string };
  return db.graphSubscription.create({
    data: {
      subscriptionId: data.id,
      resource: data.resource,
      expirationAt,
      clientState,
      status: "active",
    },
  });
}

async function renewSubscription(
  sub: GraphSubscription,
): Promise<GraphSubscription | null> {
  const token = await getGraphAccessToken();
  const newExpiry = expiryDate();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expirationDateTime: newExpiry.toISOString() }),
    },
  );
  if (res.status !== 200) return null;
  return db.graphSubscription.update({
    where: { id: sub.id },
    data: { expirationAt: newExpiry },
  });
}

export async function deleteSubscription(sub: GraphSubscription): Promise<boolean> {
  const token = await getGraphAccessToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (res.status === 204) {
    await setStatus(sub, "cancelled");
    return true;
  }
  return false;
}

/** Used by the webhook to validate notifications come from our subscription. */
export async function findActiveSubscription(
  subscriptionId: string,
  clientState: string,
): Promise<GraphSubscription | null> {
  return db.graphSubscription.findFirst({
    where: { subscriptionId, clientState, status: "active" },
  });
}

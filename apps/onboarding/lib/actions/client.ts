"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";

import { auth } from "@/lib/auth";
import { requireClient } from "@/lib/require-client";

/**
 * Attach the signed-in client to a submission's customer. Called right after a
 * client signs up on the "submission received" page. Links the user to the
 * customer and aligns the customer email with the account email so the portal's
 * email-based lookup always includes this submission.
 */
export async function linkClientToSubmission(uuid: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not signed in");

  const submission = await db.submission.findUnique({
    where: { uuid },
    select: { customerId: true },
  });
  if (!submission) throw new Error("Submission not found");

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { isClient: true, customerId: submission.customerId },
    }),
    db.customer.update({
      where: { id: submission.customerId },
      data: { email: session.user.email },
    }),
  ]);

  revalidatePath("/portal/submissions");
}

/**
 * Attach the signed-in client to a proposal's customer. Same idea as
 * {@link linkClientToSubmission} but keyed by the proposal token, for the
 * customer-facing proposal/checkout page.
 */
export async function linkClientToProposal(token: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not signed in");

  const proposal = await db.proposal.findUnique({
    where: { token },
    select: { customerId: true },
  });
  if (!proposal) throw new Error("Proposal not found");

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { isClient: true, customerId: proposal.customerId },
    }),
    db.customer.update({
      where: { id: proposal.customerId },
      data: { email: session.user.email },
    }),
  ]);
}

/**
 * Account state for the client signup/login box. Tells the UI whether to show a
 * "create password", a "sign in", or a "you're signed in" view — and whether
 * the current visitor is signed in as a CLIENT (admin/underwriter sessions don't
 * count here; client accounts and staff accounts are deliberately separate).
 */
export async function getOnboardingAccountState(email: string): Promise<{
  exists: boolean;
  clientSession: { email: string } | null;
}> {
  const session = await auth.api.getSession({ headers: await headers() });

  let clientSession: { email: string } | null = null;
  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, isClient: true },
    });
    // Only a client account counts as "signed in" for this flow.
    if (user?.isClient) clientSession = { email: user.email };
  }

  const normalized = email.trim();
  const exists = normalized
    ? (await db.user.count({
        where: { email: { equals: normalized, mode: "insensitive" } },
      })) > 0
    : false;

  return { exists, clientSession };
}

/**
 * Every submission belonging to the signed-in client, newest first. Matched by
 * customer email == account email, which groups all of their quotes even though
 * each onboarding run creates a fresh placeholder customer.
 */
export async function getMySubmissions() {
  const { user } = await requireClient();

  return db.submission.findMany({
    where: { customer: { email: user.email } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      _count: { select: { locations: true, boundPolicies: true } },
      locations: { select: { _count: { select: { buildings: true } } } },
      // Surface an actionable proposal (ready to pay) on the list.
      proposals: {
        where: { status: { in: ["presented", "accepted"] } },
        orderBy: { presentedAt: "desc" },
        select: { status: true, token: true },
      },
    },
  });
}

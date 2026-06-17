import { db } from "@insureinvestorsv2/db";

import { type AuthContext } from "@/lib/require-auth";

/**
 * Lookups that verify a record belongs to the current broker before exposing
 * its internal id. Each returns the numeric id (or throws), which the caller
 * can then use to actually write.
 */

export async function assertOwnedSubmission(
  ctx: AuthContext,
  uuid: string,
): Promise<{ id: number; uuid: string }> {
  const row = await db.submission.findFirst({
    where: { uuid, customer: { brokerId: ctx.broker.id } },
    select: { id: true, uuid: true },
  });
  if (!row) throw new Error("Submission not found");
  return row;
}

export async function assertOwnedCustomer(
  ctx: AuthContext,
  uuid: string,
): Promise<{ id: number }> {
  const row = await db.customer.findFirst({
    where: { uuid, brokerId: ctx.broker.id },
    select: { id: true },
  });
  if (!row) throw new Error("Customer not found");
  return row;
}

export async function assertOwnedLocation(
  ctx: AuthContext,
  uuid: string,
): Promise<{ id: number }> {
  const row = await db.location.findFirst({
    where: {
      uuid,
      OR: [
        { submission: { customer: { brokerId: ctx.broker.id } } },
        { policy: { customer: { brokerId: ctx.broker.id } } },
      ],
    },
    select: { id: true },
  });
  if (!row) throw new Error("Location not found");
  return row;
}

export async function assertOwnedBuilding(
  ctx: AuthContext,
  id: number,
): Promise<{ id: number }> {
  const row = await db.building.findFirst({
    where: {
      id,
      location: {
        OR: [
          { submission: { customer: { brokerId: ctx.broker.id } } },
          { policy: { customer: { brokerId: ctx.broker.id } } },
        ],
      },
    },
    select: { id: true },
  });
  if (!row) throw new Error("Building not found");
  return row;
}

export async function assertOwnedRecipient(
  ctx: AuthContext,
  id: number,
): Promise<{ id: number; submissionId: number }> {
  const row = await db.submissionRecipient.findFirst({
    where: {
      id,
      submission: { customer: { brokerId: ctx.broker.id } },
    },
    select: { id: true, submissionId: true },
  });
  if (!row) throw new Error("Recipient not found");
  return row;
}

export async function assertOwnedQuote(
  ctx: AuthContext,
  id: number,
): Promise<{ id: number; submissionId: number }> {
  const row = await db.carrierQuote.findFirst({
    where: {
      id,
      submission: { customer: { brokerId: ctx.broker.id } },
    },
    select: { id: true, submissionId: true },
  });
  if (!row) throw new Error("Quote not found");
  return row;
}

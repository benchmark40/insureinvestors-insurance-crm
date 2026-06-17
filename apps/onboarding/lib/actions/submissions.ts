"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@insureinvestorsv2/db";
import {
  SubmissionPatchSchema,
  type SubmissionPatch,
} from "@insureinvestorsv2/lib";

/**
 * For the auth-skipped MVP we attach every submission to a single placeholder
 * Broker. Once auth lands the broker comes from the authenticated session.
 */
async function defaultBroker() {
  // Match by oldest broker so both apps (anonymous onboarding + authenticated
  // dashboard) converge on the same Broker row for the MVP.
  const existing = await db.broker.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;
  return db.broker.create({
    data: {
      domain: "default.localinsureinvestors.com",
      name: "Default Agency",
    },
  });
}

/** Create a placeholder Customer + draft Submission and send the user into the flow. */
export async function startFlow() {
  const broker = await defaultBroker();
  const submission = await db.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: { brokerId: broker.id, customerType: "commercial" },
    });
    return tx.submission.create({
      data: { customerId: customer.id, status: "draft" },
    });
  });

  redirect(`/${submission.uuid}/quoting-system`);
}

export async function getSubmissionByUuid(uuid: string) {
  return db.submission.findUnique({
    where: { uuid },
    include: {
      customer: true,
      locations: {
        orderBy: { locationNumber: "asc" },
        include: { buildings: { orderBy: { buildingNumber: "asc" } } },
      },
    },
  });
}

export async function updateSubmission(
  uuid: string,
  patch: SubmissionPatch,
): Promise<void> {
  const parsed = SubmissionPatchSchema.parse(patch);
  await db.submission.update({ where: { uuid }, data: parsed });
  revalidatePath(`/${uuid}`, "layout");
}

export async function markSubmissionReady(uuid: string) {
  const submission = await db.submission.findUnique({ where: { uuid } });
  if (!submission) throw new Error("Submission not found");

  // Idempotent: only a draft needs flipping to "ready". A re-submit (double
  // click, back button, retry) on an already-submitted submission should just
  // land them on the confirmation page, not 500.
  if (submission.status === "draft") {
    await db.submission.update({
      where: { uuid },
      data: { status: "ready" },
    });
  }

  redirect(`/${uuid}/complete`);
}

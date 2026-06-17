"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db, bindCarrierQuoteCore } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedQuote, assertOwnedRecipient } from "@/lib/scope";

// =============================================================================
// 6b — log a received quote against a SubmissionRecipient
// =============================================================================

export async function createCarrierQuote(
  recipientId: number,
  input: {
    quoteNumber: string;
    premium: number;
    policyFee: number;
    otherFees: number;
    taxes: number;
    commissionPct: number;
    minimumEarnedPct: number;
    effectiveDate: Date | null;
    expirationDate: Date | null;
    notes: string;
  },
): Promise<void> {
  const ctx = await requireAuth();
  await assertOwnedRecipient(ctx, recipientId);

  if (input.commissionPct < 0 || input.commissionPct > 100) {
    throw new Error(
      `Commission rate must be between 0 and 100% (you entered ${input.commissionPct}). Make sure you typed a percentage, not a dollar amount.`,
    );
  }
  if (input.minimumEarnedPct < 0 || input.minimumEarnedPct > 100) {
    throw new Error(
      `Minimum earned must be between 0 and 100% (you entered ${input.minimumEarnedPct}).`,
    );
  }
  if (input.premium < 0) throw new Error("Premium cannot be negative");

  const recipient = await db.submissionRecipient.findUnique({
    where: { id: recipientId },
    include: {
      personnel: true,
      submission: { select: { id: true, uuid: true, status: true } },
    },
  });
  if (!recipient) throw new Error("Recipient not found");

  const commissionAmount = input.premium * (input.commissionPct / 100);

  await db.$transaction(async (tx) => {
    await tx.carrierQuote.create({
      data: {
        submissionId: recipient.submission.id,
        carrierId: recipient.personnel.carrierId,
        recipientId: recipient.id,
        quoteNumber: input.quoteNumber,
        premium: input.premium,
        policyFee: input.policyFee,
        otherFees: input.otherFees,
        taxes: input.taxes,
        commissionPct: input.commissionPct,
        commissionAmount,
        minimumEarnedPct: input.minimumEarnedPct,
        effectiveDate: input.effectiveDate,
        expirationDate: input.expirationDate,
        notes: input.notes,
        status: "received",
        receivedAt: new Date(),
      },
    });

    await tx.submissionRecipient.update({
      where: { id: recipient.id },
      data: { status: "received_quote" },
    });

    // Flip submission status: 'partial' until all recipients are in, then 'quoted'.
    const counts = await tx.submissionRecipient.groupBy({
      by: ["status"],
      where: { submissionId: recipient.submission.id },
      _count: { _all: true },
    });
    const totals = Object.fromEntries(
      counts.map((row) => [row.status, row._count._all] as const),
    );
    const allReceived =
      (totals.received_quote ?? 0) > 0 &&
      (totals.pending ?? 0) === 0 &&
      (totals.sent ?? 0) === 0;
    const next = allReceived ? "quoted" : "partial";
    if (recipient.submission.status !== "bound") {
      await tx.submission.update({
        where: { id: recipient.submission.id },
        data: { status: next },
      });
    }
  });

  revalidatePath(`/submissions/${recipient.submission.uuid}`);
  revalidatePath("/");
}

// =============================================================================
// 6b.1 — accept/reject a quote, mirrors legacy submission status workflow
// =============================================================================

async function setQuoteStatus(
  quoteId: number,
  next: "accepted" | "rejected" | "reviewing",
): Promise<void> {
  const ctx = await requireAuth();
  await assertOwnedQuote(ctx, quoteId);

  const quote = await db.carrierQuote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true, submission: { select: { uuid: true } } },
  });
  if (!quote) throw new Error("Quote not found");
  if (quote.status === "bound") {
    throw new Error("Quote is already bound — can't change its status");
  }

  await db.carrierQuote.update({
    where: { id: quoteId },
    data: { status: next },
  });
  revalidatePath(`/submissions/${quote.submission.uuid}`);
}

export async function acceptCarrierQuote(quoteId: number): Promise<void> {
  await setQuoteStatus(quoteId, "accepted");
}

export async function rejectCarrierQuote(quoteId: number): Promise<void> {
  await setQuoteStatus(quoteId, "rejected");
}

// =============================================================================
// 6c — bind a quote: snapshot the submission into a Policy + write all the children
// =============================================================================

export async function bindQuote(quoteId: number): Promise<never> {
  const ctx = await requireAuth();
  await assertOwnedQuote(ctx, quoteId);

  const quote = await db.carrierQuote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true, submission: { select: { uuid: true } } },
  });
  if (!quote) throw new Error("Quote not found");
  if (quote.status === "bound")
    throw new Error("This quote is already bound");

  // The heavy lifting (snapshot submission -> Policy + children) lives in the
  // shared core so the Ascend webhook and purchase poll can issue policies too.
  const newPolicyUuid = await bindCarrierQuoteCore(quoteId);
  if (!newPolicyUuid) throw new Error("This quote is already bound");

  revalidatePath(`/submissions/${quote.submission.uuid}`);
  revalidatePath("/");
  revalidatePath(`/policies/${newPolicyUuid}`);
  redirect(`/policies/${newPolicyUuid}`);
}

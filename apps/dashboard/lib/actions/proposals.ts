"use server";

import { revalidatePath } from "next/cache";

import { acceptAndBindProposal, db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import {
  cancelAscendProgram,
  fetchAscendProgramStatus,
  presentProposalOnAscend,
} from "@/lib/ascend/programs";

export type ProposalQuoteInput = {
  carrierQuoteId: number;
  /** Empty = whole submission. Non-empty = the subset of properties this quote covers. */
  locationIds?: number[];
  notes?: string;
};

export type ProposalListItem = {
  id: number;
  uuid: string;
  token: string;
  status: string;
  title: string;
  quoteCount: number;
  totalPremium: string;
  presentedAt: string | null;
  acceptedAt: string | null;
  programCheckoutUrl: string | null;
  paymentProposalUrl: string | null;
};

async function ownedProposal(proposalId: number) {
  const ctx = await requireAuth();
  const proposal = await db.proposal.findFirst({
    where: {
      id: proposalId,
      submission: { customer: { brokerId: ctx.broker.id } },
    },
    include: {
      submission: { select: { id: true, uuid: true, customerId: true } },
      quotes: true,
    },
  });
  if (!proposal) throw new Error("Proposal not found");
  return { ctx, proposal };
}

export async function listProposals(
  submissionUuid: string,
): Promise<ProposalListItem[]> {
  const ctx = await requireAuth();
  const proposals = await db.proposal.findMany({
    where: {
      submission: {
        uuid: submissionUuid,
        customer: { brokerId: ctx.broker.id },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      quotes: { include: { carrierQuote: { select: { premium: true } } } },
    },
  });
  return proposals.map((p) => ({
    id: p.id,
    uuid: p.uuid,
    token: p.token,
    status: p.status,
    title: p.title,
    quoteCount: p.quotes.length,
    totalPremium: p.quotes
      .reduce((sum, q) => sum + Number(q.carrierQuote.premium.toString()), 0)
      .toFixed(2),
    presentedAt: p.presentedAt?.toISOString() ?? null,
    acceptedAt: p.acceptedAt?.toISOString() ?? null,
    programCheckoutUrl: p.programCheckoutUrl,
    paymentProposalUrl: p.paymentProposalUrl,
  }));
}

export async function createDraftProposal(
  submissionUuid: string,
  input: {
    title: string;
    executiveSummary: string;
    coverageHighlights: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    quotes: ProposalQuoteInput[];
    /** Presentation-only: show each named insured's share on the client view. */
    splitByNamedInsured?: boolean;
    /** Manual dollar amount per named insured, keyed by namedInsured. */
    namedInsuredSplits?: Record<string, number>;
  },
): Promise<number> {
  if (input.quotes.length === 0) {
    throw new Error("Pick at least one accepted quote");
  }
  const ctx = await requireAuth();
  const submission = await db.submission.findFirst({
    where: {
      uuid: submissionUuid,
      customer: { brokerId: ctx.broker.id },
    },
    select: { id: true, customerId: true, locations: { select: { id: true } } },
  });
  if (!submission) throw new Error("Submission not found");

  // Sanity-check: every quote must belong to this submission and be in accepted
  // status. Bound quotes can't be bundled again.
  const quoteIds = input.quotes.map((q) => q.carrierQuoteId);
  const validQuotes = await db.carrierQuote.findMany({
    where: { id: { in: quoteIds }, submissionId: submission.id },
    select: { id: true, status: true },
  });
  if (validQuotes.length !== quoteIds.length) {
    throw new Error("One or more quotes don't belong to this submission");
  }
  const notAccepted = validQuotes.filter((q) => q.status !== "accepted");
  if (notAccepted.length > 0) {
    throw new Error(
      `${notAccepted.length} quote(s) aren't accepted yet. Accept them on the Carriers tab first.`,
    );
  }

  const validLocationIds = new Set(submission.locations.map((l) => l.id));

  // Keep only finite, positive split amounts — presentation data, never trusted.
  const splits: Record<string, number> = {};
  for (const [name, amount] of Object.entries(input.namedInsuredSplits ?? {})) {
    const n = Number(amount);
    if (name.trim() && Number.isFinite(n) && n > 0) splits[name] = n;
  }

  const proposal = await db.proposal.create({
    data: {
      submissionId: submission.id,
      customerId: submission.customerId,
      title: input.title,
      executiveSummary: input.executiveSummary,
      coverageHighlights: input.coverageHighlights,
      splitByNamedInsured: input.splitByNamedInsured ?? false,
      namedInsuredSplits: splits,
      contactName: input.contactName ?? "",
      contactEmail: input.contactEmail ?? "",
      contactPhone: input.contactPhone ?? "",
      contactAddress: input.contactAddress ?? "",
      createdById: ctx.user.id,
      quotes: {
        create: input.quotes.map((q, i) => {
          const validIds = (q.locationIds ?? []).filter((id) =>
            validLocationIds.has(id),
          );
          return {
            carrierQuoteId: q.carrierQuoteId,
            notes: q.notes ?? "",
            sortOrder: i,
            locations:
              validIds.length > 0
                ? { connect: validIds.map((id) => ({ id })) }
                : undefined,
          };
        }),
      },
    },
  });

  revalidatePath(`/submissions/${submissionUuid}`);
  return proposal.id;
}

export async function presentProposal(proposalId: number): Promise<void> {
  const { proposal } = await ownedProposal(proposalId);
  if (proposal.status !== "draft") {
    throw new Error(`Proposal is ${proposal.status}, only drafts can be presented`);
  }
  await presentProposalOnAscend(proposalId);
  revalidatePath(`/submissions/${proposal.submission.uuid}`);
}

export async function cancelProposal(proposalId: number): Promise<void> {
  const { proposal } = await ownedProposal(proposalId);
  if (proposal.ascendProgramId) {
    await cancelAscendProgram(proposal.ascendProgramId);
  }
  await db.proposal.update({
    where: { id: proposalId },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  revalidatePath(`/submissions/${proposal.submission.uuid}`);
}

/**
 * Hits Ascend to see whether the customer has paid yet. If the program is
 * "purchased", we flip the proposal to accepted. Designed to be called from
 * the customer-facing onboarding page after Ascend redirects them back.
 */
export async function refreshProposalFromAscend(
  proposalId: number,
): Promise<{ status: string; ascendStatus: string | null }> {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      status: true,
      ascendProgramId: true,
      submission: { select: { uuid: true } },
    },
  });
  if (!proposal) throw new Error("Proposal not found");
  if (!proposal.ascendProgramId) {
    return { status: proposal.status, ascendStatus: null };
  }

  const remote = await fetchAscendProgramStatus(proposal.ascendProgramId);
  if (remote.status === "purchased" && proposal.status !== "accepted") {
    // Flip to accepted AND issue the policy/policies for the bundle.
    await acceptAndBindProposal(proposal.id);
    revalidatePath(`/submissions/${proposal.submission.uuid}`);
    return { status: "accepted", ascendStatus: remote.status };
  }
  return { status: proposal.status, ascendStatus: remote.status };
}

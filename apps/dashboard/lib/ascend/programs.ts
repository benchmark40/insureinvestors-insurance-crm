/**
 * Ascend program lifecycle for a Proposal: createProgram → createBillables
 * → createPaymentProposal → fetch checkout URL. Mirrors lines 623-703 of
 * ascend/views.py in the legacy repo.
 */

import { db } from "@insureinvestorsv2/db";

import { ascendDefaults, ascendFetch } from "@/lib/ascend/client";
import { validateAscendAddress } from "@/lib/ascend/address";
import {
  getOrCreateAscendContact,
  getOrCreateAscendInsured,
} from "@/lib/ascend/insureds";

const toCents = (n: number | string | null | undefined): number => {
  const x = typeof n === "string" ? Number(n) : (n ?? 0);
  return Math.round((Number.isFinite(x) ? x : 0) * 100);
};

function onboardingCallbackUrl(token: string): string {
  const base = process.env.ONBOARDING_BASE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/proposal/${token}?checkout-complete=true`;
}

type ProgramResponse = { id: string; program_url?: string };
type BillableResponse = { id: string };
type PaymentProposalResponse = { id: string; public_url?: string };

/**
 * End-to-end: take a draft Proposal, make sure Ascend has the insured, then
 * create the program + billables + payment proposal. Populates ascend* fields
 * on the Proposal + ProposalQuote rows. Returns the proposal id.
 */
export async function presentProposalOnAscend(
  proposalId: number,
): Promise<void> {
  const { producerId, accountManagerId } = ascendDefaults();
  if (!producerId || !accountManagerId) {
    throw new Error(
      "Ascend producer/account-manager IDs are not configured (ASCEND_PRODUCER_ID / ASCEND_ACCOUNT_MANAGER_ID).",
    );
  }

  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: {
      customer: true,
      submission: {
        include: {
          contacts: { orderBy: { id: "asc" } },
        },
      },
      quotes: {
        include: { carrierQuote: { include: { carrier: true } } },
      },
    },
  });
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.quotes.length === 0) {
    throw new Error("Proposal has no quotes to present");
  }
  if (proposal.status !== "draft") {
    throw new Error(`Proposal is already ${proposal.status} — can't present again`);
  }

  // 0. Validate the address up front — Ascend's sandbox only takes US states
  //    and 5-digit US zips. Fail fast with a clear message instead of a 422.
  const { issues, normalizedState } = validateAscendAddress({
    state: proposal.customer.state,
    zipCode: proposal.customer.zipCode,
  });
  if (issues.length > 0) {
    throw new Error(
      `Customer address is incompatible with Ascend: ${issues
        .map((i) => i.message)
        .join(" ")} Fix the customer record under General → Customer.`,
    );
  }

  // 1. Pick a primary contact for Ascend.
  const primary =
    proposal.submission.contacts.find((c) => c.role === "primary") ??
    proposal.submission.contacts[0];
  const contactEmail = (
    proposal.contactEmail ||
    primary?.email ||
    proposal.customer.email ||
    ""
  ).trim();
  if (!contactEmail) {
    throw new Error(
      "Proposal needs a primary contact email — set one on the submission or in the proposal contact fields.",
    );
  }
  const contactNameParts = (
    proposal.contactName ||
    primary?.name ||
    `${proposal.customer.firstName ?? ""} ${proposal.customer.lastName ?? ""}`.trim() ||
    proposal.customer.businessName
  ).split(/\s+/);
  const firstName = contactNameParts[0] ?? "";
  const lastName = contactNameParts.slice(1).join(" ") || "";
  const phone =
    proposal.contactPhone ||
    primary?.phone ||
    proposal.customer.phone ||
    "";

  // 2. Sync contact → insured.
  let ascendContactId: string;
  if (primary) {
    ascendContactId = await getOrCreateAscendContact(primary.id, {
      email: contactEmail,
      firstName,
      lastName,
      phone,
    });
  } else {
    // No SubmissionContact row exists — create one on the fly so we can persist
    // the ascendId. The customer-facing proposal page benefits from this too.
    const created = await db.submissionContact.create({
      data: {
        submissionId: proposal.submissionId,
        role: "primary",
        name: `${firstName} ${lastName}`.trim() || proposal.customer.businessName,
        email: contactEmail,
        phone,
      },
    });
    ascendContactId = await getOrCreateAscendContact(created.id, {
      email: contactEmail,
      firstName,
      lastName,
      phone,
    });
  }

  const ascendInsuredId = await getOrCreateAscendInsured(proposal.customerId, {
    isBusiness: !!proposal.customer.businessName,
    businessName: proposal.customer.businessName || undefined,
    addressLine1: proposal.customer.addressLine1,
    addressLine2: proposal.customer.addressLine2,
    city: proposal.customer.city,
    state: normalizedState ?? proposal.customer.state,
    zipCode: proposal.customer.zipCode,
    primaryContactEmail: contactEmail,
    primaryAscendContactId: ascendContactId,
  });

  // 3. Create the program.
  const program = await ascendFetch<ProgramResponse>("POST", "/programs", {
    producer_id: producerId,
    account_manager_id: accountManagerId,
    insured_id: ascendInsuredId,
    success_callback_url: onboardingCallbackUrl(proposal.token),
  });

  await db.proposal.update({
    where: { id: proposal.id },
    data: { ascendProgramId: program.id },
  });

  // 4. Create one billable per quote.
  const fallbackEffective = new Date();
  const fallbackExpiration = new Date(
    fallbackEffective.getFullYear() + 1,
    fallbackEffective.getMonth(),
    fallbackEffective.getDate(),
  );

  for (const pq of proposal.quotes) {
    const q = pq.carrierQuote;
    // Ascend's billables endpoint expects the carrier's Ascend *identifier* slug
    // (e.g. "amguard_insurance_company_wilkes_barre_0aac37"), not the display
    // name — sending the name yields a 422 "Carrier is invalid". The slug lives
    // on Carrier.ascendIdentifier (mapped from Ascend's carrier list).
    const carrierIdentifier = q.carrier?.ascendIdentifier;
    if (!carrierIdentifier) {
      throw new Error(
        `Carrier "${q.carrier?.name ?? "unknown"}" is not mapped to an Ascend carrier. ` +
          `Set its Ascend identifier under Carriers before presenting this proposal.`,
      );
    }
    const payload: Record<string, unknown> = {
      program_id: program.id,
      billable_identifier: q.quoteNumber || `quote-${q.id}`,
      carrier_identifier: carrierIdentifier,
      coverage_identifier: "property", // v2 doesn't track per-quote coverage type yet
      effective_date: (q.effectiveDate ?? fallbackEffective)
        .toISOString()
        .slice(0, 10),
      expiration_date: (q.expirationDate ?? fallbackExpiration)
        .toISOString()
        .slice(0, 10),
      premium_cents: toCents(q.premium.toString()),
      policy_fee_cents: toCents(q.policyFee.toString()),
      taxes_and_fees_cents: toCents(q.taxes.toString()),
      other_fees_cents: toCents(q.otherFees.toString()),
      broker_fee_cents: toCents(q.wholesalerFee.toString()),
      seller_commission_rate: q.commissionPct
        ? Number(q.commissionPct.toString()) / 100
        : undefined,
    };
    if (q.minimumEarnedPct && Number(q.minimumEarnedPct.toString()) > 0) {
      payload.min_earned_rate = Number(q.minimumEarnedPct.toString()) / 100;
    }

    // Strip undefined.
    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) delete payload[k];
    }

    const billable = await ascendFetch<BillableResponse>(
      "POST",
      "/billables",
      payload,
    );
    await db.proposalQuote.update({
      where: { id: pq.id },
      data: { ascendBillableId: billable.id },
    });
  }

  // 5. Generate the payment proposal PDF.
  try {
    const paymentProposal = await ascendFetch<PaymentProposalResponse>(
      "POST",
      "/payment_proposals",
      { program_id: program.id },
    );
    if (paymentProposal.public_url) {
      await db.proposal.update({
        where: { id: proposal.id },
        data: { paymentProposalUrl: paymentProposal.public_url },
      });
    }
  } catch (err) {
    // Non-fatal — the program + billables exist; the broker can retry.
    console.warn("Ascend payment_proposals failed", err);
  }

  // 6. Fetch the customer-facing checkout URL.
  const programDetail = await ascendFetch<ProgramResponse>(
    "GET",
    `/programs/${program.id}`,
  );

  await db.proposal.update({
    where: { id: proposal.id },
    data: {
      programCheckoutUrl: programDetail.program_url ?? null,
      status: "presented",
      presentedAt: new Date(),
    },
  });
}

export type AscendProgramStatus = {
  id: string;
  status: string; // "pending" | "purchased" | ...
};

export async function fetchAscendProgramStatus(
  ascendProgramId: string,
): Promise<AscendProgramStatus> {
  return ascendFetch<AscendProgramStatus>(
    "GET",
    `/programs/${ascendProgramId}`,
  );
}

export async function cancelAscendProgram(
  ascendProgramId: string,
): Promise<void> {
  try {
    await ascendFetch("DELETE", `/programs/${ascendProgramId}`);
  } catch (err) {
    // Swallow — Ascend may already have nuked it. We still want to flip the
    // local Proposal to cancelled.
    console.warn("Ascend program delete failed", err);
  }
}

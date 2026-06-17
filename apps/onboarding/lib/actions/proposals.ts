"use server";

import { revalidatePath } from "next/cache";

import { acceptAndBindProposal, db } from "@insureinvestorsv2/db";

export type ProposalQuoteForCustomer = {
  id: number;
  carrierName: string;
  quoteNumber: string;
  premium: string;
  policyFee: string;
  otherFees: string;
  taxes: string;
  total: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  notes: string;
  locations: {
    id: number;
    locationNumber: number;
    namedInsured: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  }[];
};

export type ProposalForCustomer = {
  uuid: string;
  token: string;
  status: string;
  title: string;
  executiveSummary: string;
  coverageHighlights: string;
  /** Presentation-only: split the proposal totals by named insured. */
  splitByNamedInsured: boolean;
  /** Manual dollar amount per named insured, keyed by namedInsured. */
  namedInsuredSplits: Record<string, number>;
  paymentProposalUrl: string | null;
  programCheckoutUrl: string | null;
  presentedAt: string | null;
  acceptedAt: string | null;
  customer: {
    businessName: string;
    firstName: string;
    lastName: string;
    email: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  locations: {
    id: number;
    locationNumber: number;
    namedInsured: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  }[];
  quotes: ProposalQuoteForCustomer[];
  totalPremium: string;
};

/** Normalize the stored JSON split map to a clean { name: number } record. */
function coerceSplits(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [name, amount] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(amount);
    if (name.trim() && Number.isFinite(n) && n > 0) out[name] = n;
  }
  return out;
}

export async function getProposalByToken(
  token: string,
): Promise<ProposalForCustomer | null> {
  const p = await db.proposal.findUnique({
    where: { token },
    include: {
      customer: true,
      submission: {
        select: {
          locations: {
            orderBy: { locationNumber: "asc" },
            select: {
              id: true,
              locationNumber: true,
              namedInsured: true,
              addressLine1: true,
              city: true,
              state: true,
              zipCode: true,
            },
          },
        },
      },
      quotes: {
        orderBy: { sortOrder: "asc" },
        include: {
          carrierQuote: { include: { carrier: true } },
          locations: {
            orderBy: { locationNumber: "asc" },
            select: {
              id: true,
              locationNumber: true,
              namedInsured: true,
              addressLine1: true,
              city: true,
              state: true,
              zipCode: true,
            },
          },
        },
      },
    },
  });
  if (!p) return null;

  const quotes = p.quotes.map<ProposalQuoteForCustomer>((pq) => {
    const q = pq.carrierQuote;
    const premium = Number(q.premium.toString());
    const policyFee = Number(q.policyFee.toString());
    const otherFees = Number(q.otherFees.toString());
    const taxes = Number(q.taxes.toString());
    return {
      id: pq.id,
      carrierName: q.carrier.name,
      quoteNumber: q.quoteNumber,
      premium: premium.toFixed(2),
      policyFee: policyFee.toFixed(2),
      otherFees: otherFees.toFixed(2),
      taxes: taxes.toFixed(2),
      total: (premium + policyFee + otherFees + taxes).toFixed(2),
      effectiveDate: q.effectiveDate?.toISOString() ?? null,
      expirationDate: q.expirationDate?.toISOString() ?? null,
      notes: pq.notes,
      locations: pq.locations,
    };
  });

  const totalPremium = quotes
    .reduce((sum, q) => sum + Number(q.total), 0)
    .toFixed(2);

  return {
    uuid: p.uuid,
    token: p.token,
    status: p.status,
    title: p.title,
    executiveSummary: p.executiveSummary,
    coverageHighlights: p.coverageHighlights,
    splitByNamedInsured: p.splitByNamedInsured,
    namedInsuredSplits: coerceSplits(p.namedInsuredSplits),
    paymentProposalUrl: p.paymentProposalUrl,
    programCheckoutUrl: p.programCheckoutUrl,
    presentedAt: p.presentedAt?.toISOString() ?? null,
    acceptedAt: p.acceptedAt?.toISOString() ?? null,
    customer: {
      businessName: p.customer.businessName,
      firstName: p.customer.firstName ?? "",
      lastName: p.customer.lastName ?? "",
      email: p.customer.email,
      addressLine1: p.customer.addressLine1,
      city: p.customer.city,
      state: p.customer.state,
      zipCode: p.customer.zipCode,
    },
    contact: {
      name: p.contactName,
      email: p.contactEmail,
      phone: p.contactPhone,
    },
    locations: p.submission.locations,
    quotes,
    totalPremium,
  };
}

/**
 * Customer-side poll: hits Ascend to see whether the program has been
 * purchased. If so, flip the proposal to accepted. Returns the latest status.
 */
export async function refreshProposalFromAscendByToken(
  token: string,
): Promise<{ status: string; ascendStatus: string | null }> {
  const proposal = await db.proposal.findUnique({
    where: { token },
    select: { id: true, status: true, ascendProgramId: true },
  });
  if (!proposal) throw new Error("Proposal not found");
  if (!proposal.ascendProgramId) {
    return { status: proposal.status, ascendStatus: null };
  }

  const apiKey = process.env.ASCEND_API_KEY ?? "";
  const baseUrl =
    process.env.ASCEND_API_URL ?? "https://sandbox.api.useascend.com/v1";
  if (!apiKey) return { status: proposal.status, ascendStatus: null };

  const res = await fetch(`${baseUrl}/programs/${proposal.ascendProgramId}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) return { status: proposal.status, ascendStatus: null };
  const data = (await res.json()) as { status?: string };
  const ascendStatus = data.status ?? null;

  if (ascendStatus === "purchased" && proposal.status !== "accepted") {
    // Flip to accepted AND issue the policy/policies for the bundle.
    await acceptAndBindProposal(proposal.id);
    revalidatePath(`/proposal/${token}`);
    return { status: "accepted", ascendStatus };
  }
  return { status: proposal.status, ascendStatus };
}

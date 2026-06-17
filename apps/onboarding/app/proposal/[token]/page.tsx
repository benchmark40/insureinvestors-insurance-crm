import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientAccountPrompt } from "@/components/client-account-prompt";
import { getOnboardingAccountState } from "@/lib/actions/client";
import { getProposalByToken } from "@/lib/actions/proposals";

import { CheckoutPanel } from "./checkout-panel";
import { QuoteBreakdown } from "./quote-breakdown";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await getProposalByToken(token);
  if (!proposal) notFound();

  const accountState = await getOnboardingAccountState(proposal.customer.email);

  const insuredName =
    proposal.customer.businessName ||
    `${proposal.customer.firstName} ${proposal.customer.lastName}`.trim() ||
    "Your business";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Insurance proposal
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            {proposal.title || `Proposal for ${insuredName}`}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Prepared for{" "}
            <span className="text-foreground font-medium">{insuredName}</span>
            {proposal.presentedAt && (
              <> · sent {formatDate(proposal.presentedAt)}</>
            )}
          </p>
        </div>
        <Badge
          variant={
            proposal.status === "accepted"
              ? "default"
              : proposal.status === "presented"
                ? "secondary"
                : "outline"
          }
          className="capitalize"
        >
          {proposal.status}
        </Badge>
      </div>

      {proposal.executiveSummary && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm whitespace-pre-wrap">
              {proposal.executiveSummary}
            </p>
          </CardContent>
        </Card>
      )}

      <QuoteBreakdown
        locations={proposal.locations}
        quotes={proposal.quotes}
        splitByNamedInsured={proposal.splitByNamedInsured}
        namedInsuredSplits={proposal.namedInsuredSplits}
      />

      {proposal.coverageHighlights && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Coverage highlights</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {proposal.coverageHighlights}
            </pre>
          </CardContent>
        </Card>
      )}

      <CheckoutPanel
        token={proposal.token}
        status={proposal.status}
        programCheckoutUrl={proposal.programCheckoutUrl}
        paymentProposalUrl={proposal.paymentProposalUrl}
      />

      {proposal.customer.email && !accountState.clientSession && (
        <div className="mt-6 flex justify-center">
          <ClientAccountPrompt
            email={proposal.customer.email}
            exists={accountState.exists}
            signedIn={false}
            link={{ kind: "proposal", token: proposal.token }}
          />
        </div>
      )}
    </main>
  );
}

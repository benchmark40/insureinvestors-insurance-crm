"use client";

import { useState, useTransition } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  Copy,
  FilePlus2,
  FileText,
  Inbox,
  Mail,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { CarrierComposer } from "@/components/submission/carrier-composer";
import {
  ProposalBuilderDialog,
  type ProposalBuilderLocation,
  type ProposalBuilderQuote,
} from "@/components/submission/proposal-builder-dialog";
import { QuoteEntryDialog } from "@/components/submission/quote-entry-dialog";
import { SubmissionThreadDialog } from "@/components/submission/submission-thread-dialog";
import { acceptCarrierQuote, rejectCarrierQuote } from "@/lib/actions/quotes";
import {
  cancelProposal,
  presentProposal,
  type ProposalListItem,
} from "@/lib/actions/proposals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Personnel = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  carrier: { id: number; name: string };
};

type Recipient = {
  id: number;
  status: string;
  sentAt: string | null;
  emailSubject: string;
  conversationId: string | null;
  lastReplyAt: string | null;
  replyCount: number;
  personnel: Personnel;
};

type Quote = {
  id: number;
  status: string;
  quoteNumber: string;
  premium: string;
  policyFee: string;
  otherFees: string;
  taxes: string;
  commissionPct: string;
  commissionAmount: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  receivedAt: string | null;
  carrier: { id: number; name: string };
  recipientId: number | null;
};

const RECIPIENT_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  sent: "secondary",
  failed: "destructive",
  replied: "default",
  declined: "destructive",
  received_quote: "default",
};

const QUOTE_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  received: "default",
  reviewing: "secondary",
  accepted: "default",
  rejected: "destructive",
  withdrawn: "outline",
  bound: "default",
  expired: "outline",
};

function formatUSD(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSentAt(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CarriersTab({
  submissionUuid,
  customerName,
  recipients,
  quotes,
  proposals,
  locations,
  submissionStatus,
  devMode = false,
}: {
  submissionUuid: string;
  customerName: string;
  recipients: Recipient[];
  quotes: Quote[];
  proposals: ProposalListItem[];
  locations: ProposalBuilderLocation[];
  submissionStatus: string;
  devMode?: boolean;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [proposalBuilderOpen, setProposalBuilderOpen] = useState(false);
  const [quoteFor, setQuoteFor] = useState<Recipient | null>(null);
  const [threadFor, setThreadFor] = useState<Recipient | null>(null);
  const [binding, startBinding] = useTransition();
  const [proposalBusy, startProposalAction] = useTransition();

  const acceptedQuotes: ProposalBuilderQuote[] = quotes
    .filter((q) => q.status === "accepted")
    .map((q) => ({
      id: q.id,
      carrierName: q.carrier.name,
      premium: q.premium,
      quoteNumber: q.quoteNumber,
    }));

  // Map recipientId -> quote for quick lookup
  const quotesByRecipient = new Map<number, Quote>();
  for (const q of quotes) {
    if (q.recipientId) quotesByRecipient.set(q.recipientId, q);
  }

  const isBound = submissionStatus === "bound";

  function onAccept(quote: Quote) {
    startBinding(async () => {
      try {
        await acceptCarrierQuote(quote.id);
        toast.success(`${quote.carrier.name} quote accepted`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't update quote.",
        );
      }
    });
  }

  function onReject(quote: Quote) {
    startBinding(async () => {
      try {
        await rejectCarrierQuote(quote.id);
        toast.success(`${quote.carrier.name} quote rejected`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't update quote.",
        );
      }
    });
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle>Carrier outreach</CardTitle>
            <CardDescription>
              Who this submission was sent to and what came back.
            </CardDescription>
          </div>
          <Button
            onClick={() => setComposerOpen(true)}
            disabled={isBound}
          >
            <Mail data-icon="inline-start" />
            Email carriers
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recipients.length === 0 ? (
            <div className="px-6 py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Mail />
                  </EmptyMedia>
                  <EmptyTitle>No carriers yet</EmptyTitle>
                  <EmptyDescription>
                    Send this submission to your carrier panel to start
                    collecting quotes.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setComposerOpen(true)}>
                    <Mail data-icon="inline-start" />
                    Email carriers
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => {
                  const hasQuote = quotesByRecipient.has(r.id);
                  return (
                    <TableRow
                      key={r.id}
                      className="hover:bg-accent/30 cursor-pointer"
                      onClick={() => setThreadFor(r)}
                    >
                      <TableCell className="font-medium">
                        {r.personnel.carrier.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {r.personnel.firstName} {r.personnel.lastName}
                        </div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {r.personnel.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              RECIPIENT_STATUS_VARIANT[r.status] ?? "outline"
                            }
                          >
                            {r.status.replace("_", " ")}
                          </Badge>
                          {r.replyCount > 0 && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Inbox className="size-3" />
                              {r.replyCount}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSentAt(r.sentAt)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {hasQuote ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Quote logged
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setQuoteFor(r)}
                            disabled={isBound}
                          >
                            <FileText data-icon="inline-start" />
                            Log quote
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quotes received</CardTitle>
            <CardDescription>
              Side-by-side comparison. Accept a quote to bundle it into a
              proposal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Quote #</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Taxes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const total =
                    Number(q.premium) +
                    Number(q.policyFee) +
                    Number(q.otherFees) +
                    Number(q.taxes);
                  const isBoundQuote = q.status === "bound";
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        {q.carrier.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {q.quoteNumber || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUSD(q.premium)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUSD(
                          Number(q.policyFee) + Number(q.otherFees),
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUSD(q.taxes)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatUSD(total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {q.commissionPct}% · {formatUSD(q.commissionAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(q.effectiveDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={QUOTE_STATUS_VARIANT[q.status] ?? "outline"}
                        >
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isBoundQuote ? (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="size-3" />
                            Bound
                          </Badge>
                        ) : q.status === "rejected" ? (
                          <Badge variant="outline" className="gap-1">
                            <X className="size-3" />
                            Rejected
                          </Badge>
                        ) : q.status === "accepted" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReject(q)}
                              disabled={binding || isBound}
                            >
                              <X data-icon="inline-start" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReject(q)}
                              disabled={binding || isBound}
                            >
                              <X data-icon="inline-start" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onAccept(q)}
                              disabled={binding || isBound}
                            >
                              <Check data-icon="inline-start" />
                              Accept
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle>Proposals</CardTitle>
            <CardDescription>
              Bundle accepted quotes and present them to the client via Ascend
              checkout.
            </CardDescription>
          </div>
          <Button
            onClick={() => setProposalBuilderOpen(true)}
            disabled={acceptedQuotes.length === 0 || isBound}
            variant={proposals.length === 0 ? "default" : "outline"}
          >
            <FilePlus2 data-icon="inline-start" />
            New proposal
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {proposals.length === 0 ? (
            <p className="text-muted-foreground px-6 py-6 text-sm">
              {acceptedQuotes.length === 0
                ? "Accept at least one quote on the Quotes received table to build a proposal."
                : "No proposals yet — click “New proposal” to bundle and present."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quotes</TableHead>
                  <TableHead className="text-right">Total premium</TableHead>
                  <TableHead>Presented</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.title || "Untitled proposal"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "accepted"
                            ? "default"
                            : p.status === "presented"
                              ? "secondary"
                              : p.status === "cancelled" ||
                                  p.status === "declined" ||
                                  p.status === "expired"
                                ? "outline"
                                : "outline"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.quoteCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUSD(p.totalPremium)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSentAt(p.presentedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {p.status === "draft" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              startProposalAction(async () => {
                                try {
                                  await presentProposal(p.id);
                                  toast.success("Proposal presented");
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Couldn't present",
                                  );
                                }
                              });
                            }}
                            disabled={proposalBusy}
                          >
                            <Send data-icon="inline-start" />
                            Present
                          </Button>
                        ) : (
                          <ProposalLinkButtons proposal={p} submissionUuid={submissionUuid} />
                        )}
                        {p.status !== "accepted" &&
                          p.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!confirm("Cancel this proposal?")) return;
                                startProposalAction(async () => {
                                  try {
                                    await cancelProposal(p.id);
                                    toast.success("Proposal cancelled");
                                  } catch (err) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Couldn't cancel",
                                    );
                                  }
                                });
                              }}
                              disabled={proposalBusy}
                            >
                              <Ban data-icon="inline-start" />
                              Cancel
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CarrierComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        submissionUuid={submissionUuid}
        customerName={customerName}
      />
      {quoteFor && (
        <QuoteEntryDialog
          open={!!quoteFor}
          onOpenChange={(o) => !o && setQuoteFor(null)}
          recipientId={quoteFor.id}
          carrierName={quoteFor.personnel.carrier.name}
        />
      )}
      <SubmissionThreadDialog
        open={!!threadFor}
        onOpenChange={(o) => !o && setThreadFor(null)}
        submissionUuid={submissionUuid}
        recipientId={threadFor?.id ?? null}
        devMode={devMode}
      />
      <ProposalBuilderDialog
        open={proposalBuilderOpen}
        onOpenChange={setProposalBuilderOpen}
        submissionUuid={submissionUuid}
        customerName={customerName}
        acceptedQuotes={acceptedQuotes}
        locations={locations}
      />
    </div>
  );
}

function ProposalLinkButtons({
  proposal,
  submissionUuid,
}: {
  proposal: ProposalListItem;
  submissionUuid: string;
}) {
  function copyClientLink() {
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    // Best guess at the onboarding origin in dev. In prod the user copies and
    // pastes into a real email. We default to port 3000 if we're on 3001.
    const onboarding =
      base.includes(":3001") ? base.replace(":3001", ":3000") : base;
    const url = `${onboarding}/proposal/${proposal.token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Client checkout link copied"),
      () => toast.error("Couldn't copy link"),
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={copyClientLink}
        title={`Submission ${submissionUuid.slice(0, 8)}`}
      >
        <Copy data-icon="inline-start" />
        Copy link
      </Button>
      {proposal.programCheckoutUrl && (
        <Button
          size="sm"
          variant="outline"
          render={
            <a
              href={proposal.programCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          Ascend checkout
        </Button>
      )}
    </>
  );
}

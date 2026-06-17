import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { db } from "@insureinvestorsv2/db";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { SubmitClaimDialog } from "@/components/submit-claim-dialog";
import { requireClient } from "@/lib/require-client";

function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalSubmissionDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const { user } = await requireClient();

  const submission = await db.submission.findUnique({
    where: { uuid },
    include: {
      customer: true,
      locations: {
        orderBy: { locationNumber: "asc" },
        include: { buildings: { orderBy: { buildingNumber: "asc" } } },
      },
      // Only proposals the broker has actually sent the client.
      proposals: {
        where: { status: { in: ["presented", "accepted"] } },
        orderBy: { createdAt: "desc" },
        include: {
          quotes: { include: { carrierQuote: { include: { carrier: true } } } },
        },
      },
      boundPolicies: {
        orderBy: { createdAt: "desc" },
        include: { carrier: true, boundQuote: true },
      },
    },
  });

  // Only the owning client may view it.
  if (!submission || submission.customer.email !== user.email) notFound();

  const buildingCount = submission.locations.reduce(
    (n, l) => n + l.buildings.length,
    0,
  );
  const title =
    submission.customer.businessName ||
    submission.namedInsured ||
    "Untitled submission";

  const policies = submission.boundPolicies;
  const proposals = submission.proposals;
  const awaitingPayment = proposals.some((p) => p.status === "presented");
  const hasPolicy = policies.length > 0;

  const propertyLines = submission.locations.map(
    (loc) =>
      [loc.addressLine1, loc.city, loc.state, loc.zipCode]
        .filter(Boolean)
        .join(", ") || `Property ${loc.locationNumber}`,
  );

  // Per-proposal total = sum of its quotes' premium + fees + taxes.
  const proposalTotal = (p: (typeof proposals)[number]) =>
    p.quotes.reduce((sum, pq) => {
      const q = pq.carrierQuote;
      return (
        sum +
        Number(q.premium) +
        Number(q.policyFee) +
        Number(q.otherFees) +
        Number(q.taxes)
      );
    }, 0);

  const stage = stageInfo(submission.status, { awaitingPayment, hasPolicy });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/portal/submissions" />}
      >
        <ArrowLeft data-icon="inline-start" />
        All submissions
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <SubmissionStatusBadge status={submission.status} />
        <Badge variant="outline" className="font-mono">
          #{submission.uuid.slice(0, 8)}
        </Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <span>
          {submission.locations.length} propert
          {submission.locations.length === 1 ? "y" : "ies"}
        </span>
        <span>·</span>
        <span>
          {buildingCount} building{buildingCount === 1 ? "" : "s"}
        </span>
        <span>·</span>
        <span>Submitted {formatDate(submission.createdAt)}</span>
      </div>

      {/* Stage callout — what's happening right now. */}
      {stage && (
        <Card>
          <CardContent className="flex items-start gap-3 py-4">
            <stage.icon className={`mt-0.5 size-5 shrink-0 ${stage.color}`} />
            <div>
              <p className="text-sm font-semibold">{stage.title}</p>
              <p className="text-muted-foreground text-sm">{stage.body}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issued coverage. */}
      {hasPolicy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-green-600" />
              Your coverage
            </CardTitle>
            <CardDescription>
              {policies.length} polic{policies.length === 1 ? "y" : "ies"} issued
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {policies.map((p) => (
              <div
                key={p.id}
                className="flex items-baseline justify-between gap-4 px-6 py-4"
              >
                <div>
                  <div className="text-sm font-semibold">{p.carrier.name}</div>
                  <div className="text-muted-foreground text-xs">
                    Policy {p.policyNumber || "—"} · {formatDate(p.inceptionDate)}{" "}
                    → {formatDate(p.expirationDate)}
                  </div>
                </div>
                <div className="text-right">
                  {p.boundQuote && (
                    <div className="text-sm font-semibold tabular-nums">
                      {formatUSD(Number(p.boundQuote.premium))}
                    </div>
                  )}
                  <Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <span className="text-muted-foreground text-xs">
                Need to report damage or a loss?
              </span>
              <SubmitClaimDialog properties={propertyLines} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal(s) the broker sent — review & pay, or receipt once purchased. */}
      {proposals.map((p) => {
        const total = proposalTotal(p);
        const carriers = p.quotes
          .map((pq) => pq.carrierQuote.carrier.name)
          .filter(Boolean);
        const isPresented = p.status === "presented";
        return (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="text-primary size-4" />
                {p.title || "Your proposal"}
                {p.status === "accepted" && (
                  <Badge variant="secondary">
                    <CheckCircle2 data-icon="inline-start" />
                    Purchased
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {p.quotes.length} quote{p.quotes.length === 1 ? "" : "s"}
                {carriers.length > 0 && <> · {carriers.join(", ")}</>}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pb-6">
              <div>
                <div className="text-2xl font-semibold tabular-nums">
                  {formatUSD(total)}
                </div>
                <div className="text-muted-foreground text-xs">
                  total annual premium
                </div>
              </div>
              <Button
                variant={isPresented ? "default" : "outline"}
                nativeButton={false}
                render={<Link href={`/proposal/${p.token}`} />}
              >
                {isPresented ? "Review & pay" : "View proposal"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Properties — always shown. */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Properties</h2>
        {submission.locations.map((loc) => {
          const line = [loc.addressLine1, loc.city, loc.state, loc.zipCode]
            .filter(Boolean)
            .join(", ");
          return (
            <Card key={loc.id}>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="text-primary size-4" />
                  {line || `Property ${loc.locationNumber}`}
                </CardTitle>
                {loc.namedInsured && (
                  <CardDescription>
                    Named insured: {loc.namedInsured}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="py-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Building2 className="size-4" />
                  {loc.buildings.length} building
                  {loc.buildings.length === 1 ? "" : "s"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type Stage = {
  icon: typeof Clock;
  color: string;
  title: string;
  body: string;
};

/** Plain-language "where is my quote" message for the client, by status. */
function stageInfo(
  status: string,
  { awaitingPayment, hasPolicy }: { awaitingPayment: boolean; hasPolicy: boolean },
): Stage | null {
  if (hasPolicy) {
    return {
      icon: ShieldCheck,
      color: "text-green-600",
      title: "You're covered",
      body: "Your policy has been issued — the details are below.",
    };
  }
  if (awaitingPayment) {
    return {
      icon: FileText,
      color: "text-amber-500",
      title: "Your proposal is ready",
      body: "Review your quote below and complete payment to bind coverage.",
    };
  }
  switch (status) {
    case "draft":
      return {
        icon: Clock,
        color: "text-muted-foreground",
        title: "Not finished yet",
        body: "This submission hasn't been completed.",
      };
    case "ready":
      return {
        icon: Clock,
        color: "text-blue-500",
        title: "Submission received",
        body: "We're getting your submission in front of carriers now.",
      };
    case "sent":
    case "partial":
      return {
        icon: Clock,
        color: "text-blue-500",
        title: "With our carriers",
        body: "We've sent your details to our carrier panel. Quotes usually come back within 24–48 hours.",
      };
    case "quoted":
      return {
        icon: Clock,
        color: "text-blue-500",
        title: "Quotes are in",
        body: "Your broker is preparing your proposal — you'll be able to review and pay shortly.",
      };
    case "declined":
      return {
        icon: Clock,
        color: "text-destructive",
        title: "No terms available",
        body: "Carriers couldn't offer terms for this submission. Your broker will reach out with options.",
      };
    case "expired":
      return {
        icon: Clock,
        color: "text-muted-foreground",
        title: "Expired",
        body: "This submission has expired. Start a new quote whenever you're ready.",
      };
    default:
      return null;
  }
}

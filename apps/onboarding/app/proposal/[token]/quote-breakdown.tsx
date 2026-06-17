"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LocationLite = {
  id: number;
  locationNumber: number;
  namedInsured: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
};

type QuoteLite = {
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
  locations: LocationLite[];
};

type Props = {
  locations: LocationLite[];
  quotes: QuoteLite[];
  splitByNamedInsured: boolean;
  namedInsuredSplits: Record<string, number>;
};

const UNSPECIFIED = "Unspecified";
const insuredOf = (ni: string) => ni.trim() || UNSPECIFIED;

function formatUSD(s: string): string {
  const n = Number(s);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function QuoteBreakdown({
  locations,
  quotes,
  splitByNamedInsured,
  namedInsuredSplits,
}: Props) {
  // Distinct named insureds across the proposal's properties, in first-seen order.
  const insureds = useMemo(() => {
    const seen: string[] = [];
    for (const l of locations) {
      const key = insuredOf(l.namedInsured);
      if (!seen.includes(key)) seen.push(key);
    }
    return seen;
  }, [locations]);

  // An empty selection means "All" (no filter). Clicking a chip selects that
  // named insured; clicking it again clears it back to All.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const hasFilter = insureds.length > 1;
  const showingAll = selected.size === 0;

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const isOn = (key: string) => showingAll || selected.has(key);

  // Properties to show, grouped by named insured.
  const groups = useMemo(() => {
    return insureds
      .filter((key) => isOn(key))
      .map((key) => ({
        insured: key,
        locations: locations.filter((l) => insuredOf(l.namedInsured) === key),
      }))
      .filter((g) => g.locations.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insureds, locations, selected]);

  // A quote is shown if it covers at least one selected property. A quote with
  // no specific locations covers the whole submission, so it's always shown.
  const shownQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (q.locations.length === 0) return true;
      return q.locations.some((l) => isOn(insuredOf(l.namedInsured)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, selected]);

  const shownTotal = shownQuotes
    .reduce((sum, q) => sum + Number(q.total), 0)
    .toFixed(2);

  // Presentation-only split: show each named insured's manual allocation.
  const splitOn = splitByNamedInsured && insureds.length >= 2;
  const allocationOf = (key: string) => namedInsuredSplits[key] ?? 0;
  const selectedInsureds = showingAll
    ? insureds
    : insureds.filter((k) => selected.has(k));
  const allocatedTotalAll = insureds.reduce((s, k) => s + allocationOf(k), 0);
  const selectedAllocation = selectedInsureds.reduce(
    (s, k) => s + allocationOf(k),
    0,
  );

  // When splitting and the client has filtered to specific insureds, the
  // headline shows their allocated share rather than the bundled carrier total.
  const showAllocationTotal = splitOn && !showingAll;
  const footerLabel = showAllocationTotal
    ? `Amount for ${selectedInsureds.join(", ")}`
    : showingAll
      ? "Bundled total"
      : "Selected total";
  const footerValue = showAllocationTotal
    ? selectedAllocation.toFixed(2)
    : shownTotal;

  return (
    <>
      {hasFilter && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter by named insured</CardTitle>
            <CardDescription>
              See how this proposal breaks up across the insured entities on your
              properties.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pb-6">
            <Button
              variant={showingAll ? "default" : "outline"}
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              All
            </Button>
            {insureds.map((key) => (
              <Button
                key={key}
                variant={selected.has(key) ? "default" : "outline"}
                size="sm"
                onClick={() => toggle(key)}
              >
                {key}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {splitOn && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Amount due by named insured
            </CardTitle>
            <CardDescription>
              How this proposal splits across the insured entities on your
              properties. The full amount is still billed together at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {insureds.map((key) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between px-6 py-2.5 text-sm",
                    !isOn(key) && "opacity-40",
                  )}
                >
                  <span className="font-medium">{key}</span>
                  <span className="tabular-nums">
                    {allocationOf(key)
                      ? formatUSD(String(allocationOf(key)))
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="bg-muted/40 flex items-center justify-between px-6 py-3 text-sm">
              <span className="text-muted-foreground">Total allocated</span>
              <span className="font-semibold tabular-nums">
                {formatUSD(String(allocatedTotalAll))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {locations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Properties on this proposal
            </CardTitle>
            {hasFilter && (
              <CardDescription>
                Grouped by named insured
                {!showingAll && " · filtered"}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {groups.map((g) => (
              <div key={g.insured}>
                {hasFilter && (
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-sm font-semibold">{g.insured}</span>
                    <Badge variant="secondary" className="text-[11px]">
                      {g.locations.length} propert
                      {g.locations.length === 1 ? "y" : "ies"}
                    </Badge>
                  </div>
                )}
                <div className="space-y-1.5">
                  {g.locations.map((l) => (
                    <div key={l.id} className="text-sm">
                      <span className="text-muted-foreground font-mono text-xs">
                        Loc {l.locationNumber} ·{" "}
                      </span>
                      {l.addressLine1}, {l.city} {l.state} {l.zipCode}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Quotes</CardTitle>
          <CardDescription>
            {shownQuotes.length} carrier{shownQuotes.length === 1 ? "" : "s"}
            {!showingAll ? " covering the selected properties" : " in this bundle"}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {shownQuotes.map((q) => {
            // When filtering, show only the covered properties that match.
            const covered =
              q.locations.length === 0
                ? []
                : q.locations.filter((l) => isOn(insuredOf(l.namedInsured)));
            return (
              <div key={q.id} className="px-6 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{q.carrierName}</div>
                    <div className="text-muted-foreground text-xs">
                      {q.quoteNumber && <>Quote {q.quoteNumber} · </>}
                      {q.effectiveDate && (
                        <>
                          {formatDate(q.effectiveDate)} →{" "}
                          {formatDate(q.expirationDate)}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold tabular-nums">
                      {formatUSD(q.total)}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      total annual
                    </div>
                  </div>
                </div>
                {q.locations.length === 0 ? (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Whole submission — covers all {locations.length} properties
                  </div>
                ) : (
                  <div className="text-muted-foreground mt-1 text-xs">
                    Covers {covered.length} propert
                    {covered.length === 1 ? "y" : "ies"}:{" "}
                    {covered
                      .map(
                        (l) =>
                          `Loc ${l.locationNumber} (${insuredOf(l.namedInsured)})`,
                      )
                      .join(" · ")}
                  </div>
                )}
                <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
                  <div>
                    Premium{" "}
                    <span className="text-foreground tabular-nums">
                      {formatUSD(q.premium)}
                    </span>
                  </div>
                  <div>
                    Policy fee{" "}
                    <span className="text-foreground tabular-nums">
                      {formatUSD(q.policyFee)}
                    </span>
                  </div>
                  <div>
                    Other fees{" "}
                    <span className="text-foreground tabular-nums">
                      {formatUSD(q.otherFees)}
                    </span>
                  </div>
                  <div>
                    Taxes{" "}
                    <span className="text-foreground tabular-nums">
                      {formatUSD(q.taxes)}
                    </span>
                  </div>
                </div>
                {q.notes && (
                  <p className="text-muted-foreground mt-2 text-xs italic">
                    {q.notes}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
        <Separator />
        <div className="bg-muted/40 flex items-center justify-between px-6 py-3 text-sm">
          <span className="text-muted-foreground">{footerLabel}</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatUSD(footerValue)}
          </span>
        </div>
      </Card>
    </>
  );
}

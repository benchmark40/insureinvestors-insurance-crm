"use client";

import { useMemo, useState, useTransition } from "react";
import { FilePlus2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  createDraftProposal,
  presentProposal,
} from "@/lib/actions/proposals";

export type ProposalBuilderQuote = {
  id: number;
  carrierName: string;
  premium: string;
  quoteNumber: string;
};

export type ProposalBuilderLocation = {
  id: number;
  label: string; // "Loc 1 — 123 Main St"
  namedInsured: string;
};

const UNSPECIFIED = "Unspecified";
const insuredOf = (ni: string) => ni.trim() || UNSPECIFIED;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionUuid: string;
  customerName: string;
  acceptedQuotes: ProposalBuilderQuote[];
  locations: ProposalBuilderLocation[];
};

export function ProposalBuilderDialog({
  open,
  onOpenChange,
  submissionUuid,
  customerName,
  acceptedQuotes,
  locations,
}: Props) {
  const [title, setTitle] = useState(`Proposal for ${customerName}`);
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [coverageHighlights, setCoverageHighlights] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(acceptedQuotes.map((q) => q.id)),
  );
  // Per-quote selected property IDs. Empty Set = "whole submission".
  const [locationsByQuote, setLocationsByQuote] = useState<
    Record<number, Set<number>>
  >({});
  // Presentation-only premium split by named insured (manual dollar amounts).
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [isSaving, startSave] = useTransition();
  const [isPresenting, startPresent] = useTransition();

  // Distinct named insureds across the proposal's properties (first-seen order)
  // and how many properties each one covers.
  const { insureds, propertyCount } = useMemo(() => {
    const seen: string[] = [];
    const counts: Record<string, number> = {};
    for (const l of locations) {
      const key = insuredOf(l.namedInsured);
      if (!seen.includes(key)) seen.push(key);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return { insureds: seen, propertyCount: counts };
  }, [locations]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleLocation(quoteId: number, locationId: number) {
    setLocationsByQuote((prev) => {
      const next = new Set(prev[quoteId] ?? []);
      if (next.has(locationId)) next.delete(locationId);
      else next.add(locationId);
      return { ...prev, [quoteId]: next };
    });
  }

  function setAllLocations(quoteId: number, locationIds: number[]) {
    setLocationsByQuote((prev) => ({
      ...prev,
      [quoteId]: new Set(locationIds),
    }));
  }

  function clearLocations(quoteId: number) {
    setLocationsByQuote((prev) => ({ ...prev, [quoteId]: new Set() }));
  }

  function onToggleSplit(on: boolean) {
    setSplitEnabled(on);
    if (on) {
      // Seed an even split of the bundled premium as a starting point the
      // broker can adjust.
      const bundled = Array.from(selected)
        .map((id) => Number(acceptedQuotes.find((q) => q.id === id)?.premium ?? 0))
        .reduce((s, n) => s + n, 0);
      const each = insureds.length ? bundled / insureds.length : 0;
      const seed: Record<string, string> = {};
      insureds.forEach((k) => {
        seed[k] = each ? each.toFixed(2) : "";
      });
      setSplits(seed);
    }
  }

  function setSplit(key: string, value: string) {
    setSplits((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDraft(): Promise<number | null> {
    if (selected.size === 0) {
      toast.error("Pick at least one accepted quote.");
      return null;
    }
    if (!contactEmail.trim()) {
      toast.error("Contact email is required for the Ascend handoff.");
      return null;
    }
    try {
      const id = await createDraftProposal(submissionUuid, {
        title,
        executiveSummary,
        coverageHighlights,
        contactName,
        contactEmail,
        contactPhone,
        quotes: Array.from(selected).map((qid) => ({
          carrierQuoteId: qid,
          locationIds: Array.from(locationsByQuote[qid] ?? []),
        })),
        splitByNamedInsured: splitEnabled,
        namedInsuredSplits: splitEnabled
          ? Object.fromEntries(
              Object.entries(splits)
                .map(([k, v]) => [k, Number(v)] as const)
                .filter(([, n]) => Number.isFinite(n) && n > 0),
            )
          : {},
      });
      return id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save draft");
      return null;
    }
  }

  function onSaveDraft() {
    startSave(async () => {
      const id = await saveDraft();
      if (id != null) {
        toast.success("Draft proposal saved");
        onOpenChange(false);
      }
    });
  }

  function onPresent() {
    startPresent(async () => {
      const id = await saveDraft();
      if (id == null) return;
      try {
        await presentProposal(id);
        toast.success("Proposal presented — Ascend checkout link is ready");
        onOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't present proposal",
        );
      }
    });
  }

  const totalPremium = Array.from(selected)
    .map((id) => acceptedQuotes.find((q) => q.id === id)?.premium ?? "0")
    .reduce((sum, p) => sum + Number(p), 0);

  const splitSum = Object.values(splits).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const splitMismatch =
    splitEnabled && Math.abs(splitSum - totalPremium) >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="size-5" />
            New proposal for {customerName}
          </DialogTitle>
          <DialogDescription>
            Bundle accepted quotes, tag them to properties, and present to the
            client via Ascend hosted checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Accepted quotes</FieldLabel>
              {acceptedQuotes.length === 0 ? (
                <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
                  No accepted quotes yet. Accept at least one quote on the
                  Carriers tab to build a proposal.
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {acceptedQuotes.map((q) => {
                    const isSelected = selected.has(q.id);
                    const locSet = locationsByQuote[q.id] ?? new Set<number>();
                    const allLocIds = locations.map((l) => l.id);
                    return (
                      <div key={q.id} className="px-3 py-2">
                        <Label
                          htmlFor={`pq-${q.id}`}
                          className="hover:bg-accent/30 flex cursor-pointer items-center gap-3 text-sm"
                        >
                          <Checkbox
                            id={`pq-${q.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggle(q.id)}
                          />
                          <div className="flex flex-1 flex-col">
                            <span className="font-medium">{q.carrierName}</span>
                            <span className="text-muted-foreground text-xs">
                              {q.quoteNumber || "—"} · $
                              {Number(q.premium).toLocaleString()}
                            </span>
                          </div>
                        </Label>
                        {isSelected && locations.length > 0 && (
                          <div className="mt-2 ml-7 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                              Properties
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                locSet.size === 0
                                  ? setAllLocations(q.id, allLocIds)
                                  : clearLocations(q.id)
                              }
                              className="text-primary hover:underline text-[11px]"
                            >
                              {locSet.size === 0
                                ? "Whole submission"
                                : locSet.size === locations.length
                                  ? "All properties"
                                  : `${locSet.size} of ${locations.length}`}
                            </button>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {locations.map((loc) => {
                                const checked = locSet.has(loc.id);
                                return (
                                  <Label
                                    key={loc.id}
                                    htmlFor={`pq-${q.id}-loc-${loc.id}`}
                                    className="hover:bg-accent/30 flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px]"
                                  >
                                    <Checkbox
                                      id={`pq-${q.id}-loc-${loc.id}`}
                                      checked={checked}
                                      onCheckedChange={() =>
                                        toggleLocation(q.id, loc.id)
                                      }
                                    />
                                    <span className="truncate max-w-[160px]">
                                      {loc.label}
                                    </span>
                                  </Label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {selected.size > 0 && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {selected.size} quote{selected.size === 1 ? "" : "s"} ·{" "}
                  <span className="font-medium">
                    ${totalPremium.toLocaleString()}
                  </span>{" "}
                  total premium
                </p>
              )}
            </Field>

            {insureds.length >= 2 && (
              <Field>
                <Label
                  htmlFor="split-by-ni"
                  className="flex cursor-pointer items-center gap-2.5"
                >
                  <Checkbox
                    id="split-by-ni"
                    checked={splitEnabled}
                    onCheckedChange={(v) => onToggleSplit(Boolean(v))}
                  />
                  <span className="text-sm font-medium">
                    Split totals by named insured
                  </span>
                </Label>
                {splitEnabled && (
                  <div className="mt-1 space-y-2 rounded-md border p-3">
                    {insureds.map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 truncate text-sm">
                          {key}
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            ({propertyCount[key] ?? 0}{" "}
                            {(propertyCount[key] ?? 0) === 1
                              ? "property"
                              : "properties"}
                            )
                          </span>
                        </span>
                        <div className="relative w-40 shrink-0">
                          <span className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                            $
                          </span>
                          <Input
                            inputMode="decimal"
                            value={splits[key] ?? ""}
                            onChange={(e) => setSplit(key, e.target.value)}
                            placeholder="0.00"
                            className="h-9 pl-5 text-right tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t pt-2 text-xs">
                      <span className="text-muted-foreground">
                        Allocated ${splitSum.toLocaleString()} of $
                        {totalPremium.toLocaleString()} premium
                      </span>
                      {splitMismatch && (
                        <span className="text-amber-600 dark:text-amber-500">
                          Doesn&apos;t add up to the bundled total
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="proposal-title">Title</FieldLabel>
              <Input
                id="proposal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="proposal-summary">
                Executive summary
              </FieldLabel>
              <FieldDescription>
                A 1–3 sentence overview the client sees at the top of the
                proposal page.
              </FieldDescription>
              <Textarea
                id="proposal-summary"
                rows={3}
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                placeholder="We've put your account in front of three top markets…"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="proposal-highlights">
                Coverage highlights
              </FieldLabel>
              <FieldDescription>
                Bullet-style notes about what's covered. Markdown allowed.
              </FieldDescription>
              <Textarea
                id="proposal-highlights"
                rows={4}
                value={coverageHighlights}
                onChange={(e) => setCoverageHighlights(e.target.value)}
                placeholder={"- $5M building limit\n- Wind/hail included\n- $25k deductible"}
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="proposal-contact-name">
                  Contact name
                </FieldLabel>
                <Input
                  id="proposal-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="proposal-contact-email">
                  Contact email
                </FieldLabel>
                <Input
                  id="proposal-contact-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="proposal-contact-phone">Phone</FieldLabel>
                <Input
                  id="proposal-contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </div>

        <DialogFooter className="m-0 rounded-none border-t p-4">
          <DialogClose
            render={
              <Button
                variant="ghost"
                disabled={isSaving || isPresenting}
                nativeButton
              >
                Cancel
              </Button>
            }
          />
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSaving || isPresenting || selected.size === 0}
          >
            {isSaving && <Spinner data-icon="inline-start" />}
            Save draft
          </Button>
          <Button
            onClick={onPresent}
            disabled={isSaving || isPresenting || selected.size === 0}
          >
            {isPresenting && <Spinner data-icon="inline-start" />}
            {!isPresenting && <Send data-icon="inline-start" />}
            {isPresenting ? "Presenting…" : "Present to client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


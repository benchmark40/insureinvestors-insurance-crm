"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createCarrierQuote } from "@/lib/actions/quotes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: number;
  carrierName: string;
};

export function QuoteEntryDialog({
  open,
  onOpenChange,
  recipientId,
  carrierName,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [quoteNumber, setQuoteNumber] = useState("");
  const [premium, setPremium] = useState("");
  const [policyFee, setPolicyFee] = useState("");
  const [otherFees, setOtherFees] = useState("");
  const [taxes, setTaxes] = useState("");
  const [commissionPct, setCommissionPct] = useState("15");
  const [minimumEarnedPct, setMinimumEarnedPct] = useState("25");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!premium) {
      toast.error("Premium is required.");
      return;
    }
    startTransition(async () => {
      try {
        await createCarrierQuote(recipientId, {
          quoteNumber,
          premium: Number(premium) || 0,
          policyFee: Number(policyFee) || 0,
          otherFees: Number(otherFees) || 0,
          taxes: Number(taxes) || 0,
          commissionPct: Number(commissionPct) || 0,
          minimumEarnedPct: Number(minimumEarnedPct) || 0,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          notes,
        });
        toast.success("Quote logged");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save quote.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Log quote from {carrierName}</DialogTitle>
            <DialogDescription>
              Manual entry for now — paste the numbers from the carrier&apos;s
              quote letter.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="quoteNumber">Quote number</FieldLabel>
                  <Input
                    id="quoteNumber"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    placeholder="Carrier&apos;s reference"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="premium">Premium</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="premium"
                      type="number"
                      required
                      value={premium}
                      onChange={(e) => setPremium(e.target.value)}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="policyFee">Policy fee</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="policyFee"
                      type="number"
                      value={policyFee}
                      onChange={(e) => setPolicyFee(e.target.value)}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="otherFees">Other fees</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="otherFees"
                      type="number"
                      value={otherFees}
                      onChange={(e) => setOtherFees(e.target.value)}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="taxes">Taxes</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="taxes"
                      type="number"
                      value={taxes}
                      onChange={(e) => setTaxes(e.target.value)}
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="commissionPct">
                    Commission rate
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="commissionPct"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(e.target.value)}
                      placeholder="e.g. 15"
                    />
                    <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="minimumEarnedPct">
                    Minimum earned
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="minimumEarnedPct"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={minimumEarnedPct}
                      onChange={(e) => setMinimumEarnedPct(e.target.value)}
                      placeholder="e.g. 25"
                    />
                    <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="effectiveDate">Effective</FieldLabel>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="expirationDate">Expires</FieldLabel>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Subjectivities, special terms, anything to flag"
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="ghost" disabled={isPending} nativeButton>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              {isPending ? "Saving…" : "Save quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

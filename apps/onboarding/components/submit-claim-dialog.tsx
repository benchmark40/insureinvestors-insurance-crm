"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OptionSelect } from "@/components/forms/option-select";

const LOSS_TYPES = [
  "Fire / Smoke",
  "Water / Flood",
  "Wind / Hail",
  "Theft / Vandalism",
  "Liability / Injury",
  "Other",
] as const;

type Props = {
  /** Property address lines on the policy, for the "which property" dropdown. */
  properties: string[];
};

export function SubmitClaimDialog({ properties }: Props) {
  const [open, setOpen] = useState(false);
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [lossType, setLossType] = useState("");
  const [property, setProperty] = useState(properties[0] ?? "");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");

  function reset() {
    setDateOfLoss("");
    setLossType("");
    setProperty(properties[0] ?? "");
    setDescription("");
    setPhone("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Frontend only for now — no persistence yet.
    toast.success("Claim submitted — our team will reach out shortly.");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShieldAlert data-icon="inline-start" />
        Submit claim
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a claim</DialogTitle>
          <DialogDescription>
            Tell us what happened and we&apos;ll get a claims specialist on it.
          </DialogDescription>
        </DialogHeader>

        <form id="claim-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="claim-date">Date of loss</FieldLabel>
              <Input
                id="claim-date"
                type="date"
                required
                value={dateOfLoss}
                onChange={(e) => setDateOfLoss(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="claim-type">Type of loss</FieldLabel>
              <OptionSelect
                id="claim-type"
                value={lossType}
                options={LOSS_TYPES}
                placeholder="Select a type"
                onValueChange={setLossType}
              />
            </Field>

            {properties.length > 0 && (
              <Field>
                <FieldLabel htmlFor="claim-property">
                  Affected property
                </FieldLabel>
                <OptionSelect
                  id="claim-property"
                  value={property}
                  options={properties}
                  placeholder="Select a property"
                  onValueChange={setProperty}
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="claim-description">
                What happened?
              </FieldLabel>
              <Textarea
                id="claim-description"
                required
                rows={4}
                placeholder="Describe the damage or loss in as much detail as you can."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="claim-phone">
                Best contact number (optional)
              </FieldLabel>
              <Input
                id="claim-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button type="submit" form="claim-form">
            Submit claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { AddressLookup } from "@/components/forms/address-lookup";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/forms/date-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LINES_OF_BUSINESS } from "@insureinvestorsv2/lib";
import { updateCustomer } from "@/lib/actions/customers";
import { updateSubmission } from "@/lib/actions/submissions";

type Props = {
  submissionUuid: string;
  customer: {
    uuid: string;
    businessName: string;
    businessEntity: string;
    federalId: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  submission: {
    linesOfBusiness: string[];
    targetEffectiveDate: string | null;
  };
};

/** Midnight today — past dates before this are blocked on the start-date picker. */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CustomerInfoForm({ submissionUuid, customer, submission }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState(customer.businessName);
  const [businessEntity, setBusinessEntity] = useState(customer.businessEntity);
  const [federalId, setFederalId] = useState(customer.federalId);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [addressLine1, setAddressLine1] = useState(customer.addressLine1);
  const [addressLine2, setAddressLine2] = useState(customer.addressLine2);
  const [city, setCity] = useState(customer.city);
  const [state, setState] = useState(customer.state);
  const [zipCode, setZipCode] = useState(customer.zipCode);

  const [lobs, setLobs] = useState<string[]>(submission.linesOfBusiness);
  const [targetEffectiveDate, setTargetEffectiveDate] = useState<Date | undefined>(
    submission.targetEffectiveDate
      ? new Date(submission.targetEffectiveDate)
      : undefined,
  );

  // Browsers (and password managers) often autofill fields without firing the
  // change events React listens for. Pull any pre-filled DOM values into state
  // shortly after mount so controlled inputs don't get wiped on re-render and
  // the data actually saves. Only ever fills empty state — never clobbers edits.
  useEffect(() => {
    const setters: Record<string, (next: string) => void> = {
      businessName: setBusinessName,
      businessEntity: setBusinessEntity,
      federalId: setFederalId,
      email: setEmail,
      phone: setPhone,
      addressLine2: setAddressLine2,
      city: setCity,
      state: setState,
      zipCode: setZipCode,
    };
    const sync = () => {
      const form = formRef.current;
      if (!form) return;
      for (const [name, setter] of Object.entries(setters)) {
        const el = form.elements.namedItem(name) as HTMLInputElement | null;
        const value = el?.value ?? "";
        if (value) setter((prev) => (prev === value ? prev : value));
      }
    };
    // Run twice: once immediately, once after Chrome's delayed autofill pass.
    const t1 = window.setTimeout(sync, 100);
    const t2 = window.setTimeout(sync, 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Persist changes as the user goes (debounced) so a refresh keeps their work
  // even without hitting Continue — mirrors the autosave on the property step.
  // Skips the first render so we don't immediately re-save the data we loaded.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const t = window.setTimeout(() => {
      setSaving(true);
      void Promise.all([
        updateCustomer(customer.uuid, {
          businessName,
          businessEntity,
          federalId,
          email,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          zipCode,
        }),
        updateSubmission(submissionUuid, {
          linesOfBusiness: lobs,
          targetEffectiveDate: targetEffectiveDate ?? null,
          namedInsured: businessName,
          businessEntity,
          federalId,
        }),
      ])
        .catch((err) => console.error(err))
        .finally(() => setSaving(false));
    }, 800);
    return () => window.clearTimeout(t);
  }, [
    customer.uuid,
    submissionUuid,
    businessName,
    businessEntity,
    federalId,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    lobs,
    targetEffectiveDate,
  ]);

  function toggleLob(code: string) {
    setLobs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function applyPickedAddress(picked: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  }) {
    setAddressLine1(picked.addressLine1);
    setCity(picked.city);
    setState(picked.state);
    setZipCode(picked.zipCode);
  }

  function validate(values: { businessName: string; email: string }) {
    const next: Record<string, string> = {};
    if (!values.businessName) next.businessName = "Required.";
    if (!values.email) next.email = "Required.";
    if (lobs.length === 0) next.lobs = "Pick at least one line of business.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read straight from the DOM so browser-autofilled values are captured even
    // if their change events never reached React state.
    const fd = new FormData(e.currentTarget);
    const field = (name: string, fallback: string) => {
      const v = fd.get(name);
      return (typeof v === "string" ? v : fallback).trim();
    };
    const values = {
      businessName: field("businessName", businessName),
      businessEntity: field("businessEntity", businessEntity),
      federalId: field("federalId", federalId),
      email: field("email", email),
      phone: field("phone", phone),
      addressLine1: field("addressLine1", addressLine1),
      addressLine2: field("addressLine2", addressLine2),
      city: field("city", city),
      state: field("state", state),
      zipCode: field("zipCode", zipCode),
    };

    if (!validate(values)) return;
    startTransition(async () => {
      try {
        await Promise.all([
          updateCustomer(customer.uuid, values),
          updateSubmission(submissionUuid, {
            linesOfBusiness: lobs,
            targetEffectiveDate: targetEffectiveDate ?? null,
            namedInsured: values.businessName,
            businessEntity: values.businessEntity,
            federalId: values.federalId,
          }),
        ]);
        toast.success("Saved");
        router.push(`/${submissionUuid}/multy-property`);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't save. Please try again.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Your business</FieldLegend>
          <FieldGroup>
            <Field data-invalid={!!errors.businessName || undefined}>
              <FieldLabel htmlFor="businessName">Business name</FieldLabel>
              <Input
                id="businessName"
                name="businessName"
                autoComplete="organization"
                aria-invalid={!!errors.businessName || undefined}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Holdings LLC"
                required
              />
              {errors.businessName && (
                <FieldError>{errors.businessName}</FieldError>
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="businessEntity">Entity type</FieldLabel>
                <Input
                  id="businessEntity"
                  name="businessEntity"
                  autoComplete="off"
                  value={businessEntity}
                  onChange={(e) => setBusinessEntity(e.target.value)}
                  placeholder="LLC, Corp, etc."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="federalId">Federal ID (EIN)</FieldLabel>
                <Input
                  id="federalId"
                  name="federalId"
                  autoComplete="off"
                  value={federalId}
                  onChange={(e) => setFederalId(e.target.value)}
                  placeholder="XX-XXXXXXX"
                />
              </Field>
              <Field data-invalid={!!errors.email || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email || undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Mailing address</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
              <AddressLookup
                id="addressLine1"
                name="addressLine1"
                value={addressLine1}
                onChange={setAddressLine1}
                onPick={applyPickedAddress}
                placeholder="Start typing your business address…"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="addressLine2">Suite / unit</FieldLabel>
              <Input
                id="addressLine2"
                name="addressLine2"
                autoComplete="address-line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-6">
              <Field className="sm:col-span-3">
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
              <Field className="sm:col-span-1">
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="TX"
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="zipCode">Zip</FieldLabel>
                <Input
                  id="zipCode"
                  name="zipCode"
                  autoComplete="postal-code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet data-invalid={!!errors.lobs || undefined}>
          <FieldLegend>Coverage you need</FieldLegend>
          <FieldDescription>
            Pick all the lines of business you&apos;d like quoted.
          </FieldDescription>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINES_OF_BUSINESS.map((lob) => {
              const checked = lobs.includes(lob.code);
              return (
                <Label
                  key={lob.code}
                  htmlFor={`lob-${lob.code}`}
                  className="hover:bg-accent/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors"
                >
                  <Checkbox
                    id={`lob-${lob.code}`}
                    checked={checked}
                    onCheckedChange={() => toggleLob(lob.code)}
                  />
                  <span className="text-sm font-medium">{lob.label}</span>
                </Label>
              );
            })}
          </div>
          {errors.lobs && <FieldError>{errors.lobs}</FieldError>}
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Coverage start date</FieldLegend>
          <Field className="sm:max-w-xs">
            <FieldLabel htmlFor="targetEffectiveDate">
              When do you want coverage to start?
            </FieldLabel>
            <DatePicker
              id="targetEffectiveDate"
              value={targetEffectiveDate}
              onChange={setTargetEffectiveDate}
              placeholder="Pick a start date"
              disabled={{ before: startOfToday() }}
            />
          </Field>
        </FieldSet>
      </FieldGroup>

      <div className="mt-10 flex items-center justify-end gap-3">
        <span
          className="text-muted-foreground text-sm"
          aria-live="polite"
        >
          {saving ? "Saving…" : "All changes saved"}
        </span>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving…" : "Continue"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </form>
  );
}

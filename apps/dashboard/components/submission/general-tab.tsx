"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  Briefcase,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addSubmissionAdditionalInterest,
  addSubmissionContact,
  addSubmissionLossHistory,
  addSubmissionOtherInsurance,
  deleteSubmissionAdditionalInterest,
  deleteSubmissionContact,
  deleteSubmissionLossHistory,
  deleteSubmissionOtherInsurance,
  updateSubmissionAdditionalInterest,
  updateSubmissionContact,
  updateSubmissionLossHistory,
  updateSubmissionOtherInsurance,
} from "@/lib/actions/submission-children";
import { isAutofillChange } from "@/lib/autofill";

const CONTACT_ROLES = [
  "primary",
  "billing",
  "claims",
  "loss_control",
  "other",
] as const;
type ContactRole = (typeof CONTACT_ROLES)[number];

export type ContactRow = {
  id: number;
  role: ContactRole;
  name: string;
  title: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
};

export type OtherInsuranceRow = {
  id: number;
  carrierName: string;
  lineOfBusiness: string;
  policyNumber: string;
  planType: string;
  policyEffectiveDate: string | null;
  policyExpirationDate: string | null;
  premium: string | null;
  notes: string;
};

export type LossHistoryRow = {
  id: number;
  carrierName: string;
  policyNumber: string;
  lineOfBusiness: string;
  dateOfLoss: string | null;
  reportedDate: string | null;
  kindOfLoss: string;
  description: string;
  claimStatus: string;
  amountOfLoss: string | null;
  amountPaid: string | null;
  amountReserved: string | null;
};

export type AdditionalInterestRow = {
  id: number;
  interestType: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  descriptionOfOperations: string;
  isBonded: boolean;
  isLicensed: boolean;
  certificateRequired: boolean;
  certificateIssued: boolean;
  notes: string;
};

export function GeneralTab({
  submissionUuid,
  contacts,
  otherInsurance,
  lossHistory,
  additionalInterests,
}: {
  submissionUuid: string;
  contacts: ContactRow[];
  otherInsurance: OtherInsuranceRow[];
  lossHistory: LossHistoryRow[];
  additionalInterests: AdditionalInterestRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <PolicyContactsSection
        submissionUuid={submissionUuid}
        rows={contacts}
      />
      <CurrentInsuranceLossSection
        submissionUuid={submissionUuid}
        otherInsurance={otherInsurance}
        lossHistory={lossHistory}
      />
      <AdditionalInterestsSection
        submissionUuid={submissionUuid}
        rows={additionalInterests}
      />
    </div>
  );
}

// =============================================================================
// Section: Policy Contacts
// =============================================================================

function PolicyContactsSection({
  submissionUuid,
  rows,
}: {
  submissionUuid: string;
  rows: ContactRow[];
}) {
  const [, startTransition] = useTransition();
  const handleAdd = () =>
    startTransition(async () => {
      try {
        await addSubmissionContact(submissionUuid);
      } catch {
        toast.error("Couldn't add contact");
      }
    });

  return (
    <SectionCard
      icon={Users}
      title="Policy Contacts"
      action={
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus data-icon="inline-start" />
          Add contact
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Add primary, billing, claims, or loss-control contacts for this submission."
        />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {rows.map((row) => (
            <ContactRowEditor
              key={row.id}
              submissionUuid={submissionUuid}
              row={row}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function ContactRowEditor({
  submissionUuid,
  row,
}: {
  submissionUuid: string;
  row: ContactRow;
}) {
  const [, startTransition] = useTransition();
  const save = (patch: Partial<ContactRow>) => {
    startTransition(async () => {
      try {
        await updateSubmissionContact(submissionUuid, row.id, patch);
      } catch {
        toast.error("Couldn't save contact");
      }
    });
  };
  const remove = () =>
    startTransition(async () => {
      try {
        await deleteSubmissionContact(submissionUuid, row.id);
      } catch {
        toast.error("Couldn't delete contact");
      }
    });

  return (
    <RowCard onDelete={remove} ariaLabel="Delete contact">
      <div className="grid gap-3 sm:grid-cols-12">
        <FieldGroup className="sm:col-span-3" label="Role">
          <NativeSelect
            initial={row.role}
            options={CONTACT_ROLES.map((r) => ({ value: r, label: r }))}
            onCommit={(v) => save({ role: v as ContactRole })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-5" label="Name">
          <TextEdit
            initial={row.name}
            autoComplete="name"
            onCommit={(v) => save({ name: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Title">
          <TextEdit
            initial={row.title}
            autoComplete="organization-title"
            onCommit={(v) => save({ title: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-6" label="Email">
          <TextEdit
            initial={row.email}
            type="email"
            autoComplete="email"
            onCommit={(v) => save({ email: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-6" label="Phone">
          <TextEdit
            initial={row.phone}
            autoComplete="tel"
            onCommit={(v) => save({ phone: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-6" label="Street">
          <TextEdit
            initial={row.addressLine1}
            autoComplete="address-line1"
            onCommit={(v) => save({ addressLine1: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="City">
          <TextEdit
            initial={row.city}
            autoComplete="address-level2"
            onCommit={(v) => save({ city: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-1" label="State">
          <TextEdit
            initial={row.state}
            maxLength={2}
            autoComplete="address-level1"
            onCommit={(v) => save({ state: v.toUpperCase() })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-2" label="Zip">
          <TextEdit
            initial={row.zipCode}
            autoComplete="postal-code"
            onCommit={(v) => save({ zipCode: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-12" label="Notes">
          <TextEdit initial={row.notes} onCommit={(v) => save({ notes: v })} />
        </FieldGroup>
      </div>
    </RowCard>
  );
}

// =============================================================================
// Section: Current Insurance & Loss Data
// =============================================================================

function CurrentInsuranceLossSection({
  submissionUuid,
  otherInsurance,
  lossHistory,
}: {
  submissionUuid: string;
  otherInsurance: OtherInsuranceRow[];
  lossHistory: LossHistoryRow[];
}) {
  const [, startTransition] = useTransition();
  const handleAddInsurance = () =>
    startTransition(async () => {
      try {
        await addSubmissionOtherInsurance(submissionUuid);
      } catch {
        toast.error("Couldn't add insurance row");
      }
    });
  const handleAddLoss = () =>
    startTransition(async () => {
      try {
        await addSubmissionLossHistory(submissionUuid);
      } catch {
        toast.error("Couldn't add loss row");
      }
    });

  return (
    <SectionCard icon={Shield} title="Current Insurance & Loss Data">
      <div className="flex flex-col">
        <SubsectionHeader
          icon={Briefcase}
          title="Current / Other Insurance"
          action={
            <Button size="sm" variant="outline" onClick={handleAddInsurance}>
              <Plus data-icon="inline-start" />
              Add policy
            </Button>
          }
        />
        {otherInsurance.length === 0 ? (
          <EmptyState
            title="No current insurance entries"
            description="Add other policies in force (carrier, line of business, premium, etc.)."
          />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {otherInsurance.map((row) => (
              <OtherInsuranceRowEditor
                key={row.id}
                submissionUuid={submissionUuid}
                row={row}
              />
            ))}
          </div>
        )}

        <div className="border-t" />

        <SubsectionHeader
          icon={AlertTriangle}
          title="Loss History"
          action={
            <Button size="sm" variant="outline" onClick={handleAddLoss}>
              <Plus data-icon="inline-start" />
              Add loss
            </Button>
          }
        />
        {lossHistory.length === 0 ? (
          <EmptyState
            title="No losses on record"
            description="Add prior claims so the underwriter can assess loss history."
          />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {lossHistory.map((row) => (
              <LossHistoryRowEditor
                key={row.id}
                submissionUuid={submissionUuid}
                row={row}
              />
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function OtherInsuranceRowEditor({
  submissionUuid,
  row,
}: {
  submissionUuid: string;
  row: OtherInsuranceRow;
}) {
  const [, startTransition] = useTransition();
  const save = (
    patch: Partial<{
      carrierName: string;
      lineOfBusiness: string;
      policyNumber: string;
      planType: string;
      policyEffectiveDate: Date | null;
      policyExpirationDate: Date | null;
      premium: number | null;
      notes: string;
    }>,
  ) => {
    startTransition(async () => {
      try {
        await updateSubmissionOtherInsurance(submissionUuid, row.id, patch);
      } catch {
        toast.error("Couldn't save");
      }
    });
  };
  const remove = () =>
    startTransition(async () => {
      try {
        await deleteSubmissionOtherInsurance(submissionUuid, row.id);
      } catch {
        toast.error("Couldn't delete");
      }
    });

  return (
    <RowCard onDelete={remove} ariaLabel="Delete insurance row">
      <div className="grid gap-3 sm:grid-cols-12">
        <FieldGroup className="sm:col-span-4" label="Carrier">
          <TextEdit
            initial={row.carrierName}
            onCommit={(v) => save({ carrierName: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Line of business">
          <TextEdit
            initial={row.lineOfBusiness}
            onCommit={(v) => save({ lineOfBusiness: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Policy #">
          <TextEdit
            initial={row.policyNumber}
            onCommit={(v) => save({ policyNumber: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-2" label="Plan type">
          <TextEdit
            initial={row.planType}
            onCommit={(v) => save({ planType: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Effective">
          <DateEdit
            initial={isoToDateInput(row.policyEffectiveDate)}
            onCommit={(v) =>
              save({ policyEffectiveDate: v ? new Date(v) : null })
            }
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Expiration">
          <DateEdit
            initial={isoToDateInput(row.policyExpirationDate)}
            onCommit={(v) =>
              save({ policyExpirationDate: v ? new Date(v) : null })
            }
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Premium (USD)">
          <NumberEdit
            initial={row.premium}
            onCommit={(v) => save({ premium: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Notes">
          <TextEdit initial={row.notes} onCommit={(v) => save({ notes: v })} />
        </FieldGroup>
      </div>
    </RowCard>
  );
}

function LossHistoryRowEditor({
  submissionUuid,
  row,
}: {
  submissionUuid: string;
  row: LossHistoryRow;
}) {
  const [, startTransition] = useTransition();
  const save = (
    patch: Partial<{
      carrierName: string;
      policyNumber: string;
      lineOfBusiness: string;
      dateOfLoss: Date | null;
      reportedDate: Date | null;
      kindOfLoss: string;
      description: string;
      claimStatus: string;
      amountOfLoss: number | null;
      amountPaid: number | null;
      amountReserved: number | null;
    }>,
  ) => {
    startTransition(async () => {
      try {
        await updateSubmissionLossHistory(submissionUuid, row.id, patch);
      } catch {
        toast.error("Couldn't save");
      }
    });
  };
  const remove = () =>
    startTransition(async () => {
      try {
        await deleteSubmissionLossHistory(submissionUuid, row.id);
      } catch {
        toast.error("Couldn't delete");
      }
    });

  return (
    <RowCard onDelete={remove} ariaLabel="Delete loss row">
      <div className="grid gap-3 sm:grid-cols-12">
        <FieldGroup className="sm:col-span-3" label="Date of loss">
          <DateEdit
            initial={isoToDateInput(row.dateOfLoss)}
            onCommit={(v) => save({ dateOfLoss: v ? new Date(v) : null })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Reported">
          <DateEdit
            initial={isoToDateInput(row.reportedDate)}
            onCommit={(v) => save({ reportedDate: v ? new Date(v) : null })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Kind of loss">
          <TextEdit
            initial={row.kindOfLoss}
            onCommit={(v) => save({ kindOfLoss: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="Status">
          <TextEdit
            initial={row.claimStatus}
            onCommit={(v) => save({ claimStatus: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Carrier">
          <TextEdit
            initial={row.carrierName}
            onCommit={(v) => save({ carrierName: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Policy #">
          <TextEdit
            initial={row.policyNumber}
            onCommit={(v) => save({ policyNumber: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Line of business">
          <TextEdit
            initial={row.lineOfBusiness}
            onCommit={(v) => save({ lineOfBusiness: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-12" label="Description">
          <TextEdit
            initial={row.description}
            onCommit={(v) => save({ description: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Loss amount (USD)">
          <NumberEdit
            initial={row.amountOfLoss}
            onCommit={(v) => save({ amountOfLoss: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Paid (USD)">
          <NumberEdit
            initial={row.amountPaid}
            onCommit={(v) => save({ amountPaid: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Reserved (USD)">
          <NumberEdit
            initial={row.amountReserved}
            onCommit={(v) => save({ amountReserved: v })}
          />
        </FieldGroup>
      </div>
    </RowCard>
  );
}

// =============================================================================
// Section: Additional Interests
// =============================================================================

function AdditionalInterestsSection({
  submissionUuid,
  rows,
}: {
  submissionUuid: string;
  rows: AdditionalInterestRow[];
}) {
  const [, startTransition] = useTransition();
  const handleAdd = () =>
    startTransition(async () => {
      try {
        await addSubmissionAdditionalInterest(submissionUuid);
      } catch {
        toast.error("Couldn't add interest");
      }
    });

  return (
    <SectionCard
      icon={Briefcase}
      title="Additional Interests"
      action={
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus data-icon="inline-start" />
          Add interest
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No additional interests"
          description="Mortgagees, loss payees, additional insureds, certificate holders…"
        />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {rows.map((row) => (
            <AdditionalInterestRowEditor
              key={row.id}
              submissionUuid={submissionUuid}
              row={row}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function AdditionalInterestRowEditor({
  submissionUuid,
  row,
}: {
  submissionUuid: string;
  row: AdditionalInterestRow;
}) {
  const [, startTransition] = useTransition();
  const save = (patch: Partial<AdditionalInterestRow>) => {
    startTransition(async () => {
      try {
        await updateSubmissionAdditionalInterest(submissionUuid, row.id, patch);
      } catch {
        toast.error("Couldn't save");
      }
    });
  };
  const remove = () =>
    startTransition(async () => {
      try {
        await deleteSubmissionAdditionalInterest(submissionUuid, row.id);
      } catch {
        toast.error("Couldn't delete");
      }
    });

  return (
    <RowCard onDelete={remove} ariaLabel="Delete interest">
      <div className="grid gap-3 sm:grid-cols-12">
        <FieldGroup className="sm:col-span-4" label="Interest type">
          <TextEdit
            initial={row.interestType}
            onCommit={(v) => save({ interestType: v })}
            placeholder="Mortgagee / Loss Payee / Additional Insured…"
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Name">
          <TextEdit initial={row.name} onCommit={(v) => save({ name: v })} />
        </FieldGroup>
        <FieldGroup className="sm:col-span-4" label="Contact name">
          <TextEdit
            initial={row.contactName}
            onCommit={(v) => save({ contactName: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-6" label="Email">
          <TextEdit
            initial={row.email}
            type="email"
            onCommit={(v) => save({ email: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-6" label="Phone">
          <TextEdit initial={row.phone} onCommit={(v) => save({ phone: v })} />
        </FieldGroup>
        <FieldGroup className="sm:col-span-6" label="Street">
          <TextEdit
            initial={row.addressLine1}
            onCommit={(v) => save({ addressLine1: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-3" label="City">
          <TextEdit initial={row.city} onCommit={(v) => save({ city: v })} />
        </FieldGroup>
        <FieldGroup className="sm:col-span-1" label="State">
          <TextEdit
            initial={row.state}
            maxLength={2}
            onCommit={(v) => save({ state: v.toUpperCase() })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-2" label="Zip">
          <TextEdit
            initial={row.zipCode}
            onCommit={(v) => save({ zipCode: v })}
          />
        </FieldGroup>
        <FieldGroup className="sm:col-span-12" label="Description of operations">
          <TextEdit
            initial={row.descriptionOfOperations}
            onCommit={(v) => save({ descriptionOfOperations: v })}
          />
        </FieldGroup>
        <div className="sm:col-span-12 grid gap-3 sm:grid-cols-4 pt-1">
          <ToggleField
            label="Bonded"
            checked={row.isBonded}
            onChange={(v) => save({ isBonded: v })}
          />
          <ToggleField
            label="Licensed"
            checked={row.isLicensed}
            onChange={(v) => save({ isLicensed: v })}
          />
          <ToggleField
            label="Certificate required"
            checked={row.certificateRequired}
            onChange={(v) => save({ certificateRequired: v })}
          />
          <ToggleField
            label="Certificate issued"
            checked={row.certificateIssued}
            onChange={(v) => save({ certificateIssued: v })}
          />
        </div>
        <FieldGroup className="sm:col-span-12" label="Notes">
          <TextEdit initial={row.notes} onCommit={(v) => save({ notes: v })} />
        </FieldGroup>
      </div>
    </RowCard>
  );
}

// =============================================================================
// Shared primitives
// =============================================================================

function SectionCard({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="bg-muted/40 flex items-center justify-between gap-2 border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
            <Icon className="size-4" />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function SubsectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b px-5 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-3.5" />
        <h4 className="text-xs font-medium uppercase tracking-wide">
          {title}
        </h4>
      </div>
      {action}
    </div>
  );
}

function RowCard({
  children,
  onDelete,
  ariaLabel,
}: {
  children: ReactNode;
  onDelete: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="bg-card relative rounded-md border p-4">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive absolute right-2 top-2 size-7"
        onClick={onDelete}
        aria-label={ariaLabel}
      >
        <Trash2 className="size-3.5" />
      </Button>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-1 " + (className ?? "")}>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4">
      <Empty>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </Empty>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Label className="hover:bg-accent/40 flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
      />
      <span>{label}</span>
    </Label>
  );
}

function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? "";
}

function TextEdit({
  initial,
  onCommit,
  placeholder,
  type,
  maxLength,
  autoComplete,
}: {
  initial: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  const [value, setValue] = useState(initial);
  const [committed, setCommitted] = useState(initial);
  const commit = (next: string) => {
    if (next !== committed) {
      setCommitted(next);
      onCommit(next);
    }
  };
  return (
    <Input
      type={type ?? "text"}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        // Autofill never blurs the fields it didn't focus — commit on the spot.
        if (isAutofillChange(e)) commit(next);
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      onBlur={() => commit(value)}
      className="h-9"
    />
  );
}

function DateEdit({
  initial,
  onCommit,
}: {
  initial: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [committed, setCommitted] = useState(initial);
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== committed) {
          setCommitted(value);
          onCommit(value);
        }
      }}
      className="h-9"
    />
  );
}

function NumberEdit({
  initial,
  onCommit,
}: {
  initial: string | null;
  onCommit: (value: number | null) => void;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [committed, setCommitted] = useState(initial ?? "");
  return (
    <Input
      type="number"
      step="0.01"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== committed) {
          setCommitted(value);
          onCommit(value === "" ? null : Number(value));
        }
      }}
      className="h-9"
    />
  );
}

function NativeSelect({
  initial,
  options,
  onCommit,
}: {
  initial: string;
  options: Array<{ value: string; label: string }>;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <select
      className="border-input bg-background h-9 rounded-md border px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        setValue(v);
        onCommit(v);
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

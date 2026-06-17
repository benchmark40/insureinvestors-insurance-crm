"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Banknote,
  Briefcase,
  Building2,
  Receipt,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LINES_OF_BUSINESS } from "@insureinvestorsv2/lib";
import { updateCustomer } from "@/lib/actions/customers";
import { updateSubmission } from "@/lib/actions/submissions";
import { isValidUSZip, normalizeUSState } from "@/lib/ascend/address";
import { isAutofillChange } from "@/lib/autofill";

const STATUS_OPTIONS = [
  "draft",
  "ready",
  "sent",
  "partial",
  "quoted",
  "bound",
  "declined",
  "lost",
  "expired",
] as const;
type SubmissionStatus = (typeof STATUS_OPTIONS)[number];

type CustomerSnapshot = {
  id: number;
  uuid: string;
  businessName: string;
  dba: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  naics: string;
};

type SubmissionSnapshot = {
  status: SubmissionStatus;
  namedInsured: string;
  targetEffectiveDate: string | null;
  targetExpirationDate: string | null;
  linesOfBusiness: string[];
  accountExecutive: string;
  accountRepresentative: string;
  accountBroker: string;
  accountProducer: string;
  parentCompany: string;
  writingCompany: string;
  companyType: string;
  underwriterContact: string;
  division: string;
  branch: string;
  department: string;
  groupName: string;
  businessOrigin: string;
  leadSource: string;
};

type SubmissionTextField = Exclude<
  keyof SubmissionSnapshot,
  | "status"
  | "targetEffectiveDate"
  | "targetExpirationDate"
  | "linesOfBusiness"
>;

type Row = {
  label: string;
  value: string;
  edit?: ReactNode;
  span?: 1 | 2;
};

const DASH = "--";

function fmtDate(iso: string | null): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? "";
}

function joinNonEmpty(parts: Array<string | null | undefined>, sep = ", ") {
  const cleaned = parts.map((p) => (p ?? "").trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(sep) : DASH;
}

function nonEmpty(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v.length ? v : DASH;
}

/**
 * Inline validators mirroring the Ascend address requirements
 * (lib/ascend/address.ts). They surface bad/blank state + zip at data-entry
 * time so brokers don't discover the problem only when presenting a proposal.
 */
function validateStateField(value: string): string | null {
  const v = value.trim();
  if (!v) return "Required for the Ascend proposal handoff.";
  return normalizeUSState(v)
    ? null
    : "Not a US state — use a 2-letter code like CA.";
}

function validateZipField(value: string): string | null {
  const v = value.trim();
  if (!v) return "Required for the Ascend proposal handoff.";
  return isValidUSZip(v) ? null : "Use 5 digits, optionally +4 (e.g. 90210).";
}

export function OverviewTab({
  submissionUuid,
  customer,
  submission,
}: {
  submissionUuid: string;
  customer: CustomerSnapshot;
  submission: SubmissionSnapshot;
}) {
  const [c, setC] = useState(customer);
  const [s, setS] = useState(submission);
  const [, startTransition] = useTransition();

  function saveCustomer(patch: Partial<CustomerSnapshot>) {
    setC((prev) => ({ ...prev, ...patch }));
    startTransition(async () => {
      try {
        await updateCustomer(customer.uuid, patch);
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function saveSubmission(
    patch: Partial<{
      namedInsured: string;
      status: SubmissionStatus;
      targetEffectiveDate: Date | null;
      targetExpirationDate: Date | null;
      linesOfBusiness: string[];
    }> &
      Partial<Record<SubmissionTextField, string>>,
    optimistic: Partial<SubmissionSnapshot>,
  ) {
    setS((prev) => ({ ...prev, ...optimistic }));
    startTransition(async () => {
      try {
        await updateSubmission(submissionUuid, patch);
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function toggleLob(code: string) {
    const next = s.linesOfBusiness.includes(code)
      ? s.linesOfBusiness.filter((x) => x !== code)
      : [...s.linesOfBusiness, code];
    saveSubmission({ linesOfBusiness: next }, { linesOfBusiness: next });
  }

  function textRow(label: string, field: SubmissionTextField): Row {
    const current = s[field];
    return {
      label,
      value: nonEmpty(current),
      edit: (
        <EditInput
          initial={current}
          onCommit={(v) =>
            saveSubmission({ [field]: v }, { [field]: v } as Partial<SubmissionSnapshot>)
          }
        />
      ),
    };
  }

  const insured: Row[] = [
    { label: "Customer Number", value: String(c.id) },
    {
      label: "Policy Name Insured",
      value:
        nonEmpty(s.namedInsured) !== DASH
          ? s.namedInsured
          : nonEmpty(c.businessName),
      edit: (
        <EditInput
          initial={s.namedInsured || c.businessName}
          onCommit={(v) =>
            saveSubmission({ namedInsured: v }, { namedInsured: v })
          }
        />
      ),
    },
    {
      label: "Doing Business As",
      value: nonEmpty(c.dba),
      edit: (
        <EditInput
          initial={c.dba}
          onCommit={(v) => saveCustomer({ dba: v })}
        />
      ),
    },
    {
      label: "Business Classification",
      value: nonEmpty(c.naics),
      edit: (
        <EditInput
          initial={c.naics}
          onCommit={(v) => saveCustomer({ naics: v })}
        />
      ),
    },
    {
      label: "Primary Contact Full Name",
      span: 2,
      value: joinNonEmpty([c.firstName, c.lastName], " "),
      edit: (
        <div className="flex w-full gap-2">
          <EditInput
            initial={c.firstName}
            placeholder="First"
            autoComplete="given-name"
            onCommit={(v) => saveCustomer({ firstName: v })}
            className="flex-1"
          />
          <EditInput
            initial={c.lastName}
            placeholder="Last"
            autoComplete="family-name"
            onCommit={(v) => saveCustomer({ lastName: v })}
            className="flex-1"
          />
        </div>
      ),
    },
    {
      label: "Mailing Address",
      span: 2,
      value: joinNonEmpty([c.city, c.state, c.zipCode]),
      edit: (
        <div className="flex w-full gap-2">
          <EditInput
            initial={c.city}
            placeholder="City"
            autoComplete="address-level2"
            onCommit={(v) => saveCustomer({ city: v })}
            className="flex-1"
          />
          <EditInput
            initial={c.state}
            placeholder="State"
            autoComplete="address-level1"
            onCommit={(v) => saveCustomer({ state: v })}
            validate={validateStateField}
            transformOnCommit={(v) => normalizeUSState(v) ?? v.trim()}
            className="flex-1"
          />
          <EditInput
            initial={c.zipCode}
            placeholder="Zip"
            autoComplete="postal-code"
            onCommit={(v) => saveCustomer({ zipCode: v })}
            validate={validateZipField}
            className="w-28"
          />
        </div>
      ),
    },
    placeholderRow("Customer Origin"),
    placeholderRow("Master Code"),
    {
      label: "Phone",
      value: nonEmpty(c.phone),
      edit: (
        <EditInput
          initial={c.phone}
          autoComplete="tel"
          onCommit={(v) => saveCustomer({ phone: v })}
        />
      ),
    },
    {
      label: "Email",
      value: nonEmpty(c.email),
      edit: (
        <EditInput
          initial={c.email}
          type="email"
          autoComplete="email"
          onCommit={(v) => saveCustomer({ email: v })}
        />
      ),
    },
    placeholderRow("Website"),
    placeholderRow("Customer Origin"),
  ];

  const policyInfo: Row[] = [
    {
      label: "Policy Status",
      value: s.status,
      edit: (
        <StatusSelect
          initial={s.status}
          onCommit={(v) => saveSubmission({ status: v }, { status: v })}
        />
      ),
    },
    {
      label: "Policy Start Date",
      value: fmtDate(s.targetEffectiveDate),
      edit: (
        <DateEditInput
          initial={isoToDateInput(s.targetEffectiveDate)}
          onCommit={(v) =>
            saveSubmission(
              { targetEffectiveDate: v ? new Date(v) : null },
              { targetEffectiveDate: v ? new Date(v).toISOString() : null },
            )
          }
        />
      ),
    },
    {
      label: "Policy End Date",
      value: fmtDate(s.targetExpirationDate),
      edit: (
        <DateEditInput
          initial={isoToDateInput(s.targetExpirationDate)}
          onCommit={(v) =>
            saveSubmission(
              { targetExpirationDate: v ? new Date(v) : null },
              { targetExpirationDate: v ? new Date(v).toISOString() : null },
            )
          }
        />
      ),
    },
    placeholderRow("Policy Number"),
    {
      label: "Policy Type",
      value: s.linesOfBusiness.length ? s.linesOfBusiness.join(", ") : DASH,
      edit: (
        <div className="flex flex-wrap gap-1.5">
          {LINES_OF_BUSINESS.map((lob) => {
            const active = s.linesOfBusiness.includes(lob.code);
            return (
              <button
                key={lob.code}
                type="button"
                onClick={() => toggleLob(lob.code)}
                className={
                  "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:bg-accent")
                }
              >
                {lob.code}
              </button>
            );
          })}
        </div>
      ),
    },
    placeholderRow("Policy Type of Business"),
  ];

  const billingSummary: Row[] = [
    placeholderRow("Total Policy Premium"),
    placeholderRow("Broker & Policy Fees"),
    placeholderRow("Agency Fee and %"),
    placeholderRow("Total Annual Premium"),
  ];

  const serviceGroup: Row[] = [
    textRow("Account Executive", "accountExecutive"),
    textRow("Account Representative", "accountRepresentative"),
    textRow("Account Broker", "accountBroker"),
    textRow("Account Producer", "accountProducer"),
  ];

  const companyType: Row[] = [
    textRow("Parent Company", "parentCompany"),
    textRow("Writing Company", "writingCompany"),
    textRow("Company Type", "companyType"),
    textRow("Underwriter Contact", "underwriterContact"),
  ];

  const businessUnit: Row[] = [
    textRow("Division", "division"),
    textRow("Branch", "branch"),
    textRow("Department", "department"),
    textRow("Group", "groupName"),
  ];

  const billingPlan: Row[] = [
    placeholderRow("Bill Plan"),
    placeholderRow("Number of Installments"),
    placeholderRow("Premium Written"),
    placeholderRow("Premium Billed"),
    placeholderRow("Amount Due"),
    placeholderRow("Payment Status"),
    placeholderRow("Policy Billing (Agency/Direct)"),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <DataListCard icon={User} title="Insured Information" rows={insured} />
        <div className="flex flex-col gap-4">
          <DataListCard
            icon={Briefcase}
            title="Policy Information"
            rows={policyInfo}
          />
          <DataListCard
            icon={Banknote}
            title="Billing Summary"
            rows={billingSummary}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DataListCard
          icon={Users}
          title="Service Group"
          rows={serviceGroup}
        />
        <DataListCard
          icon={Building2}
          title="Company Type"
          rows={companyType}
        />
        <DataListCard
          icon={UserCog}
          title="Business Unit"
          rows={businessUnit}
        />
      </div>

      <DataListCard
        icon={Receipt}
        title="Billing Plan"
        rows={billingPlan}
      />
    </div>
  );
}

function placeholderRow(label: string): Row {
  return { label, value: DASH };
}

function DataListCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: React.ElementType;
  title: string;
  rows: Row[];
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="bg-muted/40 flex items-center gap-2 border-b px-5 py-3">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <CardContent className="p-0">
        <DataGrid rows={rows} />
      </CardContent>
    </Card>
  );
}

function DataGrid({ rows }: { rows: Row[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
      {rows.map((r, i) => (
        <DataRow key={i} row={r} />
      ))}
    </div>
  );
}

function DataRow({ row }: { row: Row }) {
  const colSpan = row.span === 2 ? "sm:col-span-2" : "sm:col-span-1";
  return (
    <Field className={colSpan}>
      <FieldLabel className="text-muted-foreground text-xs font-normal">
        {row.label}
      </FieldLabel>
      {row.edit ? (
        row.edit
      ) : (
        <Input
          value={row.value === DASH ? "" : row.value}
          readOnly
          disabled
          placeholder="—"
          className="cursor-not-allowed"
        />
      )}
    </Field>
  );
}

function EditInput({
  initial,
  onCommit,
  placeholder,
  type,
  maxLength,
  className,
  validate,
  transformOnCommit,
  autoComplete,
}: {
  initial: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  className?: string;
  validate?: (value: string) => string | null;
  transformOnCommit?: (value: string) => string;
  autoComplete?: string;
}) {
  const [value, setValue] = useState(initial);
  const [committed, setCommitted] = useState(initial);
  const error = validate ? validate(value) : null;
  const commit = (raw: string) => {
    const next = transformOnCommit ? transformOnCommit(raw) : raw;
    if (next !== value) setValue(next);
    if (next !== committed) {
      setCommitted(next);
      onCommit(next);
    }
  };
  return (
    <div className={"flex flex-col gap-1 " + (className ?? "w-full")}>
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
        aria-invalid={error ? true : undefined}
        onBlur={() => commit(value)}
        className="w-full"
      />
      {error ? (
        <span className="text-destructive text-xs">{error}</span>
      ) : null}
    </div>
  );
}

function DateEditInput({
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
      className="w-full"
    />
  );
}

function StatusSelect({
  initial,
  onCommit,
}: {
  initial: SubmissionStatus;
  onCommit: (value: SubmissionStatus) => void;
}) {
  const [value, setValue] = useState<SubmissionStatus>(initial);
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const next = v as SubmissionStatus;
        setValue(next);
        onCommit(next);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


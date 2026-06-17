"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  GLAdditionalCoveragesDialog,
  type SavedOptionalCoverage,
} from "@/components/submission/gl-additional-coverages-dialog";
import {
  GLBuilderDialog,
  type BuilderEditRow,
  type BuilderLocation,
} from "@/components/submission/gl-builder-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GL_ADDITIONAL_COVERAGES,
  GL_LIMIT_OPTIONS,
} from "@insureinvestorsv2/lib";
import {
  deleteGLClassification,
  upsertGLCoverage,
} from "@/lib/actions/gl-coverage";

type GLCoverageSnapshot = {
  insuranceCarrier: string;
  lineOfBusiness: string;
  formOfCoverage: "occurrence" | "claims_made";
  carrierParticipationPct: string; // Decimal stringified
  eachOccurrenceLimit: string;
  generalAggregate: string;
  productsCompletedOpsAggregate: string;
  personalAdvertisingInjuryLimit: string;
  medicalExpense: string;
  damageToRentedPremises: string;
  aggregateBasis: "policy" | "per_location" | "per_project";
};

type Classification = {
  id: number;
  locationId: number;
  locationNumber: number;
  locationAddress: string;
  classCode: string;
  description: string;
  exposure: string;
};

const BASIS_LABELS: Record<string, string> = {
  policy: "Per Policy",
  per_location: "Per Location",
  per_project: "Per Project",
};

const DEFAULTS: GLCoverageSnapshot = {
  insuranceCarrier: "Atain Specialty Insurance Company",
  lineOfBusiness: "Commercial General Liability",
  formOfCoverage: "occurrence",
  carrierParticipationPct: "100",
  eachOccurrenceLimit: "1000000",
  generalAggregate: "2000000",
  productsCompletedOpsAggregate: "2000000",
  personalAdvertisingInjuryLimit: "1000000",
  medicalExpense: "5000",
  damageToRentedPremises: "100000",
  aggregateBasis: "policy",
};

function fmtLimit(v: number | string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${n / 1_000_000}M`;
  if (n >= 1_000) return `$${n / 1_000}K`;
  return `$${n}`;
}

export function GLTab({
  submissionUuid,
  coverage,
  classifications,
  optionalCoverages,
  locations,
}: {
  submissionUuid: string;
  coverage: GLCoverageSnapshot | null;
  classifications: Classification[];
  optionalCoverages: SavedOptionalCoverage[];
  locations: BuilderLocation[];
}) {
  const [, startTransition] = useTransition();
  const initial = coverage ?? DEFAULTS;
  const [c, setC] = useState<GLCoverageSnapshot>(initial);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<BuilderEditRow | null>(null);
  const [acOpen, setAcOpen] = useState(false);

  function saveCoverage(patch: Partial<GLCoverageSnapshot>) {
    const next = { ...c, ...patch };
    setC(next);
    startTransition(async () => {
      try {
        await upsertGLCoverage(submissionUuid, {
          insuranceCarrier: next.insuranceCarrier,
          lineOfBusiness: next.lineOfBusiness,
          formOfCoverage: next.formOfCoverage,
          carrierParticipationPct: Number(next.carrierParticipationPct) || 0,
          eachOccurrenceLimit: Number(next.eachOccurrenceLimit),
          generalAggregate: Number(next.generalAggregate),
          productsCompletedOpsAggregate: Number(
            next.productsCompletedOpsAggregate,
          ),
          personalAdvertisingInjuryLimit: Number(
            next.personalAdvertisingInjuryLimit,
          ),
          medicalExpense: Number(next.medicalExpense),
          damageToRentedPremises: Number(next.damageToRentedPremises),
          aggregateBasis: next.aggregateBasis,
        });
      } catch {
        toast.error("Couldn't save GL coverage");
      }
    });
  }

  const hasPackage = classifications.length > 0;
  const uniqueLocations = new Set(classifications.map((r) => r.locationId)).size;
  const totalExposure = classifications.reduce(
    (s, r) => s + Number(r.exposure),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Policy & carrier info */}
      <SectionCard icon={Briefcase} title="Policy & Carrier Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="gl-carrier">Insurance Carrier</FieldLabel>
            <CommittedInput
              id="gl-carrier"
              initial={c.insuranceCarrier}
              onCommit={(v) => saveCoverage({ insuranceCarrier: v })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="gl-lob">Line of Business</FieldLabel>
            <CommittedInput
              id="gl-lob"
              initial={c.lineOfBusiness}
              onCommit={(v) => saveCoverage({ lineOfBusiness: v })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="gl-form">Form of Coverage</FieldLabel>
            <Select
              value={c.formOfCoverage}
              onValueChange={(v) =>
                saveCoverage({
                  formOfCoverage: v as GLCoverageSnapshot["formOfCoverage"],
                })
              }
            >
              <SelectTrigger id="gl-form">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occurrence">Occurrence</SelectItem>
                <SelectItem value="claims_made">Claims-Made</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="gl-pct">Carrier Participation %</FieldLabel>
            <CommittedInput
              id="gl-pct"
              type="number"
              initial={c.carrierParticipationPct}
              onCommit={(v) => saveCoverage({ carrierParticipationPct: v })}
            />
          </Field>
        </div>
      </SectionCard>

      {/* GL Package CTA */}
      <SectionCard icon={Sparkles} title="GL Package Builder">
        <div className="bg-muted/30 flex items-center justify-between gap-3 rounded-md border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">
              {hasPackage ? "Package active" : "No package yet"}
            </p>
            <p className="text-muted-foreground text-xs">
              {hasPackage
                ? `${uniqueLocations} location${uniqueLocations === 1 ? "" : "s"} · ${classifications.length} classification${classifications.length === 1 ? "" : "s"}`
                : "Select properties, add class codes, enter sq ft per location"}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setBuilderOpen(true);
            }}
            disabled={locations.length === 0}
          >
            <Plus data-icon="inline-start" />
            {hasPackage ? "Add Another Package" : "Create GL Package"}
          </Button>
        </div>
      </SectionCard>

      {/* Limits */}
      {hasPackage && (
        <SectionCard icon={Shield} title="GL Coverage Limits (Policy-Wide)">
          <div className="divide-y divide-x grid grid-cols-1 sm:grid-cols-2 sm:divide-y-0 sm:divide-x-0">
            <LimitRow
              label="Each Occurrence"
              value={c.eachOccurrenceLimit}
              options={GL_LIMIT_OPTIONS.eachOccurrence}
              onChange={(v) => saveCoverage({ eachOccurrenceLimit: v })}
            />
            <LimitRow
              label="General Aggregate"
              value={c.generalAggregate}
              options={GL_LIMIT_OPTIONS.generalAggregate}
              onChange={(v) => saveCoverage({ generalAggregate: v })}
            />
            <LimitRow
              label="Products & Completed Ops"
              value={c.productsCompletedOpsAggregate}
              options={GL_LIMIT_OPTIONS.productsCompletedOps}
              onChange={(v) =>
                saveCoverage({ productsCompletedOpsAggregate: v })
              }
            />
            <LimitRow
              label="Personal & Advertising Injury"
              value={c.personalAdvertisingInjuryLimit}
              options={GL_LIMIT_OPTIONS.personalAdvertising}
              onChange={(v) =>
                saveCoverage({ personalAdvertisingInjuryLimit: v })
              }
            />
            <LimitRow
              label="Medical Expense (Any One Person)"
              value={c.medicalExpense}
              options={GL_LIMIT_OPTIONS.medicalExpense}
              onChange={(v) => saveCoverage({ medicalExpense: v })}
            />
            <LimitRow
              label="Damage to Rented Premises"
              value={c.damageToRentedPremises}
              options={GL_LIMIT_OPTIONS.damageToRented}
              onChange={(v) => saveCoverage({ damageToRentedPremises: v })}
            />
          </div>
          <div className="bg-muted/20 mt-3 flex items-center justify-between rounded-md border px-4 py-3">
            <span className="text-sm font-medium">Aggregate Basis</span>
            <div className="flex gap-1.5">
              {(["policy", "per_location", "per_project"] as const).map(
                (opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => saveCoverage({ aggregateBasis: opt })}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                      (c.aggregateBasis === opt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground hover:bg-accent")
                    }
                  >
                    {BASIS_LABELS[opt]}
                  </button>
                ),
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Classifications table */}
      {hasPackage && (
        <SectionCard icon={Briefcase} title="Property Classifications">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                  <th className="px-3 py-2 text-left">Loc</th>
                  <th className="px-3 py-2 text-left">Property Address</th>
                  <th className="px-3 py-2 text-left">Class Code</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Exposure (Sq Ft)</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Premium</th>
                  <th className="w-20 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classifications.map((row) => (
                  <tr key={row.id} className="hover:bg-accent/20">
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="text-[10px]">
                        L{row.locationNumber}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground max-w-[240px] truncate px-3 py-2 text-xs">
                      {row.locationAddress}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-primary bg-primary/10 rounded px-2 py-0.5 font-mono text-xs">
                        {row.classCode}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{row.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Number(row.exposure).toLocaleString()}
                    </td>
                    <td className="text-muted-foreground/60 px-3 py-2 text-right text-xs font-mono">
                      $0.0000
                    </td>
                    <td className="text-muted-foreground/60 px-3 py-2 text-right">
                      —
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing({
                              id: row.id,
                              locationId: row.locationId,
                              classCode: row.classCode,
                              description: row.description,
                              exposure: Number(row.exposure),
                            });
                            setBuilderOpen(true);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <DeleteRowButton
                          submissionUuid={submissionUuid}
                          id={row.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Locations" value={String(uniqueLocations)} />
            <SummaryStat
              label="Classifications"
              value={String(classifications.length)}
            />
            <SummaryStat
              label="Total Exposure"
              value={`${totalExposure.toLocaleString()} sqft`}
            />
            <SummaryStat
              label="Limits"
              value={`${fmtLimit(c.eachOccurrenceLimit)} / ${fmtLimit(c.generalAggregate)}`}
              accent
            />
          </div>
        </SectionCard>
      )}

      {/* Additional coverages */}
      <SectionCard icon={Shield} title="Additional Coverages">
        <div className="bg-muted/30 flex items-center justify-between gap-3 rounded-md border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">
              {optionalCoverages.length > 0
                ? "Coverages configured"
                : "No additional coverages yet"}
            </p>
            <p className="text-muted-foreground text-xs">
              {optionalCoverages.length > 0
                ? `${optionalCoverages.length} active`
                : "Enable optional coverages like EPL, Cyber, Hired Auto and more"}
            </p>
          </div>
          <Button variant="outline" onClick={() => setAcOpen(true)}>
            <Pencil data-icon="inline-start" />
            {optionalCoverages.length > 0
              ? "Edit Coverages"
              : "Configure Coverages"}
          </Button>
        </div>

        {optionalCoverages.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                  <th className="px-3 py-2 text-left">Coverage</th>
                  <th className="px-3 py-2 text-left">Limit / Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {optionalCoverages.map((cov) => {
                  const def = GL_ADDITIONAL_COVERAGES.find(
                    (d) => d.key === cov.name,
                  );
                  return (
                    <tr key={cov.id}>
                      <td className="px-3 py-2 text-sm">
                        {def?.label ?? cov.name}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {typeof cov.value.type === "string" ? (
                          <span className="bg-sky-100 text-sky-800 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                            {cov.value.type}
                          </span>
                        ) : typeof cov.value.limit === "number" ? (
                          <span className="text-primary font-semibold">
                            {fmtLimit(cov.value.limit)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5 text-xs font-medium">
                            Included
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Dialogs */}
      <GLBuilderDialog
        submissionUuid={submissionUuid}
        locations={locations}
        open={builderOpen}
        onOpenChange={(v) => {
          setBuilderOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
      />
      <GLAdditionalCoveragesDialog
        submissionUuid={submissionUuid}
        saved={optionalCoverages}
        open={acOpen}
        onOpenChange={setAcOpen}
      />

      {locations.length === 0 && !hasPackage && (
        <Empty className="border-dashed">
          <EmptyTitle>No properties on this submission</EmptyTitle>
          <EmptyDescription>
            Add a property first so you can map class codes to locations.
          </EmptyDescription>
        </Empty>
      )}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
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
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function LimitRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly number[];
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm">{label}</span>
      <Select
        value={String(Number(value))}
        onValueChange={(v) => {
          if (typeof v === "string") onChange(v);
        }}
      >
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>
              {fmtLimit(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card flex flex-col rounded-md border px-3 py-2">
      <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span
        className={
          "text-sm font-semibold tabular-nums " +
          (accent ? "text-primary" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}

function CommittedInput({
  initial,
  onCommit,
  ...rest
}: {
  initial: string;
  onCommit: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur">) {
  const [value, setValue] = useState(initial);
  const [committed, setCommitted] = useState(initial);
  return (
    <Input
      {...rest}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== committed) {
          setCommitted(value);
          onCommit(value);
        }
      }}
    />
  );
}

function DeleteRowButton({
  submissionUuid,
  id,
}: {
  submissionUuid: string;
  id: number;
}) {
  const [, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => {
        if (!confirm("Delete this classification?")) return;
        startTransition(async () => {
          try {
            await deleteGLClassification(submissionUuid, id);
          } catch {
            toast.error("Couldn't delete row");
          }
        });
      }}
      aria-label="Delete"
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

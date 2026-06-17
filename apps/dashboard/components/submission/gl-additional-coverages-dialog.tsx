"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GL_ADDITIONAL_COVERAGES } from "@insureinvestorsv2/lib";
import { syncOptionalCoverages } from "@/lib/actions/gl-coverage";

export type AdditionalCoverageValue = {
  label?: string;
  limit?: number | null;
  type?: string | null;
};

export type SavedOptionalCoverage = {
  id: number;
  name: string;
  value: AdditionalCoverageValue;
};

type DraftRow = {
  enabled: boolean;
  limit: number | null;
  type: string | null;
};

function fmtLimit(v: number): string {
  if (v >= 1_000_000) return `$${v / 1_000_000}M`;
  if (v >= 1_000) return `$${v / 1_000}K`;
  return `$${v}`;
}

export function GLAdditionalCoveragesDialog({
  submissionUuid,
  saved,
  open,
  onOpenChange,
}: {
  submissionUuid: string;
  saved: SavedOptionalCoverage[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, DraftRow>>(() =>
    initDraft(saved),
  );

  function reset() {
    setDraft(initDraft(saved));
  }

  function update(key: string, patch: Partial<DraftRow>) {
    setDraft((d) => {
      const prev: DraftRow = d[key] ?? {
        enabled: false,
        limit: null,
        type: null,
      };
      return { ...d, [key]: { ...prev, ...patch } };
    });
  }

  function save() {
    setSaving(true);
    startTransition(async () => {
      try {
        const keep = GL_ADDITIONAL_COVERAGES.filter(
          (def) => draft[def.key]?.enabled,
        ).map((def) => {
          const d = draft[def.key]!;
          const value: AdditionalCoverageValue = { label: def.label };
          if ("limitOptions" in def && def.limitOptions && d.limit != null) {
            value.limit = d.limit;
          }
          if ("typeOptions" in def && def.typeOptions && d.type) {
            value.type = d.type;
          }
          return { name: def.key, value };
        });
        await syncOptionalCoverages(submissionUuid, keep);
        toast.success("Additional coverages saved");
        onOpenChange(false);
      } catch {
        toast.error("Couldn't save coverages");
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Additional Coverages</DialogTitle>
          <DialogDescription>
            Toggle coverages on or off and set limits — saves as a table.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 divide-y border-y">
          {GL_ADDITIONAL_COVERAGES.map((def) => {
            const row = draft[def.key];
            const limitOpts =
              "limitOptions" in def ? def.limitOptions : undefined;
            const typeOpts = "typeOptions" in def ? def.typeOptions : undefined;
            return (
              <div
                key={def.key}
                className={
                  "flex items-center gap-3 px-6 py-3 " +
                  (row?.enabled ? "bg-primary/5" : "")
                }
              >
                <Switch
                  id={`ac-${def.key}`}
                  checked={!!row?.enabled}
                  onCheckedChange={(v) =>
                    update(def.key, { enabled: v === true })
                  }
                />
                <Label
                  htmlFor={`ac-${def.key}`}
                  className="flex-1 cursor-pointer text-sm font-medium"
                >
                  {def.label}
                </Label>
                <div className="min-w-[140px] flex justify-end">
                  {!row?.enabled ? (
                    <span className="text-muted-foreground text-xs">Off</span>
                  ) : typeOpts ? (
                    <Select
                      value={row.type ?? typeOpts[0]}
                      onValueChange={(v) => update(def.key, { type: v })}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOpts.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : limitOpts ? (
                    <Select
                      value={String(row.limit ?? limitOpts[0])}
                      onValueChange={(v) =>
                        update(def.key, { limit: Number(v) })
                      }
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {limitOpts.map((opt) => (
                          <SelectItem key={opt} value={String(opt)}>
                            {fmtLimit(opt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-100 rounded-full px-3 py-0.5 text-xs font-medium">
                      Included
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Coverages"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initDraft(saved: SavedOptionalCoverage[]): Record<string, DraftRow> {
  const out: Record<string, DraftRow> = {};
  for (const def of GL_ADDITIONAL_COVERAGES) {
    const existing = saved.find((s) => s.name === def.key);
    const limitOpts = "limitOptions" in def ? def.limitOptions : undefined;
    const typeOpts = "typeOptions" in def ? def.typeOptions : undefined;
    out[def.key] = {
      enabled: !!existing,
      limit:
        existing && typeof existing.value.limit === "number"
          ? existing.value.limit
          : (limitOpts?.[0] ?? null),
      type:
        existing && typeof existing.value.type === "string"
          ? existing.value.type
          : (typeOpts?.[0] ?? null),
    };
  }
  return out;
}

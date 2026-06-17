"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ISO_GL_CODES, type IsoGlCode } from "@insureinvestorsv2/lib";
import {
  addGLClassifications,
  updateGLClassification,
} from "@/lib/actions/gl-coverage";

export type BuilderLocation = {
  id: number;
  locationNumber: number;
  address: string;
  city: string;
  state: string;
  totalSqft: number;
};

export type BuilderEditRow = {
  id: number;
  locationId: number;
  classCode: string;
  description: string;
  exposure: number;
};

type CodeRow = {
  key: string;
  code: string;
  desc: string;
  exposures: Record<number, string>;
};

export function GLBuilderDialog({
  submissionUuid,
  locations,
  open,
  onOpenChange,
  editing,
}: {
  submissionUuid: string;
  locations: BuilderLocation[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
  editing: BuilderEditRow | null;
}) {
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    editing ? [editing.locationId] : [],
  );
  const [codeRows, setCodeRows] = useState<CodeRow[]>(() =>
    editing
      ? [
          {
            key: editing.classCode + "_edit",
            code: editing.classCode,
            desc: editing.description,
            exposures: { [editing.locationId]: String(editing.exposure) },
          },
        ]
      : [],
  );
  const [codeSearch, setCodeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  function reset() {
    setSelectedIds(editing ? [editing.locationId] : []);
    setCodeRows(
      editing
        ? [
            {
              key: editing.classCode + "_edit",
              code: editing.classCode,
              desc: editing.description,
              exposures: { [editing.locationId]: String(editing.exposure) },
            },
          ]
        : [],
    );
    setCodeSearch("");
    setShowDropdown(false);
  }

  const filtered = useMemo(() => {
    const q = codeSearch.trim().toLowerCase();
    if (!q) return ISO_GL_CODES.slice(0, 60);
    return ISO_GL_CODES.filter(
      (c) => c.desc.toLowerCase().includes(q) || c.code.includes(q),
    ).slice(0, 60);
  }, [codeSearch]);

  function toggleLocation(id: number) {
    setSelectedIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((p) => p !== id) : [...prev, id];
      // Trim exposures for any removed locations
      if (has) {
        setCodeRows((rows) =>
          rows.map((r) => {
            const ex = { ...r.exposures };
            delete ex[id];
            return { ...r, exposures: ex };
          }),
        );
      } else {
        setCodeRows((rows) =>
          rows.map((r) => ({
            ...r,
            exposures: { ...r.exposures, [id]: r.exposures[id] ?? "" },
          })),
        );
      }
      return next;
    });
  }

  function pickCode(iso: IsoGlCode) {
    if (codeRows.find((r) => r.code === iso.code)) {
      setCodeSearch("");
      setShowDropdown(false);
      return;
    }
    const exposures: Record<number, string> = {};
    selectedIds.forEach((pid) => (exposures[pid] = ""));
    setCodeRows((rows) => [
      ...rows,
      {
        key: iso.code + "_" + Date.now(),
        code: iso.code,
        desc: iso.desc,
        exposures,
      },
    ]);
    setCodeSearch("");
    setShowDropdown(false);
  }

  function removeRow(key: string) {
    setCodeRows((rows) => rows.filter((r) => r.key !== key));
  }

  function setExposure(rowKey: string, locationId: number, value: string) {
    setCodeRows((rows) =>
      rows.map((r) =>
        r.key === rowKey
          ? { ...r, exposures: { ...r.exposures, [locationId]: value } }
          : r,
      ),
    );
  }

  function save() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one property");
      return;
    }
    if (codeRows.length === 0) {
      toast.error("Add at least one class code");
      return;
    }
    const toAdd: Array<{
      locationId: number;
      classCode: string;
      description: string;
      exposure: number;
      rate: number;
      premium: number;
    }> = [];
    for (const row of codeRows) {
      for (const pid of selectedIds) {
        const v = Number(row.exposures[pid]);
        if (v > 0) {
          toAdd.push({
            locationId: pid,
            classCode: row.code,
            description: row.desc,
            exposure: v,
            rate: 0,
            premium: 0,
          });
        }
      }
    }
    const first = toAdd[0];
    if (!first) {
      toast.error("Enter at least one exposure value");
      return;
    }

    setSaving(true);
    startTransition(async () => {
      try {
        if (editing) {
          await updateGLClassification(submissionUuid, editing.id, {
            locationId: first.locationId,
            classCode: first.classCode,
            description: first.description,
            exposure: first.exposure,
          });
          toast.success("Row updated");
        } else {
          await addGLClassifications(submissionUuid, toAdd);
          toast.success("Package saved");
        }
        onOpenChange(false);
      } catch {
        toast.error("Couldn't save package");
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
      <DialogContent className="flex h-[85vh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Classification" : "GL Package Builder"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the exposure for this classification"
              : "Pick properties, search class codes, enter sq ft per location."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] gap-4">
          {/* Left: properties */}
          <div className="bg-muted/30 flex flex-col overflow-hidden rounded-md border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                Properties
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {selectedIds.length}/{locations.length}
              </Badge>
            </div>
            <ul className="divide-y overflow-y-auto">
              {locations.map((loc) => {
                const checked = selectedIds.includes(loc.id);
                return (
                  <li key={loc.id}>
                    <button
                      type="button"
                      onClick={() => toggleLocation(loc.id)}
                      className={
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-accent/40 " +
                        (checked ? "bg-primary/5" : "")
                      }
                    >
                      <span
                        className={
                          "flex size-4 items-center justify-center rounded border " +
                          (checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30")
                        }
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="flex-1 truncate text-xs">
                        <span className="text-foreground font-medium">
                          {loc.address || `Property ${loc.locationNumber}`}
                        </span>
                        <span className="text-muted-foreground block">
                          {[loc.city, loc.state].filter(Boolean).join(", ")} ·{" "}
                          {loc.totalSqft.toLocaleString()} sqft
                        </span>
                      </span>
                      {checked && (
                        <Badge variant="default" className="text-[10px]">
                          L{loc.locationNumber}
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
              {locations.length === 0 && (
                <li className="text-muted-foreground p-4 text-center text-xs">
                  Add properties to this submission first.
                </li>
              )}
            </ul>
          </div>

          {/* Right: codes */}
          <div className="flex flex-col overflow-hidden rounded-md border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                Class codes & exposures
              </span>
              {codeRows.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {codeRows.length} code{codeRows.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>

            {/* Search */}
            <div className="relative border-b px-3 py-2">
              <div className="bg-muted/30 flex items-center gap-2 rounded-md border px-3">
                <Search className="text-muted-foreground size-3.5" />
                <Input
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search by description or code…"
                  className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
                {codeSearch && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCodeSearch("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {showDropdown && (
                <div className="bg-popover absolute left-3 right-3 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border shadow-md">
                  {filtered.length === 0 ? (
                    <div className="text-muted-foreground p-3 text-center text-sm">
                      No matching codes
                    </div>
                  ) : (
                    filtered.map((iso) => {
                      const added = !!codeRows.find((r) => r.code === iso.code);
                      return (
                        <button
                          key={iso.code}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickCode(iso);
                          }}
                          disabled={added}
                          className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                        >
                          <span className="text-primary bg-primary/10 rounded px-2 py-0.5 font-mono text-xs">
                            {iso.code}
                          </span>
                          <span className="flex-1 truncate">{iso.desc}</span>
                          {added && <Check className="text-emerald-600 size-3.5" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Code table */}
            <div className="flex-1 overflow-auto">
              {codeRows.length === 0 ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-1 p-8 text-center text-sm">
                  <p className="font-medium">No class codes added yet</p>
                  <p className="text-xs">
                    {selectedIds.length === 0
                      ? "Select properties first, then search above."
                      : "Search above to add class codes."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 sticky top-0">
                    <tr className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      {selectedIds.map((pid) => {
                        const loc = locations.find((l) => l.id === pid);
                        if (!loc) return null;
                        return (
                          <th
                            key={pid}
                            className="px-3 py-2 text-center font-semibold"
                          >
                            <div>Loc {loc.locationNumber}</div>
                            <div className="text-muted-foreground/70 text-[9px] font-normal normal-case tracking-normal">
                              {loc.totalSqft.toLocaleString()} sqft
                            </div>
                          </th>
                        );
                      })}
                      <th className="w-8 px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {codeRows.map((row) => (
                      <tr key={row.key}>
                        <td className="px-3 py-2">
                          <span className="text-primary bg-primary/10 rounded px-2 py-0.5 font-mono text-xs">
                            {row.code}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{row.desc}</td>
                        {selectedIds.map((pid) => (
                          <td key={pid} className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.exposures[pid] ?? ""}
                              onChange={(e) =>
                                setExposure(row.key, pid, e.target.value)
                              }
                              placeholder="—"
                              className="h-8 text-right text-xs"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeRow(row.key)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove code"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : editing ? "Update Row" : "Save Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

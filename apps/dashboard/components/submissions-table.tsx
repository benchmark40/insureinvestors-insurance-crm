"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Building2,
  ChevronsUpDown,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubmissionRow } from "@/lib/queries";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  ready: "secondary",
  sent: "secondary",
  partial: "secondary",
  quoted: "default",
  bound: "default",
  declined: "destructive",
  lost: "destructive",
  expired: "outline",
};

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type SortKey =
  | "customer"
  | "status"
  | "locationCount"
  | "quoteCount"
  | "targetEffectiveDate"
  | "createdAt";

type SortDir = "asc" | "desc";

const ALL = "__all__";

function compare(a: SubmissionRow, b: SubmissionRow, key: SortKey): number {
  switch (key) {
    case "customer":
    case "status":
      return a[key].localeCompare(b[key]);
    case "locationCount":
    case "quoteCount":
      return a[key] - b[key];
    case "targetEffectiveDate":
    case "createdAt": {
      const av = a[key] ? new Date(a[key] as string).getTime() : 0;
      const bv = b[key] ? new Date(b[key] as string).getTime() : 0;
      return av - bv;
    }
  }
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

export function SubmissionsTable({ rows }: { rows: SubmissionRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [lobFilter, setLobFilter] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.status))).sort(),
    [rows],
  );
  const lobOptions = useMemo(
    () =>
      Array.from(new Set(rows.flatMap((r) => r.linesOfBusiness))).sort(),
    [rows],
  );

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Dates default to newest-first, everything else A→Z / low→high.
      setSortDir(
        key === "createdAt" || key === "targetEffectiveDate" ? "desc" : "asc",
      );
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (statusFilter !== ALL && r.status !== statusFilter) return false;
      if (lobFilter !== ALL && !r.linesOfBusiness.includes(lobFilter))
        return false;
      if (q) {
        const haystack = `${r.customer} ${r.uuid}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => compare(a, b, sortKey));
    if (sortDir === "desc") sorted.reverse();
    return sorted;
  }, [rows, query, statusFilter, lobFilter, sortKey, sortDir]);

  const hasFilters = query.trim() !== "" || statusFilter !== ALL || lobFilter !== ALL;

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader className="gap-3">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Submission inbox</CardTitle>
            <p className="text-muted-foreground text-sm">
              {hasFilters
                ? `${visible.length} of ${rows.length} submissions`
                : "Latest first. Click any row to dig in."}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search customer or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-8 pl-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status">
                {(value) => (value === ALL ? "All statuses" : value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lobOptions.length > 0 && (
            <Select value={lobFilter} onValueChange={setLobFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Line of business">
                  {(value) => (value === ALL ? "All lines" : value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All lines</SelectItem>
                {lobOptions.map((lob) => (
                  <SelectItem key={lob} value={lob}>
                    {lob}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatusFilter(ALL);
                setLobFilter(ALL);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-6 py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>No submissions yet</EmptyTitle>
                <EmptyDescription>
                  When a customer finishes the onboarding flow, their submission
                  will land here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader
                  label="Customer"
                  sortKey="customer"
                  active={sortKey === "customer"}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Status"
                  sortKey="status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <TableHead>LOB</TableHead>
                <SortHeader
                  label="Properties"
                  sortKey="locationCount"
                  active={sortKey === "locationCount"}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Quotes"
                  sortKey="quoteCount"
                  active={sortKey === "quoteCount"}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Target effective"
                  sortKey="targetEffectiveDate"
                  active={sortKey === "targetEffectiveDate"}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Created"
                  sortKey="createdAt"
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No submissions match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((row) => (
                  <TableRow
                    key={row.uuid}
                    className="cursor-pointer"
                    onClick={() => router.push(`/submissions/${row.uuid}`)}
                  >
                    <TableCell>
                      <Link
                        href={`/submissions/${row.uuid}`}
                        className="font-medium hover:underline"
                      >
                        {row.customer}
                      </Link>
                      <div className="text-muted-foreground text-xs font-mono">
                        #{row.uuid.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.linesOfBusiness.length === 0 ? (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        ) : (
                          row.linesOfBusiness.map((lob) => (
                            <Badge
                              key={lob}
                              variant="outline"
                              className="text-xs"
                            >
                              {lob}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.locationCount}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.quoteCount}
                    </TableCell>
                    <TableCell>{formatDate(row.targetEffectiveDate)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        render={<Link href={`/submissions/${row.uuid}`} />}
                        aria-label="Open"
                      >
                        <ArrowUpRight />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

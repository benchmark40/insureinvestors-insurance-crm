import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Mail,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPolicyByUuid } from "@/lib/actions/policies";

export const dynamic = "force-dynamic";

const TXN_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  in_force: "default",
  voided: "destructive",
  superseded: "outline",
};

function formatUSD(n: number | string | null | undefined) {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const policy = await getPolicyByUuid(uuid);
  if (!policy) notFound();

  const customerName =
    policy.customer.businessName ||
    `${policy.customer.firstName ?? ""} ${policy.customer.lastName ?? ""}`.trim() ||
    "Unnamed";

  const latestTxn = policy.transactions.find((t) => t.status === "in_force") ??
    policy.transactions[0];
  const policyStatus = latestTxn?.status ?? "pending";

  const totalPremium = policy.transactions.reduce(
    (sum, t) => sum + Number(t.premiumChange),
    0,
  );
  const totalFees = policy.transactions.reduce(
    (sum, t) => sum + Number(t.feeChange),
    0,
  );
  const totalTaxes = policy.transactions.reduce(
    (sum, t) => sum + Number(t.taxChange),
    0,
  );

  const buildingCount = policy.locations.reduce(
    (n, l) => n + l.buildings.length,
    0,
  );
  const coverageCount = policy.transactions.reduce(
    (n, t) => n + t.buildingCoverages.length,
    0,
  );

  return (
    <PageShell title="Policy">
      <div className="space-y-4 px-4 py-5 lg:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Inbox
        </Button>

        <div className="@container/header grid gap-4 @4xl/header:grid-cols-[1fr_auto]">
          <Card>
            <CardContent className="flex flex-col gap-4 py-5 @lg/header:flex-row @lg/header:items-center @lg/header:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {customerName}
                  </h2>
                  <Badge variant={TXN_VARIANT[policyStatus] ?? "outline"}>
                    {policyStatus.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    Policy{" "}
                    <span className="font-mono">{policy.policyNumber || "—"}</span>
                  </span>
                  <span>Carrier: {policy.carrier.name}</span>
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    {formatDate(policy.inceptionDate)} →{" "}
                    {formatDate(policy.expirationDate)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {policy.linesOfBusiness.map((lob) => (
                    <Badge key={lob.id} variant="outline" className="text-xs">
                      {lob.code}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {policy.submission && (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href={`/submissions/${policy.submission.uuid}`} />
                    }
                  >
                    <Mail data-icon="inline-start" />
                    View submission
                  </Button>
                )}
                <Button size="sm">Endorse</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <KpiTile
              icon={Receipt}
              label="Premium"
              value={formatUSD(totalPremium)}
              sub={`Fees ${formatUSD(totalFees)} · Tax ${formatUSD(totalTaxes)}`}
            />
            <KpiTile
              icon={Building2}
              label="Properties"
              value={`${policy.locations.length}`}
              sub={`${buildingCount} bldg${buildingCount === 1 ? "" : "s"}`}
            />
            <KpiTile
              icon={ShieldCheck}
              label="Coverages"
              value={`${coverageCount}`}
              sub={`${policy.transactions.length} txn${policy.transactions.length === 1 ? "" : "s"}`}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction history</CardTitle>
            <CardDescription>
              Every change to this policy is a row here.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Premium Δ</TableHead>
                  <TableHead className="text-right">Fees Δ</TableHead>
                  <TableHead className="text-right">Tax Δ</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policy.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {t.transactionType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(t.effectiveDate)}</TableCell>
                    <TableCell>
                      <Badge variant={TXN_VARIANT[t.status] ?? "outline"}>
                        {t.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUSD(Number(t.premiumChange))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUSD(Number(t.feeChange))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUSD(Number(t.taxChange))}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.invoice ? (
                        <span className="font-mono text-xs">
                          {t.invoice.invoiceNumber}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {t.reason || t.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Building coverages</CardTitle>
            <CardDescription>
              From the latest in-force transaction.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {latestTxn && latestTxn.buildingCoverages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>LOB</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead className="text-right">Limit</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestTxn.buildingCoverages.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="text-sm">
                          Building {c.building.buildingNumber}
                          {c.building.name && (
                            <span className="text-muted-foreground ml-1">
                              · {c.building.name}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {c.building.location.addressLine1}
                          {c.building.location.city &&
                            `, ${c.building.location.city}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {c.lineOfBusiness.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {c.coverageType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUSD(Number(c.limit))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUSD(Number(c.premium))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground p-6 text-sm">
                No coverages on this policy yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="from-primary/5 to-card bg-linear-to-t shadow-xs">
      <CardContent className="flex h-full flex-col justify-between gap-2 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
          <Icon className="text-muted-foreground size-4" />
        </div>
        <div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
          <div className="text-muted-foreground text-xs">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

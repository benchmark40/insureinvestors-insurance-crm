import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

type Props = {
  uuid: string;
  customerName: string;
  status: string;
  createdAt: Date;
  linesOfBusiness: string[];
  locationCount: number;
  buildingCount: number;
  quoteCount: number;
  totalInsurableValue: number;
  targetEffectiveDate: Date | null;
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function SubmissionHeader({
  uuid,
  customerName,
  status,
  createdAt,
  linesOfBusiness,
  locationCount,
  buildingCount,
  quoteCount,
  totalInsurableValue,
  targetEffectiveDate,
}: Props) {
  return (
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
                <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
                  {status}
                </Badge>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">#{uuid.slice(0, 8)}</span>
                <span>Created {formatDate(createdAt)}</span>
                <span className="flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  Effective {formatDate(targetEffectiveDate)}
                </span>
              </div>
              {linesOfBusiness.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {linesOfBusiness.map((lob) => (
                    <Badge key={lob} variant="outline" className="text-xs">
                      {lob}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail data-icon="inline-start" />
                Email carrier
              </Button>
              <Button size="sm">Mark ready</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            icon={Building2}
            label="Properties"
            value={`${locationCount}`}
            sub={`${buildingCount} bldg${buildingCount === 1 ? "" : "s"}`}
          />
          <KpiTile
            icon={ShieldCheck}
            label="Insurable"
            value={formatUSD(totalInsurableValue)}
            sub="Total value"
          />
          <KpiTile
            icon={Mail}
            label="Quotes"
            value={`${quoteCount}`}
            sub="Received"
          />
        </div>
      </div>
    </div>
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

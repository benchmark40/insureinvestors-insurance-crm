import Link from "next/link";

import { ListPage } from "@/components/list-page";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listQuotes } from "@/lib/queries";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  received: "default",
  reviewing: "secondary",
  accepted: "default",
  rejected: "destructive",
  withdrawn: "outline",
  bound: "default",
  expired: "outline",
};

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function QuotesPage() {
  const quotes = await listQuotes();
  return (
    <ListPage
      title="Carrier Quotes"
      description="Quote responses across every submission."
    >
      {quotes.length === 0 ? (
        <div className="px-6 py-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Mail />
              </EmptyMedia>
              <EmptyTitle>No quotes yet</EmptyTitle>
              <EmptyDescription>
                When carriers respond to your submissions, log their quotes
                from the submission&apos;s Carriers tab.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carrier</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Quote #</TableHead>
              <TableHead className="text-right">Premium</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.carrier}</TableCell>
                <TableCell>
                  <Link
                    href={`/submissions/${q.submissionUuid}`}
                    className="hover:underline"
                  >
                    {q.customer}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {q.quoteNumber || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUSD(q.premium)}
                </TableCell>
                <TableCell>{formatDate(q.effectiveDate)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(q.receivedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[q.status] ?? "outline"}>
                    {q.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ListPage>
  );
}

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
import { listPolicies } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  in_force: "default",
  voided: "destructive",
  superseded: "outline",
};

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PoliciesPage() {
  const policies = await listPolicies();
  return (
    <ListPage
      title="Policies"
      description="Every bound policy with its current in-force transaction."
    >
      {policies.length === 0 ? (
        <div className="px-6 py-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck />
              </EmptyMedia>
              <EmptyTitle>No policies yet</EmptyTitle>
              <EmptyDescription>
                When you bind a quote on a submission, the resulting policy
                lands here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Premium</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((p) => (
              <TableRow key={p.uuid}>
                <TableCell>
                  <Link
                    href={`/policies/${p.uuid}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {p.policyNumber || `#${p.uuid.slice(0, 8)}`}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{p.customer}</TableCell>
                <TableCell>{p.carrier}</TableCell>
                <TableCell>{formatDate(p.inceptionDate)}</TableCell>
                <TableCell>{formatDate(p.expirationDate)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUSD(p.premium)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                    {p.status.replace("_", " ")}
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

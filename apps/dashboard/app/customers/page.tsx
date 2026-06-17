import { Users } from "lucide-react";

import { ListPage } from "@/components/list-page";
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
import { listCustomers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await listCustomers();
  return (
    <ListPage
      title="Customers"
      description="Every account on your broker. Submissions, policies, and claims aggregated."
    >
      {customers.length === 0 ? (
        <div className="px-6 py-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No customers yet</EmptyTitle>
              <EmptyDescription>
                When a customer fills out the onboarding form, they land here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="text-right">Policies</TableHead>
              <TableHead className="text-right">Claims</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.uuid}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.email || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.submissionCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.policyCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.claimCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ListPage>
  );
}

import { Building2 } from "lucide-react";

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
import { listCarriers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CarriersPage() {
  const carriers = await listCarriers();
  return (
    <ListPage
      title="Carriers"
      description="The carrier panel you can send submissions to."
    >
      {carriers.length === 0 ? (
        <div className="px-6 py-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No carriers seeded</EmptyTitle>
              <EmptyDescription>
                Run <code className="bg-muted rounded px-1 py-0.5 text-xs">bun db:seed</code> from the monorepo root to populate the default carrier panel.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carrier</TableHead>
              <TableHead>NAIC</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Contacts</TableHead>
              <TableHead className="text-right">Policies</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carriers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs">{c.naic || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.parentCompany || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {c.kind === "carrier" ? "Direct" : c.kind}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.personnelCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.policyCount}
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "default" : "outline"}>
                    {c.isActive ? "Active" : "Inactive"}
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

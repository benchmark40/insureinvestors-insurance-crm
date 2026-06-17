import Link from "next/link";
import { ArrowRight, FilePlus2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { getMySubmissions } from "@/lib/actions/client";

export default async function PortalSubmissionsPage() {
  const submissions = await getMySubmissions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your submissions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track the status of every quote you&apos;ve submitted.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          <FilePlus2 data-icon="inline-start" />
          New quote
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Empty className="border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePlus2 />
            </EmptyMedia>
            <EmptyTitle>No submissions yet</EmptyTitle>
            <EmptyDescription>
              Once you submit a quote it will show up here with its status.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/" />}>
              Start a quote
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((s) => {
            const buildingCount = s.locations.reduce(
              (n, l) => n + l._count.buildings,
              0,
            );
            const title =
              s.customer.businessName || s.namedInsured || "Untitled submission";
            const awaitingPayment = s.proposals.some(
              (p) => p.status === "presented",
            );
            const hasPolicy = s._count.boundPolicies > 0;
            return (
              <Link key={s.uuid} href={`/portal/submissions/${s.uuid}`}>
                <Card
                  size="sm"
                  className="transition-colors hover:ring-foreground/20"
                >
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{title}</span>
                        <SubmissionStatusBadge status={s.status} />
                        {hasPolicy ? (
                          <Badge className="bg-green-600 hover:bg-green-600">
                            Policy active
                          </Badge>
                        ) : awaitingPayment ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500">
                            Ready to review &amp; pay
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="font-mono">
                          #{s.uuid.slice(0, 8)}
                        </Badge>
                        <span>
                          {s._count.locations} propert
                          {s._count.locations === 1 ? "y" : "ies"}
                        </span>
                        <span>·</span>
                        <span>
                          {buildingCount} building{buildingCount === 1 ? "" : "s"}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(s.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

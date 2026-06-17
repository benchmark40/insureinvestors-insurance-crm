import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { ClientAccountPrompt } from "@/components/client-account-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getOnboardingAccountState } from "@/lib/actions/client";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

export default async function CompletePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  const accountState = await getOnboardingAccountState(
    submission.customer.email,
  );

  const buildingCount = submission.locations.reduce(
    (n, l) => n + l.buildings.length,
    0,
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle>Submission received</EmptyTitle>
            <EmptyDescription>
              We have your details and we&apos;re reaching out to our carriers
              now. You&apos;ll hear back from your broker with quotes shortly.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="font-mono">
                #{submission.uuid.slice(0, 8)}
              </Badge>
              <Badge variant="outline">
                {submission.locations.length} propert
                {submission.locations.length === 1 ? "y" : "ies"}
              </Badge>
              <Badge variant="outline">
                {buildingCount} building{buildingCount === 1 ? "" : "s"}
              </Badge>
            </div>
            <ClientAccountPrompt
              email={submission.customer.email}
              exists={accountState.exists}
              signedIn={!!accountState.clientSession}
              link={{ kind: "submission", uuid: submission.uuid }}
            />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back to home
            </Button>
          </EmptyContent>
        </Empty>
    </main>
  );
}

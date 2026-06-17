import { notFound } from "next/navigation";

import { SnapshotForm } from "@/components/forms/snapshot-form";
import { StepIndicator } from "@/components/step-indicator";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

export default async function QuotingSnapshotPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  return (
    <>
      <StepIndicator current="quoting-snapshot" />
      <main className="mx-auto max-w-2xl px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Almost done — a few last questions
          </h1>
          <p className="text-muted-foreground mt-2">
            Prior coverage and claims history help us route your submission to
            the right carriers.
          </p>
        </div>
        <SnapshotForm
          submissionUuid={submission.uuid}
          submission={{
            hasPriorCoverage: submission.hasPriorCoverage,
            priorCarrier: submission.priorCarrier,
            priorExpirationDate: submission.priorExpirationDate
              ? submission.priorExpirationDate.toISOString().split("T")[0] ??
                null
              : null,
            claimsInLast5Years: submission.claimsInLast5Years,
            priorClaimsMoldOrAsbestos: submission.priorClaimsMoldOrAsbestos,
          }}
        />
      </main>
    </>
  );
}

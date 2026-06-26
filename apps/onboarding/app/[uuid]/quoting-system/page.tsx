import { notFound } from "next/navigation";

import { PolicySetupForm } from "@/components/portfolio/policy-setup-form";
import { PortfolioShell } from "@/components/portfolio/shell";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

export default async function QuotingSystemPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  return (
    <PortfolioShell wide startOver>
      <PolicySetupForm
        submissionUuid={submission.uuid}
        customer={{
          uuid: submission.customer.uuid,
          customerType: submission.customer.customerType,
          firstName: submission.customer.firstName ?? "",
          lastName: submission.customer.lastName ?? "",
          businessName: submission.customer.businessName ?? "",
          email: submission.customer.email ?? "",
        }}
        submission={{
          policyType: "",
          locations: submission.locations.length,
          targetEffectiveDate: submission.targetEffectiveDate
            ? (submission.targetEffectiveDate.toISOString().split("T")[0] ?? null)
            : null,
        }}
      />
    </PortfolioShell>
  );
}

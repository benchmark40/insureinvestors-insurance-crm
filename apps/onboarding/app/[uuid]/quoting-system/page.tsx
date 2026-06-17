import { notFound } from "next/navigation";

import { CustomerInfoForm } from "@/components/forms/customer-info-form";
import { StepIndicator } from "@/components/step-indicator";
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
    <>
      <StepIndicator current="quoting-system" />
      <main className="mx-auto max-w-2xl px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Tell us about your business
          </h1>
          <p className="text-muted-foreground mt-2">
            This is the named insured on the policy and how we&apos;ll reach
            you.
          </p>
        </div>
        <CustomerInfoForm
          submissionUuid={submission.uuid}
          customer={{
            uuid: submission.customer.uuid,
            businessName: submission.customer.businessName,
            businessEntity: submission.customer.businessEntity,
            federalId: submission.customer.federalId,
            email: submission.customer.email,
            phone: submission.customer.phone,
            addressLine1: submission.customer.addressLine1,
            addressLine2: submission.customer.addressLine2,
            city: submission.customer.city,
            state: submission.customer.state,
            zipCode: submission.customer.zipCode,
          }}
          submission={{
            linesOfBusiness: (submission.linesOfBusiness as string[]) ?? [],
            targetEffectiveDate: submission.targetEffectiveDate
              ? submission.targetEffectiveDate.toISOString().split("T")[0] ??
                null
              : null,
          }}
        />
      </main>
    </>
  );
}

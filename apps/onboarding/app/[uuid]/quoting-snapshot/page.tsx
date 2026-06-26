import { notFound } from "next/navigation";

import { CheckoutSnapshot } from "@/components/portfolio/checkout-snapshot";
import { PortfolioShell } from "@/components/portfolio/shell";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

export default async function QuotingSnapshotPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  const c = submission.customer;
  const contactName =
    `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.businessName || "";

  const properties = submission.locations.map((loc) => {
    const b = loc.buildings[0];
    return {
      line1: loc.addressLine1,
      use: b?.propertyUsage ?? "",
      tiv: b?.insurableValue ? b.insurableValue.toString() : "",
    };
  });

  return (
    <PortfolioShell startOver>
      <CheckoutSnapshot
        submissionUuid={submission.uuid}
        customer={{
          uuid: c.uuid,
          name: contactName,
          email: c.email ?? "",
          phone: c.phone ?? "",
          entity: c.businessName ?? "",
        }}
        snapshot={{
          hasPriorCoverage: submission.hasPriorCoverage,
          priorCarrier: submission.priorCarrier,
          priorExpirationDate: submission.priorExpirationDate
            ? (submission.priorExpirationDate.toISOString().split("T")[0] ?? null)
            : null,
          claimsInLast5Years: submission.claimsInLast5Years,
          priorClaimsMoldOrAsbestos: submission.priorClaimsMoldOrAsbestos,
        }}
        properties={properties}
      />
    </PortfolioShell>
  );
}

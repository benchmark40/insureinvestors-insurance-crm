import { notFound } from "next/navigation";

import { Icon } from "@/components/portfolio/bm-ui";
import { PortfolioShell } from "@/components/portfolio/shell";
import { ClientAccountPrompt } from "@/components/client-account-prompt";
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
    <PortfolioShell>
      <div className="done">
        <span className="done__check">
          <Icon name="check" size={34} stroke={2.6} />
        </span>
        <h2 className="done__t">Your portfolio quote is on its way</h2>
        <p className="done__d">
          A Benchmark advisor will review your {submission.locations.length}
          {"-"}property schedule ({buildingCount} building
          {buildingCount === 1 ? "" : "s"}) and send firm numbers within one
          business day
          {submission.customer.email ? (
            <>
              {" "}
              to <b>{submission.customer.email}</b>
            </>
          ) : null}
          .
        </p>
        <div className="done__ref">Reference · {submission.uuid.slice(0, 8).toUpperCase()}</div>

        <div className="done__account">
          <ClientAccountPrompt
            email={submission.customer.email}
            exists={accountState.exists}
            signedIn={!!accountState.clientSession}
            link={{ kind: "submission", uuid: submission.uuid }}
          />
        </div>
      </div>
    </PortfolioShell>
  );
}

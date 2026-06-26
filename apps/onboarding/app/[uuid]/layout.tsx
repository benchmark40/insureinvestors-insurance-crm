import { notFound } from "next/navigation";

import { getSubmissionByUuid } from "@/lib/actions/submissions";

// The Property Portfolio Quote flow provides its own chrome (PortfolioShell),
// so the flow layout only guards the submission and passes children through.
export default async function FlowLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const submission = await getSubmissionByUuid(uuid);
  if (!submission) notFound();

  return <>{children}</>;
}

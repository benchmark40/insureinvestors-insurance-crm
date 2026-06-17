import { notFound } from "next/navigation";

import { SessionHeader } from "@/components/session-header";
import { getSubmissionByUuid } from "@/lib/actions/submissions";

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

  return (
    <>
      <SessionHeader />
      {children}
    </>
  );
}

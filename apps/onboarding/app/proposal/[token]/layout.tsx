import { SessionHeader } from "@/components/session-header";

export default function ProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionHeader />
      {children}
    </>
  );
}

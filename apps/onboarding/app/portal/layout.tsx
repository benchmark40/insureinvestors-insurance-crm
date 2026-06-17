import { PortalHeader } from "@/components/portal-header";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortalHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </>
  );
}

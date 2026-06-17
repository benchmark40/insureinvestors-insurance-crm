import { PageShell } from "@/components/page-shell";
import { SubmissionsTable } from "@/components/submissions-table";
import { listSubmissions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SubmissionsListPage() {
  const submissions = await listSubmissions();
  return (
    <PageShell title="Submissions">
      <div className="py-5">
        <SubmissionsTable rows={submissions} />
      </div>
    </PageShell>
  );
}

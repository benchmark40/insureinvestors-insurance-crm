import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";

type Props = {
  title: string;
  shellTitle?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function ListPage({
  title,
  shellTitle,
  description,
  action,
  children,
}: Props) {
  return (
    <PageShell title={shellTitle ?? title}>
      <div className="space-y-4 px-4 py-5 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {action}
          </CardHeader>
          <CardContent className="p-0">{children}</CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

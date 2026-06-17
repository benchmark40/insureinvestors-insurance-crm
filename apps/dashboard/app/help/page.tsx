import { HelpCircle } from "lucide-react";

import { ListPage } from "@/components/list-page";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function HelpPage() {
  return (
    <ListPage title="Help" description="Docs, support, and shortcuts.">
      <div className="px-6 py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HelpCircle />
            </EmptyMedia>
            <EmptyTitle>Need a hand?</EmptyTitle>
            <EmptyDescription>
              Email{" "}
              <a
                className="text-primary hover:underline"
                href="mailto:alberto@insurecert.com"
              >
                alberto@insurecert.com
              </a>{" "}
              and we&apos;ll get back to you fast.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </ListPage>
  );
}

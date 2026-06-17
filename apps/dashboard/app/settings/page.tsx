import { Settings2 } from "lucide-react";

import { ListPage } from "@/components/list-page";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function SettingsPage() {
  return (
    <ListPage title="Settings" description="Account, broker, integrations.">
      <div className="px-6 py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Settings2 />
            </EmptyMedia>
            <EmptyTitle>Settings coming soon</EmptyTitle>
            <EmptyDescription>
              Broker profile, user management, carrier panel edits, integration
              keys.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </ListPage>
  );
}

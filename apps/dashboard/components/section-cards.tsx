import {
  CheckCircle2,
  ClockIcon,
  FileEditIcon,
  InboxIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Stats = {
  total: number;
  last30Days: number;
  draft: number;
  inFlight: number;
  quoted: number;
  bound: number;
};

export function SectionCards({ stats }: { stats: Stats }) {
  const hitRate =
    stats.quoted + stats.bound > 0
      ? Math.round((stats.bound / (stats.quoted + stats.bound)) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total submissions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <InboxIcon />
              {stats.last30Days} in 30d
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All-time inbox count
          </div>
          <div className="text-muted-foreground">
            Across every customer and broker
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Drafts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.draft}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <FileEditIcon />
              Open
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Still being filled out
          </div>
          <div className="text-muted-foreground">
            Not yet ready for carrier review
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>In flight</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.inFlight}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ClockIcon />
              Waiting on carriers
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Ready, sent, or partially quoted
          </div>
          <div className="text-muted-foreground">
            Track follow-ups here
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Bound</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.bound}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CheckCircle2 />
              Won
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.quoted} quoted, {stats.bound} bound
          </div>
          <div className="text-muted-foreground">
            Hit rate {hitRate}%
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

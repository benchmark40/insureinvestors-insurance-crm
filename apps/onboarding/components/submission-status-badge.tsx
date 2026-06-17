import { Badge } from "@/components/ui/badge";

type Variant = React.ComponentProps<typeof Badge>["variant"];

/** Client-facing label + badge style for each SubmissionStatus. */
const STATUS: Record<string, { label: string; variant: Variant }> = {
  draft: { label: "In progress", variant: "outline" },
  ready: { label: "Submitted", variant: "secondary" },
  sent: { label: "With carriers", variant: "default" },
  partial: { label: "Quotes coming in", variant: "default" },
  quoted: { label: "Quoted", variant: "default" },
  bound: { label: "Bound", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  lost: { label: "Closed", variant: "outline" },
  expired: { label: "Expired", variant: "outline" },
};

export function SubmissionStatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

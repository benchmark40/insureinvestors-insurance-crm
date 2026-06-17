import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepKey = "quoting-system" | "multy-property" | "quoting-snapshot";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "quoting-system", label: "About your business" },
  { key: "multy-property", label: "Add your properties" },
  { key: "quoting-snapshot", label: "Review & submit" },
];

export function StepIndicator({ current }: { current: StepKey }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mx-auto flex w-full max-w-2xl items-center gap-2 px-6 py-4">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <li
            key={step.key}
            className="flex flex-1 items-center gap-3 last:flex-none"
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete &&
                    "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete &&
                    !isCurrent &&
                    "border-border text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  isComplete ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

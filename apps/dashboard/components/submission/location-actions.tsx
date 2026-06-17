"use client";

import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createSubmissionLocation,
  deleteSubmissionLocation,
} from "@/lib/actions/locations";

export function AddLocationButton({
  submissionUuid,
  variant = "default",
  size = "sm",
  label = "Add Location",
}: {
  submissionUuid: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default";
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await createSubmissionLocation(submissionUuid);
          } catch {
            toast.error("Couldn't add location");
          }
        })
      }
    >
      <Plus data-icon="inline-start" />
      {label}
    </Button>
  );
}

export function DeleteLocationButton({
  uuid,
  ariaLabel = "Delete location",
}: {
  uuid: string;
  ariaLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive size-8"
      aria-label={ariaLabel}
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this location and all its buildings?")) return;
        startTransition(async () => {
          try {
            await deleteSubmissionLocation(uuid);
          } catch {
            toast.error("Couldn't delete location");
          }
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

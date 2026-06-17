"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeft, ArrowRight, MapPinPlus, Plus } from "lucide-react";

import { LocationCard } from "@/components/forms/location-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createLocation } from "@/lib/actions/locations";

type Location = React.ComponentProps<typeof LocationCard>["location"];

export function PropertiesSection({
  submissionUuid,
  locations,
}: {
  submissionUuid: string;
  locations: Location[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onAddLocation() {
    startTransition(async () => {
      await createLocation(submissionUuid);
    });
  }

  function onBack() {
    router.push(`/${submissionUuid}/quoting-system`);
  }

  function onContinue() {
    router.push(`/${submissionUuid}/quoting-snapshot`);
  }

  return (
    <div className="space-y-6">
      {locations.length === 0 ? (
        <Empty className="border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinPlus />
            </EmptyMedia>
            <EmptyTitle>Add your first property</EmptyTitle>
            <EmptyDescription>
              Every quote needs at least one location. You can add more after.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onAddLocation} disabled={isPending}>
              <Plus data-icon="inline-start" />
              Add property
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="space-y-4">
            {locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onAddLocation}
            disabled={isPending}
            className="w-full"
          >
            <Plus data-icon="inline-start" />
            Add another property
          </Button>
        </>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          disabled={locations.length === 0}
        >
          Continue
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

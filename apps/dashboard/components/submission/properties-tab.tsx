import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { MapPin } from "lucide-react";

import { AddLocationButton } from "@/components/submission/location-actions";
import {
  LocationEditCard,
  type LocationEditValue,
} from "@/components/submission/location-edit-card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatCurrency } from "@insureinvestorsv2/lib";

export function PropertiesTab({
  submissionUuid,
  locations,
}: {
  submissionUuid: string;
  locations: LocationEditValue[];
}) {
  if (locations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPin />
          </EmptyMedia>
          <EmptyTitle>No properties on this submission</EmptyTitle>
          <EmptyDescription>
            Add a location to start building out the property schedule.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AddLocationButton submissionUuid={submissionUuid} />
        </EmptyContent>
      </Empty>
    );
  }

  const totalInsurableValue = locations
    .flatMap((l) => l.buildings)
    .reduce((sum, b) => sum + Number(b.insurableValue ?? 0), 0);
  const totalBuildings = locations.reduce(
    (n, l) => n + l.buildings.length,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">
            {locations.length} propert{locations.length === 1 ? "y" : "ies"}
          </Badge>
          <Badge variant="secondary">
            {totalBuildings} building{totalBuildings === 1 ? "" : "s"}
          </Badge>
          <Badge variant="secondary">
            {formatCurrency(totalInsurableValue)} total insurable value
          </Badge>
        </div>
        <AddLocationButton submissionUuid={submissionUuid} />
      </div>

      <AccordionPrimitive.Root className="flex flex-col gap-3">
        {locations.map((loc) => (
          <LocationEditCard key={loc.id} location={loc} />
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
}

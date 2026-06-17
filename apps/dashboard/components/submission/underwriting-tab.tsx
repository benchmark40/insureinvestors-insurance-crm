"use client";

import { useState, useTransition } from "react";
import { Building2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILDING_LOCATION_HAS_FLAGS,
  BUILDING_OTHER_FLAGS,
  LOCATION_LEASE_FLAGS,
  LOCATION_LOCATION_HAS_FLAGS,
  LOCATION_OTHER_FLAGS,
  OCCUPANCY_CLASS_OPTIONS,
  SUBMISSION_GENERAL_INFO_FLAGS,
  SUBMISSION_LEASE_FLAGS,
  SUBMISSION_LEGAL_FLAGS,
  type FlagDef,
} from "@insureinvestorsv2/lib";
import { updateBuilding } from "@/lib/actions/buildings";
import { updateLocation } from "@/lib/actions/locations";
import { updateSubmission } from "@/lib/actions/submissions";

type SubmissionFlags = Record<string, boolean | string> & {
  businessDescription: string;
  additionalInsuredNames: string;
  certificatesOfInsuranceNotes: string;
};

type LocationFlags = Record<
  string,
  boolean | string | number | null | BuildingFlags[]
> & {
  id: number;
  uuid: string;
  locationNumber: number;
  addressLine1: string;
  city: string;
  state: string;
  occupancyClass: string;
  warehouseOtherUseDescription: string;
  buildings: BuildingFlags[];
};

type BuildingFlags = Record<string, boolean | string | number | null> & {
  id: number;
  buildingNumber: number;
  name: string;
};

const ELECTRICAL_FIELDS = new Set([
  "hazardKnobAndTubeWiring",
  "hazardAluminumWiring",
  "hazardFuses",
  "hazardFederalPacificPanel",
  "hazardZinscoPanel",
  "hazardPigtailWiring",
]);
const PLUMBING_FIELDS = new Set([
  "hazardPolybutylenePlumbing",
  "hazardSteelIronPlumbing",
]);

const ELECTRICAL_HAZARDS = BUILDING_LOCATION_HAS_FLAGS.filter((f) =>
  ELECTRICAL_FIELDS.has(f.field),
);
const PLUMBING_HAZARDS = BUILDING_LOCATION_HAS_FLAGS.filter((f) =>
  PLUMBING_FIELDS.has(f.field),
);
const STRUCTURAL_HAZARDS = [
  ...BUILDING_LOCATION_HAS_FLAGS.filter(
    (f) => !ELECTRICAL_FIELDS.has(f.field) && !PLUMBING_FIELDS.has(f.field),
  ),
  ...BUILDING_OTHER_FLAGS,
];

export function UnderwritingTab({
  submissionUuid,
  submission,
  locations,
}: {
  submissionUuid: string;
  submission: SubmissionFlags;
  locations: LocationFlags[];
}) {
  return (
    <div className="space-y-6">
      <SubmissionCard submissionUuid={submissionUuid} initial={submission} />
      {locations.map((loc) => (
        <LocationCard key={loc.id} location={loc} />
      ))}
    </div>
  );
}

// =============================================================================
// Submission card — Groups 1 / 2 / 3 (submission level)
// =============================================================================

function SubmissionCard({
  submissionUuid,
  initial,
}: {
  submissionUuid: string;
  initial: SubmissionFlags;
}) {
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(initial);

  function toggle(field: string, next: boolean) {
    setValues((v) => ({ ...v, [field]: next }));
    startTransition(async () => {
      try {
        await updateSubmission(submissionUuid, { [field]: next });
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function saveText(field: string, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    startTransition(async () => {
      try {
        await updateSubmission(submissionUuid, { [field]: value });
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Applicant underwriting</CardTitle>
        <CardDescription>
          Submission-level context. Auto-saves on every change.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="general">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">General policy info</TabsTrigger>
            <TabsTrigger value="legal">Legal & history</TabsTrigger>
            <TabsTrigger value="lease">Lease & tenant</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="pt-3">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="businessDescription">
                  Describe the applicant&apos;s business operations
                </FieldLabel>
                <Textarea
                  id="businessDescription"
                  defaultValue={values.businessDescription}
                  onBlur={(e) =>
                    saveText("businessDescription", e.target.value)
                  }
                  rows={3}
                />
              </Field>
              <FlagGrid
                flags={SUBMISSION_GENERAL_INFO_FLAGS}
                values={values as unknown as Record<string, boolean>}
                onToggle={toggle}
              />
            </FieldGroup>
          </TabsContent>

          <TabsContent value="legal" className="pt-3">
            <FlagGrid
              flags={SUBMISSION_LEGAL_FLAGS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
          </TabsContent>

          <TabsContent value="lease" className="pt-3">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="additionalInsuredNames">
                  Name the applicant as an Additional Insured
                </FieldLabel>
                <Input
                  id="additionalInsuredNames"
                  defaultValue={values.additionalInsuredNames}
                  onBlur={(e) =>
                    saveText("additionalInsuredNames", e.target.value)
                  }
                  placeholder="Acme Holdings LLC"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="certificatesOfInsuranceNotes">
                  Provide current Certificates of Insurance
                </FieldLabel>
                <Input
                  id="certificatesOfInsuranceNotes"
                  defaultValue={values.certificatesOfInsuranceNotes}
                  onBlur={(e) =>
                    saveText("certificatesOfInsuranceNotes", e.target.value)
                  }
                  placeholder="e.g. on file via shared drive"
                />
              </Field>
              <FlagGrid
                flags={SUBMISSION_LEASE_FLAGS}
                values={values as unknown as Record<string, boolean>}
                onToggle={toggle}
              />
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Per-location card — Groups 3 (location half) / 4 / 6
// =============================================================================

function LocationCard({ location }: { location: LocationFlags }) {
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(location);

  function toggle(field: string, next: boolean) {
    setValues((v) => ({ ...v, [field]: next }));
    startTransition(async () => {
      try {
        await updateLocation(location.uuid, { [field]: next });
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function saveText(field: string, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    startTransition(async () => {
      try {
        await updateLocation(location.uuid, { [field]: value });
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function setOccupancyClass(value: string) {
    setValues((v) => ({ ...v, occupancyClass: value }));
    startTransition(async () => {
      try {
        await updateLocation(location.uuid, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          occupancyClass: value as any,
        });
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  const addressBits = [
    location.addressLine1,
    location.city,
    location.state,
  ].filter(Boolean);

  const hasBuildings = location.buildings.length > 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin data-icon="inline-start" className="text-primary" />
            Property {location.locationNumber}
            {addressBits.length > 0 && (
              <span className="text-muted-foreground font-normal">
                · {addressBits.join(", ")}
              </span>
            )}
          </CardTitle>
          <Badge variant="outline">
            {location.buildings.length} building
            {location.buildings.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="occ">
          <TabsList className="flex-wrap">
            <TabsTrigger value="occ">Occupancy</TabsTrigger>
            <TabsTrigger value="lease">Lease & tenant</TabsTrigger>
            <TabsTrigger value="has">Location has</TabsTrigger>
            <TabsTrigger value="other">Other flags</TabsTrigger>
            {hasBuildings && (
              <TabsTrigger value="buildings">
                Building hazards ({location.buildings.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="occ" className="pt-3">
            <Field className="sm:max-w-md">
              <FieldLabel htmlFor={`occ-${location.id}`}>
                Pick the primary occupancy
              </FieldLabel>
              <FieldDescription>
                Includes detective, church, daycare, bowling alley, adult
                entertainment, agriculture, aviation, arts & entertainment,
                auto, mobile home, nursing home, rehab housing, shelter,
                sorority / fraternity, distillery, paint sales — and more.
              </FieldDescription>
              <Select
                value={(values.occupancyClass as string) || "none"}
                onValueChange={(v) => setOccupancyClass(v ?? "")}
              >
                <SelectTrigger id={`occ-${location.id}`}>
                  <SelectValue placeholder="Pick an occupancy class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {OCCUPANCY_CLASS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>

          <TabsContent value="lease" className="pt-3">
            <FlagGrid
              flags={LOCATION_LEASE_FLAGS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
          </TabsContent>

          <TabsContent value="has" className="pt-3">
            <FlagGrid
              flags={LOCATION_LOCATION_HAS_FLAGS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
          </TabsContent>

          <TabsContent value="other" className="pt-3">
            <FlagGrid
              flags={LOCATION_OTHER_FLAGS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
            {values.warehouseOtherThanGeneral === true && (
              <Field className="mt-3">
                <FieldLabel htmlFor={`warehouse-${location.id}`}>
                  Please provide more information on each warehouse
                </FieldLabel>
                <Textarea
                  id={`warehouse-${location.id}`}
                  defaultValue={values.warehouseOtherUseDescription}
                  onBlur={(e) =>
                    saveText("warehouseOtherUseDescription", e.target.value)
                  }
                  rows={2}
                  placeholder="e.g. mini-storage units, light manufacturing, cold storage"
                />
              </Field>
            )}
          </TabsContent>

          {hasBuildings && (
            <TabsContent value="buildings" className="pt-3">
              <div className="space-y-3">
                {location.buildings.map((b) => (
                  <BuildingCard key={b.id} building={b} />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Per-building card — Group 4 (building hazards)
// =============================================================================

function BuildingCard({ building }: { building: BuildingFlags }) {
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(building);

  function toggle(field: string, next: boolean) {
    setValues((v) => ({ ...v, [field]: next }));
    startTransition(async () => {
      try {
        await updateBuilding(building.id, { [field]: next });
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Badge variant="outline">
            <Building2 />
            Building {building.buildingNumber}
          </Badge>
          {building.name && (
            <span className="text-muted-foreground font-normal">
              · {building.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue={`elec-${building.id}`}>
          <TabsList className="flex-wrap">
            <TabsTrigger value={`elec-${building.id}`}>Electrical</TabsTrigger>
            <TabsTrigger value={`plumb-${building.id}`}>Plumbing</TabsTrigger>
            <TabsTrigger value={`struct-${building.id}`}>
              Structural & condition
            </TabsTrigger>
          </TabsList>

          <TabsContent value={`elec-${building.id}`} className="pt-3">
            <FlagGrid
              flags={ELECTRICAL_HAZARDS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
          </TabsContent>
          <TabsContent value={`plumb-${building.id}`} className="pt-3">
            <FlagGrid
              flags={PLUMBING_HAZARDS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
          </TabsContent>
          <TabsContent value={`struct-${building.id}`} className="pt-3">
            <FlagGrid
              flags={STRUCTURAL_HAZARDS}
              values={values as unknown as Record<string, boolean>}
              onToggle={toggle}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Layout primitives
// =============================================================================

function FlagGrid({
  flags,
  values,
  onToggle,
}: {
  flags: FlagDef[];
  values: Record<string, boolean>;
  onToggle: (field: string, next: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {flags.map((f) => {
        const checked = !!values[f.field];
        return (
          <Label
            key={f.field}
            htmlFor={f.field}
            className="hover:bg-accent/30 has-data-[state=checked]:border-destructive/40 has-data-[state=checked]:bg-destructive/5 flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
          >
            <Switch
              id={f.field}
              checked={checked}
              onCheckedChange={(v) => onToggle(f.field, v === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1">
              <span className="text-sm font-medium leading-snug">
                {f.label}
              </span>
              {f.help && (
                <span className="text-muted-foreground text-xs">{f.help}</span>
              )}
            </div>
          </Label>
        );
      })}
    </div>
  );
}

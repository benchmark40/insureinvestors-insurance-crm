"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronRight, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddressLookup } from "@/components/forms/address-lookup";
import { BuildingCard } from "@/components/forms/building-card";
import { MortgageeLookup } from "@/components/forms/mortgagee-lookup";
import type { MortgageeSuggestion } from "@/lib/actions/mortgagees";
import {
  enrichAddress,
  enrichBuildingFromLocation,
  type AddressSuggestion,
  type EnrichedBuilding,
} from "@/lib/actions/addresses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createBuilding } from "@/lib/actions/buildings";
import { deleteLocation, updateLocation } from "@/lib/actions/locations";

type Building = React.ComponentProps<typeof BuildingCard>["building"];

type Location = {
  id: number;
  uuid: string;
  locationNumber: number;
  namedInsured: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  reapiPropertyId: string;
  mortgageeName: string;
  mortgagee: MortgageeSuggestion | null;
  buildings: Building[];
};

export function LocationCard({ location }: { location: Location }) {
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const [namedInsured, setNamedInsured] = useState(location.namedInsured);
  const [addressLine1, setAddressLine1] = useState(location.addressLine1);
  const [addressLine2, setAddressLine2] = useState(location.addressLine2);
  const [city, setCity] = useState(location.city);
  const [state, setState] = useState(location.state);
  const [zipCode, setZipCode] = useState(location.zipCode);
  const [mortgageeName, setMortgageeName] = useState(location.mortgageeName);
  const [mortgagee, setMortgagee] = useState(location.mortgagee);
  const [mortgageeDetailsOpen, setMortgageeDetailsOpen] = useState(false);
  // PropertyDetail-derived building defaults, cached from the address pick so
  // every building we add to this property can be pre-filled for free.
  const [buildingTemplate, setBuildingTemplate] =
    useState<EnrichedBuilding | null>(null);

  function save() {
    setSaving(true);
    startTransition(async () => {
      try {
        await updateLocation(location.uuid, {
          namedInsured,
          addressLine1,
          addressLine2,
          city,
          state,
          zipCode,
          mortgageeName,
        });
      } catch {
        toast.error("Couldn't save location.");
      } finally {
        setSaving(false);
      }
    });
  }

  function applyPickedAddress(picked: AddressSuggestion) {
    // Reflect the picked address immediately for a responsive feel.
    setAddressLine1(picked.addressLine1);
    setCity(picked.city);
    setState(picked.state);
    setZipCode(picked.zipCode);
    setSaving(true);
    startTransition(async () => {
      try {
        // Pull full property facts (RealEstateAPI). Null when unavailable —
        // we still save the plain address from the suggestion.
        const enriched = await enrichAddress(picked);
        const addr = enriched?.address;

        if (addr) {
          setAddressLine1(addr.addressLine1);
          setCity(addr.city);
          setState(addr.state);
          setZipCode(addr.zipCode);
        }

        // Cache the building template so "Add building" can pre-fill instantly.
        setBuildingTemplate(enriched?.building ?? null);

        await updateLocation(location.uuid, {
          addressLine1: addr?.addressLine1 ?? picked.addressLine1,
          city: addr?.city ?? picked.city,
          state: addr?.state ?? picked.state,
          zipCode: addr?.zipCode ?? picked.zipCode,
          county: addr?.county ?? picked.county,
          latitude: addr?.latitude ?? picked.latitude,
          longitude: addr?.longitude ?? picked.longitude,
          // Persist the property id so we can enrich more buildings after a reload.
          reapiPropertyId: enriched?.propertyId ?? picked.propertyId ?? "",
          ...(enriched?.location ?? {}),
        });

        // Pre-fill a building from the property record, but only when the user
        // hasn't started any of their own — never clobber manual edits.
        if (enriched?.building && location.buildings.length === 0) {
          await createBuilding(location.uuid, enriched.building);
          toast.success("Address found — property & building details filled");
        } else if (enriched) {
          toast.success("Address found — property details filled");
        } else {
          toast.success("Address filled");
        }
      } catch {
        toast.error("Couldn't save the picked address.");
      } finally {
        setSaving(false);
      }
    });
  }

  function applyPickedMortgagee(m: MortgageeSuggestion) {
    // Reflect the pick immediately, then persist the chosen mortgagee clause.
    setMortgageeName(m.name);
    setMortgagee(m);
    setSaving(true);
    startTransition(async () => {
      try {
        await updateLocation(location.uuid, { mortgageeName: m.name });
      } catch {
        toast.error("Couldn't save the mortgagee.");
      } finally {
        setSaving(false);
      }
    });
  }

  function onAddBuilding() {
    startTransition(async () => {
      // Prefer the in-session template (free); otherwise re-derive from the
      // property id we persisted on the location (survives a page reload).
      let template = buildingTemplate;
      if (!template && location.reapiPropertyId) {
        try {
          template = await enrichBuildingFromLocation(location.uuid);
          if (template) setBuildingTemplate(template);
        } catch {
          // Enrichment is best-effort — fall back to a blank building.
        }
      }
      await createBuilding(location.uuid, template ?? undefined);
      toast.success(
        template ? "Building added — details pre-filled" : "Building added",
      );
    });
  }

  function onDelete() {
    if (
      !confirm(
        `Remove property ${location.locationNumber}? This deletes its buildings too.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteLocation(location.uuid);
      toast.success("Property removed");
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/40 flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin data-icon="inline-start" className="text-primary" />
          Property {location.locationNumber}
          {saving && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Saving…
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Remove property"
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`l-${location.id}-ni`}>
              Named insured
            </FieldLabel>
            <Input
              id={`l-${location.id}-ni`}
              value={namedInsured}
              onChange={(e) => setNamedInsured(e.target.value)}
              onBlur={save}
              placeholder="Legal entity insured at this property"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`l-${location.id}-a1`}>
              Street address
            </FieldLabel>
            <AddressLookup
              id={`l-${location.id}-a1`}
              value={addressLine1}
              onChange={setAddressLine1}
              onCommit={save}
              onPick={applyPickedAddress}
              placeholder="123 Main St"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`l-${location.id}-a2`}>
              Suite / unit (optional)
            </FieldLabel>
            <Input
              id={`l-${location.id}-a2`}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              onBlur={save}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-6">
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor={`l-${location.id}-city`}>City</FieldLabel>
              <Input
                id={`l-${location.id}-city`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={save}
              />
            </Field>
            <Field className="sm:col-span-1">
              <FieldLabel htmlFor={`l-${location.id}-state`}>State</FieldLabel>
              <Input
                id={`l-${location.id}-state`}
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                onBlur={save}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor={`l-${location.id}-zip`}>Zip</FieldLabel>
              <Input
                id={`l-${location.id}-zip`}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onBlur={save}
              />
            </Field>
          </div>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor={`l-${location.id}-mortgagee`}>
                Mortgagee (optional)
              </FieldLabel>
              {mortgagee && (
                <button
                  type="button"
                  onClick={() => setMortgageeDetailsOpen((o) => !o)}
                  aria-expanded={mortgageeDetailsOpen}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium"
                >
                  <ChevronRight
                    className={`size-3.5 transition-transform ${mortgageeDetailsOpen ? "rotate-90" : ""}`}
                  />
                  {mortgageeDetailsOpen ? "Hide mortgagee details" : "Mortgagee details"}
                </button>
              )}
            </div>
            <MortgageeLookup
              id={`l-${location.id}-mortgagee`}
              value={mortgageeName}
              onChange={(v) => {
                setMortgageeName(v);
                // Drop the detail panel once they edit away from the pick.
                if (mortgagee && v !== mortgagee.name) setMortgagee(null);
              }}
              onCommit={save}
              onPick={applyPickedMortgagee}
              placeholder="Search for the mortgagee on this property…"
            />
            {mortgagee && mortgageeDetailsOpen && (
              <MortgageeDetails mortgagee={mortgagee} />
            )}
          </Field>
        </FieldGroup>

        <Separator />

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">
                Buildings on this property
              </h4>
              <p className="text-muted-foreground text-xs">
                {location.buildings.length} added
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddBuilding}
            >
              <Plus data-icon="inline-start" />
              Add building
            </Button>
          </div>
          {location.buildings.length === 0 ? (
            <Empty className="border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>No buildings yet</EmptyTitle>
                <EmptyDescription>
                  Add at least one to describe what&apos;s being insured.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={onAddBuilding}>
                  <Plus data-icon="inline-start" />
                  Add building
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-3">
              {location.buildings.map((b) => (
                <BuildingCard key={b.id} building={b} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MortgageeDetails({ mortgagee }: { mortgagee: MortgageeSuggestion }) {
  const rows: Array<{ label: string; value: string; href?: string }> = [
    { label: "Lender Name", value: mortgagee.lenderName },
    { label: "Mortgagee Clause", value: mortgagee.clause },
    { label: "ISAOA/ATIMA Language", value: mortgagee.isaoaAtima },
    { label: "Insurance Mailing Address", value: mortgagee.mailingAddress },
    { label: "Phone", value: mortgagee.phone },
    { label: "Fax", value: mortgagee.fax },
    {
      label: "Email",
      value: mortgagee.email,
      href: mortgagee.email ? `mailto:${mortgagee.email}` : undefined,
    },
    { label: "Contact Name", value: mortgagee.contactName },
    { label: "Last Verified Date", value: mortgagee.lastVerified },
  ];

  return (
    <dl className="bg-muted/40 mt-2 space-y-2 rounded-lg border p-4 text-sm">
      {rows.map(({ label, value, href }) => (
        <div
          key={label}
          className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4"
        >
          <dt className="text-muted-foreground font-medium">{label}</dt>
          <dd className="text-foreground break-words">
            {value ? (
              href ? (
                <a href={href} className="text-primary hover:underline">
                  {value}
                </a>
              ) : (
                value
              )
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Building2, ChevronRight, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddressLookup } from "@/components/submission/address-lookup";
import {
  BuildingEditCard,
  type BuildingEditValue,
} from "@/components/submission/building-edit-card";
import { MortgageeLookup } from "@/components/submission/mortgagee-lookup";
import {
  enrichAddress,
  enrichBuildingFromLocation,
  type AddressSuggestion,
  type EnrichedBuilding,
} from "@/lib/actions/addresses";
import type { MortgageeSuggestion } from "@/lib/actions/mortgagees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { createBuilding } from "@/lib/actions/buildings";
import {
  deleteSubmissionLocation,
  updateLocation,
} from "@/lib/actions/locations";
import { formatAddress } from "@insureinvestorsv2/lib";

export type LocationEditValue = {
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
  buildings: BuildingEditValue[];
};

export function LocationEditCard({
  location,
}: {
  location: LocationEditValue;
}) {
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

  function onAddBuilding(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      try {
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
      } catch {
        toast.error("Couldn't add building.");
      }
    });
  }

  function onDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !confirm(
        `Remove property ${location.locationNumber}? This deletes its buildings too.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteSubmissionLocation(location.uuid);
        toast.success("Property removed");
      } catch {
        toast.error("Couldn't delete property.");
      }
    });
  }

  const addressSummary = formatAddress(location) || "No address yet";
  const id = (suffix: string) => `l-${location.id}-${suffix}`;

  return (
    <AccordionPrimitive.Item
      value={`l-${location.id}`}
      className="bg-card overflow-hidden rounded-lg border"
    >
      <AccordionPrimitive.Header className="bg-muted/40 flex items-center border-b">
        <AccordionPrimitive.Trigger className="group flex flex-1 items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-aria-expanded:rotate-90" />
          <MapPin className="text-primary size-4 shrink-0" />
          <span className="text-sm font-semibold">
            Property {location.locationNumber}
          </span>
          <span className="text-muted-foreground truncate text-sm">
            · {addressSummary}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {location.buildings.length} building
              {location.buildings.length === 1 ? "" : "s"}
            </Badge>
            {saving && (
              <span className="text-muted-foreground text-[10px]">Saving…</span>
            )}
          </div>
        </AccordionPrimitive.Trigger>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Remove property"
          className="text-muted-foreground hover:text-destructive mr-2"
        >
          <Trash2 />
        </Button>
      </AccordionPrimitive.Header>

      <AccordionPrimitive.Panel className="overflow-hidden text-sm data-starting-style:animate-accordion-down data-ending-style:animate-accordion-up">
        <div className="h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0">
          {/* Address fields */}
          <div className="space-y-3 px-4 py-4">
            <div>
              <Label htmlFor={id("ni")}>Named insured</Label>
              <Input
                id={id("ni")}
                value={namedInsured}
                onChange={(e) => setNamedInsured(e.target.value)}
                onBlur={save}
                placeholder="Legal entity insured at this property"
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor={id("a1")}>Street address</Label>
              <AddressLookup
                id={id("a1")}
                value={addressLine1}
                onChange={setAddressLine1}
                onCommit={save}
                onPick={applyPickedAddress}
                placeholder="123 Main St"
              />
            </div>
            <div>
              <Label htmlFor={id("a2")}>Suite / unit (optional)</Label>
              <Input
                id={id("a2")}
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                onBlur={save}
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-3">
                <Label htmlFor={id("city")}>City</Label>
                <Input
                  id={id("city")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={save}
                  className="h-9"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor={id("state")}>State</Label>
                <Input
                  id={id("state")}
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  onBlur={save}
                  className="h-9"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor={id("zip")}>Zip</Label>
                <Input
                  id={id("zip")}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onBlur={save}
                  className="h-9"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={id("mortgagee")}>Mortgagee</Label>
                {mortgagee && (
                  <button
                    type="button"
                    onClick={() => setMortgageeDetailsOpen((o) => !o)}
                    aria-expanded={mortgageeDetailsOpen}
                    className="text-muted-foreground hover:text-foreground mb-1 flex items-center gap-1 text-[11px] font-medium"
                  >
                    <ChevronRight
                      className={`size-3 transition-transform ${mortgageeDetailsOpen ? "rotate-90" : ""}`}
                    />
                    {mortgageeDetailsOpen
                      ? "Hide mortgagee details"
                      : "Mortgagee details"}
                  </button>
                )}
              </div>
              <MortgageeLookup
                id={id("mortgagee")}
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
            </div>
          </div>

          {/* Buildings table */}
          <div className="border-t">
            <div className="bg-muted/20 flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground size-3.5" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wide">
                  Buildings ({location.buildings.length})
                </h4>
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
              <div className="p-4">
                <Empty className="border-dashed">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Building2 />
                    </EmptyMedia>
                    <EmptyTitle>No buildings yet</EmptyTitle>
                    <EmptyDescription>
                      Add at least one building on this property.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="outline" size="sm" onClick={onAddBuilding}>
                      <Plus data-icon="inline-start" />
                      Add building
                    </Button>
                  </EmptyContent>
                </Empty>
              </div>
            ) : (
              <AccordionPrimitive.Root>
                {location.buildings.map((b) => (
                  <BuildingEditCard key={b.id} building={b} />
                ))}
              </AccordionPrimitive.Root>
            )}
          </div>
        </div>
      </AccordionPrimitive.Panel>
    </AccordionPrimitive.Item>
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
    <dl className="bg-muted/40 mt-2 space-y-2 rounded-lg border p-3 text-sm">
      {rows.map(({ label, value, href }) => (
        <div
          key={label}
          className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4"
        >
          <dt className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            {label}
          </dt>
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

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-muted-foreground mb-1 block text-[11px] font-medium"
    >
      {children}
    </label>
  );
}

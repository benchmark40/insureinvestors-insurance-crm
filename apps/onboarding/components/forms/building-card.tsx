"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { deleteBuilding, updateBuilding } from "@/lib/actions/buildings";
import { OptionSelect } from "@/components/forms/option-select";
import {
  ALARM_OPTIONS,
  CONDITION_OPTIONS,
  CONSTRUCTION_TYPE_OPTIONS,
  ELECTRICAL_OPTIONS,
  EXTERIOR_OPTIONS,
  HVAC_OPTIONS,
  PLUMBING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  ROOF_COVERING_OPTIONS,
  ROOF_TYPE_OPTIONS,
  TENANT_TYPE_OPTIONS,
} from "@insureinvestorsv2/lib/src/building-options";

/**
 * Parse a percentage input to a number clamped to 0–100, or null when blank.
 * The schema rejects values outside 0–100, so clamping here keeps an over-typed
 * value (e.g. "150") from failing the save and getting stuck.
 */
function toPct(s: string): number | null {
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return Math.min(100, Math.max(0, n));
}

type Building = {
  id: number;
  buildingNumber: number;
  name: string;
  // size & age
  yearBuilt: number | null;
  yearRenovated: number | null;
  totalSqft: number | null;
  numStories: number | null;
  numUnits: number | null;
  // use
  propertyType: string;
  propertyUsage: string;
  tenantType: string;
  occupancyPercent: string | null;
  // construction & roof
  constructionType: string;
  roofType: string;
  roofCoveringType: string;
  roofCoveringYear: number | null;
  // systems
  electricalType: string;
  electricalYear: number | null;
  plumbingType: string;
  plumbingYear: number | null;
  hvacType: string;
  hvacYear: number | null;
  // protection
  sprinklered: boolean;
  sprinklerCoveragePct: string | null;
  burglarAlarmType: string;
  fireAlarmType: string;
  fireProtection: string;
  // condition
  propertyCondition: string;
  buildingExterior: string;
  pool: boolean;
  walkwaysDriveways: string;
  // valuation
  insurableValue: string | null;
  replacementCost: string | null;
  replacementPerSqft: string | null;
  suggestedRent: string | null;
};

export function BuildingCard({ building }: { building: Building }) {
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  // size & age
  const [name, setName] = useState(building.name);
  const [yearBuilt, setYearBuilt] = useState(
    building.yearBuilt?.toString() ?? "",
  );
  const [yearRenovated, setYearRenovated] = useState(
    building.yearRenovated?.toString() ?? "",
  );
  const [totalSqft, setTotalSqft] = useState(
    building.totalSqft?.toString() ?? "",
  );
  const [numStories, setNumStories] = useState(
    building.numStories?.toString() ?? "",
  );
  const [numUnits, setNumUnits] = useState(
    building.numUnits?.toString() ?? "",
  );

  // use
  const [propertyType, setPropertyType] = useState(building.propertyType);
  const [propertyUsage, setPropertyUsage] = useState(building.propertyUsage);
  const [tenantType, setTenantType] = useState(building.tenantType);
  const [occupancyPercent, setOccupancyPercent] = useState(
    building.occupancyPercent ?? "",
  );

  // construction & roof
  const [constructionType, setConstructionType] = useState(
    building.constructionType,
  );
  const [roofType, setRoofType] = useState(building.roofType);
  const [roofCoveringType, setRoofCoveringType] = useState(
    building.roofCoveringType,
  );
  const [roofCoveringYear, setRoofCoveringYear] = useState(
    building.roofCoveringYear?.toString() ?? "",
  );

  // systems
  const [electricalType, setElectricalType] = useState(building.electricalType);
  const [electricalYear, setElectricalYear] = useState(
    building.electricalYear?.toString() ?? "",
  );
  const [plumbingType, setPlumbingType] = useState(building.plumbingType);
  const [plumbingYear, setPlumbingYear] = useState(
    building.plumbingYear?.toString() ?? "",
  );
  const [hvacType, setHvacType] = useState(building.hvacType);
  const [hvacYear, setHvacYear] = useState(
    building.hvacYear?.toString() ?? "",
  );

  // protection
  const [sprinklered, setSprinklered] = useState(building.sprinklered);
  const [sprinklerCoveragePct, setSprinklerCoveragePct] = useState(
    building.sprinklerCoveragePct ?? "",
  );
  const [burglarAlarmType, setBurglarAlarmType] = useState(
    building.burglarAlarmType,
  );
  const [fireAlarmType, setFireAlarmType] = useState(building.fireAlarmType);
  const [fireProtection, setFireProtection] = useState(building.fireProtection);

  // condition
  const [propertyCondition, setPropertyCondition] = useState(
    building.propertyCondition,
  );
  const [buildingExterior, setBuildingExterior] = useState(
    building.buildingExterior,
  );
  const [pool, setPool] = useState(building.pool);
  const [walkwaysDriveways, setWalkwaysDriveways] = useState(
    building.walkwaysDriveways,
  );

  // valuation
  const [insurableValue, setInsurableValue] = useState(
    building.insurableValue ?? "",
  );
  const [replacementCost, setReplacementCost] = useState(
    building.replacementCost ?? "",
  );
  const [replacementPerSqft, setReplacementPerSqft] = useState(
    building.replacementPerSqft ?? "",
  );
  const [suggestedRent, setSuggestedRent] = useState(
    building.suggestedRent ?? "",
  );

  type Patch = Parameters<typeof updateBuilding>[1];

  // Build the full patch from current state. `overrides` win, so a dropdown or
  // switch can persist its new value immediately without waiting for the state
  // update to flush (avoids saving a stale value).
  function buildPatch(overrides: Partial<Patch> = {}): Patch {
    return {
      name,
      yearBuilt: yearBuilt ? Number(yearBuilt) : null,
      yearRenovated: yearRenovated ? Number(yearRenovated) : null,
      totalSqft: totalSqft ? Number(totalSqft) : null,
      numStories: numStories ? Number(numStories) : null,
      numUnits: numUnits ? Number(numUnits) : null,
      propertyType,
      propertyUsage,
      tenantType,
      occupancyPercent: toPct(occupancyPercent),
      constructionType,
      roofType,
      roofCoveringType,
      roofCoveringYear: roofCoveringYear ? Number(roofCoveringYear) : null,
      electricalType,
      electricalYear: electricalYear ? Number(electricalYear) : null,
      plumbingType,
      plumbingYear: plumbingYear ? Number(plumbingYear) : null,
      hvacType,
      hvacYear: hvacYear ? Number(hvacYear) : null,
      sprinklered,
      sprinklerCoveragePct: toPct(sprinklerCoveragePct),
      burglarAlarmType,
      fireAlarmType,
      fireProtection,
      propertyCondition,
      buildingExterior,
      pool,
      walkwaysDriveways,
      insurableValue: insurableValue ? Number(insurableValue) : null,
      replacementCost: replacementCost ? Number(replacementCost) : null,
      replacementPerSqft: replacementPerSqft
        ? Number(replacementPerSqft)
        : null,
      suggestedRent: suggestedRent ? Number(suggestedRent) : null,
      ...overrides,
    };
  }

  function commit(overrides: Partial<Patch> = {}) {
    setSaving(true);
    startTransition(async () => {
      try {
        await updateBuilding(building.id, buildPatch(overrides));
      } catch {
        toast.error("Couldn't save building.");
      } finally {
        setSaving(false);
      }
    });
  }

  function save() {
    commit();
  }

  // Clamp a percent input to 0–100 in the UI on blur, then save. buildPatch
  // already clamps what it sends; this just keeps the displayed value honest.
  function savePct(value: string, setter: (v: string) => void) {
    const clamped = toPct(value);
    const next = clamped === null ? "" : String(clamped);
    if (next !== value) setter(next);
    commit();
  }

  // Set local state and persist the new value in one go (for dropdowns/switches).
  function pick<T>(setter: (v: T) => void, field: keyof Patch, value: T) {
    setter(value);
    commit({ [field]: value } as Partial<Patch>);
  }

  function onDelete() {
    if (!confirm(`Remove building ${building.buildingNumber}?`)) return;
    startTransition(async () => {
      await deleteBuilding(building.id);
      toast.success("Building removed");
    });
  }

  const id = (suffix: string) => `b-${building.id}-${suffix}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Badge variant="outline">Building {building.buildingNumber}</Badge>
          {saving && (
            <span className="text-muted-foreground text-xs">Saving…</span>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Remove building"
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={id("name")}>
              Building name (optional)
            </FieldLabel>
            <Input
              id={id("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={save}
              placeholder="Main building, Warehouse A, etc."
            />
          </Field>

          <Tabs defaultValue="use">
            <TabsList className="flex-wrap">
              <TabsTrigger value="use">Use</TabsTrigger>
              <TabsTrigger value="size">Size & age</TabsTrigger>
              <TabsTrigger value="construction">Construction & roof</TabsTrigger>
              <TabsTrigger value="systems">Systems</TabsTrigger>
              <TabsTrigger value="protection">Protection</TabsTrigger>
              <TabsTrigger value="condition">Condition</TabsTrigger>
              <TabsTrigger value="valuation">Valuation</TabsTrigger>
            </TabsList>

            <TabsContent value="use" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={id("ptype")}>Property type</FieldLabel>
                  <OptionSelect
                    id={id("ptype")}
                    value={propertyType}
                    options={PROPERTY_TYPE_OPTIONS}
                    placeholder="Select property type"
                    onValueChange={(v) =>
                      pick(setPropertyType, "propertyType", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("pusage")}>Property usage</FieldLabel>
                  <OptionSelect
                    id={id("pusage")}
                    value={propertyUsage}
                    options={PROPERTY_USE_OPTIONS}
                    placeholder="Select property use"
                    onValueChange={(v) =>
                      pick(setPropertyUsage, "propertyUsage", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("ttype")}>Tenant type</FieldLabel>
                  <OptionSelect
                    id={id("ttype")}
                    value={tenantType}
                    options={TENANT_TYPE_OPTIONS}
                    placeholder="Select tenant type"
                    onValueChange={(v) => pick(setTenantType, "tenantType", v)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("occ")}>Occupancy %</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={id("occ")}
                      type="number"
                      min={0}
                      max={100}
                      value={occupancyPercent}
                      onChange={(e) => setOccupancyPercent(e.target.value)}
                      onBlur={() =>
                        savePct(occupancyPercent, setOccupancyPercent)
                      }
                    />
                    <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  </InputGroup>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="size" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor={id("year")}>Year built</FieldLabel>
                  <Input
                    id={id("year")}
                    type="number"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    onBlur={save}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("renov")}>Year renovated</FieldLabel>
                  <Input
                    id={id("renov")}
                    type="number"
                    value={yearRenovated}
                    onChange={(e) => setYearRenovated(e.target.value)}
                    onBlur={save}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("sqft")}>Total sqft</FieldLabel>
                  <Input
                    id={id("sqft")}
                    type="number"
                    value={totalSqft}
                    onChange={(e) => setTotalSqft(e.target.value)}
                    onBlur={save}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("stories")}>Stories</FieldLabel>
                  <Input
                    id={id("stories")}
                    type="number"
                    value={numStories}
                    onChange={(e) => setNumStories(e.target.value)}
                    onBlur={save}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("units")}>Units</FieldLabel>
                  <Input
                    id={id("units")}
                    type="number"
                    value={numUnits}
                    onChange={(e) => setNumUnits(e.target.value)}
                    onBlur={save}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="construction" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={id("construction")}>
                    Construction type
                  </FieldLabel>
                  <OptionSelect
                    id={id("construction")}
                    value={constructionType}
                    options={CONSTRUCTION_TYPE_OPTIONS}
                    placeholder="Select construction type"
                    onValueChange={(v) =>
                      pick(setConstructionType, "constructionType", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("roof")}>Roof type</FieldLabel>
                  <OptionSelect
                    id={id("roof")}
                    value={roofType}
                    options={ROOF_TYPE_OPTIONS}
                    placeholder="Select roof type"
                    onValueChange={(v) => pick(setRoofType, "roofType", v)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("roofcov")}>Roof covering</FieldLabel>
                  <OptionSelect
                    id={id("roofcov")}
                    value={roofCoveringType}
                    options={ROOF_COVERING_OPTIONS}
                    placeholder="Select roof covering"
                    onValueChange={(v) =>
                      pick(setRoofCoveringType, "roofCoveringType", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("roofcovyr")}>
                    Roof covering year
                  </FieldLabel>
                  <Input
                    id={id("roofcovyr")}
                    type="number"
                    value={roofCoveringYear}
                    onChange={(e) => setRoofCoveringYear(e.target.value)}
                    onBlur={save}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="systems" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor={id("elec")}>Electrical</FieldLabel>
                  <OptionSelect
                    id={id("elec")}
                    value={electricalType}
                    options={ELECTRICAL_OPTIONS}
                    placeholder="Select electrical"
                    onValueChange={(v) =>
                      pick(setElectricalType, "electricalType", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("plumb")}>Plumbing</FieldLabel>
                  <OptionSelect
                    id={id("plumb")}
                    value={plumbingType}
                    options={PLUMBING_OPTIONS}
                    placeholder="Select plumbing"
                    onValueChange={(v) =>
                      pick(setPlumbingType, "plumbingType", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("hvac")}>HVAC</FieldLabel>
                  <OptionSelect
                    id={id("hvac")}
                    value={hvacType}
                    options={HVAC_OPTIONS}
                    placeholder="Select HVAC"
                    onValueChange={(v) => pick(setHvacType, "hvacType", v)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("elecyr")}>Electrical year</FieldLabel>
                  <Input
                    id={id("elecyr")}
                    type="number"
                    value={electricalYear}
                    onChange={(e) => setElectricalYear(e.target.value)}
                    onBlur={save}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("plumbyr")}>Plumbing year</FieldLabel>
                  <Input
                    id={id("plumbyr")}
                    type="number"
                    value={plumbingYear}
                    onChange={(e) => setPlumbingYear(e.target.value)}
                    onBlur={save}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("hvacyr")}>HVAC year</FieldLabel>
                  <Input
                    id={id("hvacyr")}
                    type="number"
                    value={hvacYear}
                    onChange={(e) => setHvacYear(e.target.value)}
                    onBlur={save}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="protection" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field orientation="horizontal" className="self-end pb-2">
                  <Switch
                    id={id("sprinkler")}
                    checked={sprinklered}
                    onCheckedChange={(v) =>
                      pick(setSprinklered, "sprinklered", v === true)
                    }
                  />
                  <Label htmlFor={id("sprinkler")}>
                    Building is fully sprinklered
                  </Label>
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("sprinklerpct")}>
                    Sprinkler coverage %
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={id("sprinklerpct")}
                      type="number"
                      min={0}
                      max={100}
                      value={sprinklerCoveragePct}
                      onChange={(e) => setSprinklerCoveragePct(e.target.value)}
                      onBlur={() =>
                        savePct(sprinklerCoveragePct, setSprinklerCoveragePct)
                      }
                    />
                    <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("burglar")}>
                    Burglar alarm type
                  </FieldLabel>
                  <OptionSelect
                    id={id("burglar")}
                    value={burglarAlarmType}
                    options={ALARM_OPTIONS}
                    placeholder="Select alarm type"
                    onValueChange={(v) =>
                      pick(setBurglarAlarmType, "burglarAlarmType", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("firealarm")}>
                    Fire alarm type
                  </FieldLabel>
                  <OptionSelect
                    id={id("firealarm")}
                    value={fireAlarmType}
                    options={ALARM_OPTIONS}
                    placeholder="Select alarm type"
                    onValueChange={(v) =>
                      pick(setFireAlarmType, "fireAlarmType", v)
                    }
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor={id("fireprot")}>
                    Fire protection notes
                  </FieldLabel>
                  <Input
                    id={id("fireprot")}
                    value={fireProtection}
                    onChange={(e) => setFireProtection(e.target.value)}
                    onBlur={save}
                    placeholder="Standpipes, extinguishers, hydrant proximity…"
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="condition" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={id("cond")}>Property condition</FieldLabel>
                  <OptionSelect
                    id={id("cond")}
                    value={propertyCondition}
                    options={CONDITION_OPTIONS}
                    placeholder="Select condition"
                    onValueChange={(v) =>
                      pick(setPropertyCondition, "propertyCondition", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("ext")}>Building exterior</FieldLabel>
                  <OptionSelect
                    id={id("ext")}
                    value={buildingExterior}
                    options={EXTERIOR_OPTIONS}
                    placeholder="Select exterior"
                    onValueChange={(v) =>
                      pick(setBuildingExterior, "buildingExterior", v)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("walk")}>
                    Walkways & driveways
                  </FieldLabel>
                  <Input
                    id={id("walk")}
                    value={walkwaysDriveways}
                    onChange={(e) => setWalkwaysDriveways(e.target.value)}
                    onBlur={save}
                    placeholder="Concrete, asphalt, condition…"
                  />
                </Field>
                <Field orientation="horizontal" className="self-end pb-2">
                  <Switch
                    id={id("pool")}
                    checked={pool}
                    onCheckedChange={(v) => pick(setPool, "pool", v === true)}
                  />
                  <Label htmlFor={id("pool")}>Pool on site</Label>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="valuation" className="pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={id("iv")}>Insurable value</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id={id("iv")}
                      type="number"
                      value={insurableValue}
                      onChange={(e) => setInsurableValue(e.target.value)}
                      onBlur={save}
                      placeholder="0"
                    />
                    <InputGroupAddon align="inline-end">USD</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("rcost")}>Replacement cost</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id={id("rcost")}
                      type="number"
                      value={replacementCost}
                      onChange={(e) => setReplacementCost(e.target.value)}
                      onBlur={save}
                      placeholder="0"
                    />
                    <InputGroupAddon align="inline-end">USD</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("rpsqft")}>
                    Replacement / sqft
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id={id("rpsqft")}
                      type="number"
                      value={replacementPerSqft}
                      onChange={(e) => setReplacementPerSqft(e.target.value)}
                      onBlur={save}
                    />
                    <InputGroupAddon align="inline-end">/sqft</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor={id("rent")}>
                    Suggested monthly rent
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id={id("rent")}
                      type="number"
                      value={suggestedRent}
                      onChange={(e) => setSuggestedRent(e.target.value)}
                      onBlur={save}
                    />
                    <InputGroupAddon align="inline-end">USD</InputGroupAddon>
                  </InputGroup>
                </Field>
              </div>
            </TabsContent>
          </Tabs>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

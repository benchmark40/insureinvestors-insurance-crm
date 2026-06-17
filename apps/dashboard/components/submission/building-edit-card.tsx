"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@insureinvestorsv2/lib";

export type BuildingEditValue = {
  id: number;
  buildingNumber: number;
  name: string;
  yearBuilt: number | null;
  yearRenovated: number | null;
  totalSqft: number | null;
  numStories: number | null;
  numUnits: number | null;
  propertyType: string;
  propertyUsage: string;
  tenantType: string;
  occupancyPercent: string | null;
  constructionType: string;
  roofType: string;
  roofCoveringType: string;
  roofCoveringYear: number | null;
  electricalType: string;
  electricalYear: number | null;
  plumbingType: string;
  plumbingYear: number | null;
  hvacType: string;
  hvacYear: number | null;
  sprinklered: boolean;
  sprinklerCoveragePct: string | null;
  burglarAlarmType: string;
  fireAlarmType: string;
  fireProtection: string;
  propertyCondition: string;
  buildingExterior: string;
  pool: boolean;
  walkwaysDriveways: string;
  insurableValue: string | null;
  replacementCost: string | null;
  replacementPerSqft: string | null;
  suggestedRent: string | null;
};

function dash(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toString();
  return v;
}

function dashSqft(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString();
}

function dashMoney(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "—";
  return formatCurrency(n);
}

export function BuildingEditCard({
  building,
}: {
  building: BuildingEditValue;
}) {
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

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

  const [propertyType, setPropertyType] = useState(building.propertyType);
  const [propertyUsage, setPropertyUsage] = useState(building.propertyUsage);
  const [tenantType, setTenantType] = useState(building.tenantType);
  const [occupancyPercent, setOccupancyPercent] = useState(
    building.occupancyPercent ?? "",
  );

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

  const [sprinklered, setSprinklered] = useState(building.sprinklered);
  const [sprinklerCoveragePct, setSprinklerCoveragePct] = useState(
    building.sprinklerCoveragePct ?? "",
  );
  const [burglarAlarmType, setBurglarAlarmType] = useState(
    building.burglarAlarmType,
  );
  const [fireAlarmType, setFireAlarmType] = useState(building.fireAlarmType);
  const [fireProtection, setFireProtection] = useState(building.fireProtection);

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

  function save() {
    setSaving(true);
    startTransition(async () => {
      try {
        await updateBuilding(building.id, {
          name,
          yearBuilt: yearBuilt ? Number(yearBuilt) : null,
          yearRenovated: yearRenovated ? Number(yearRenovated) : null,
          totalSqft: totalSqft ? Number(totalSqft) : null,
          numStories: numStories ? Number(numStories) : null,
          numUnits: numUnits ? Number(numUnits) : null,
          propertyType,
          propertyUsage,
          tenantType,
          occupancyPercent: occupancyPercent ? Number(occupancyPercent) : null,
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
          sprinklerCoveragePct: sprinklerCoveragePct
            ? Number(sprinklerCoveragePct)
            : null,
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
        });
      } catch {
        toast.error("Couldn't save building.");
      } finally {
        setSaving(false);
      }
    });
  }

  function onDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove building ${building.buildingNumber}?`)) return;
    startTransition(async () => {
      try {
        await deleteBuilding(building.id);
        toast.success("Building removed");
      } catch {
        toast.error("Couldn't delete building.");
      }
    });
  }

  const id = (suffix: string) => `b-${building.id}-${suffix}`;

  return (
    <AccordionPrimitive.Item
      value={`b-${building.id}`}
      className="border-b last:border-b-0"
    >
      <AccordionPrimitive.Header className="hover:bg-accent/30 flex items-center">
        <AccordionPrimitive.Trigger className="group flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <ChevronRight className="text-muted-foreground size-3.5 shrink-0 transition-transform group-aria-expanded:rotate-90" />
          <div className="grid w-full grid-cols-12 items-center gap-3">
            <span className="text-muted-foreground col-span-1 font-mono text-[11px]">
              B{building.buildingNumber}
            </span>
            <span className="col-span-3 truncate font-medium">
              {dash(building.name) === "—"
                ? `Building ${building.buildingNumber}`
                : building.name}
            </span>
            <Stat label="Use" value={dash(building.propertyUsage)} />
            <Stat label="Sqft" value={dashSqft(building.totalSqft)} />
            <Stat label="Year" value={dash(building.yearBuilt)} />
            <Stat label="Units" value={dash(building.numUnits)} />
            <Stat
              label="Value"
              value={dashMoney(building.insurableValue)}
              emphasize
            />
          </div>
          {saving && (
            <span className="text-muted-foreground shrink-0 text-[10px]">
              Saving…
            </span>
          )}
        </AccordionPrimitive.Trigger>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Remove building"
          className="text-muted-foreground hover:text-destructive mr-1"
        >
          <Trash2 />
        </Button>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Panel className="overflow-hidden text-sm data-starting-style:animate-accordion-down data-ending-style:animate-accordion-up">
        <div className="bg-muted/20 h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0 space-y-4 px-4 py-4">
          <Cell label="Building name" span={4}>
            <CompactInput
              id={id("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={save}
              placeholder="Main building, Warehouse A, etc."
            />
          </Cell>

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

            <TabsContent value="use">
              <SectionGrid>
                <Cell label="Property type">
                  <CompactInput
                    id={id("ptype")}
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    onBlur={save}
                    placeholder="Commercial, residential…"
                  />
                </Cell>
                <Cell label="Property usage">
                  <CompactInput
                    id={id("pusage")}
                    value={propertyUsage}
                    onChange={(e) => setPropertyUsage(e.target.value)}
                    onBlur={save}
                    placeholder="Office, retail, multifamily…"
                  />
                </Cell>
                <Cell label="Tenant type">
                  <CompactInput
                    id={id("ttype")}
                    value={tenantType}
                    onChange={(e) => setTenantType(e.target.value)}
                    onBlur={save}
                    placeholder="Residential, commercial…"
                  />
                </Cell>
                <Cell label="Occupancy %">
                  <PctInput
                    id={id("occ")}
                    value={occupancyPercent}
                    onChange={setOccupancyPercent}
                    onBlur={save}
                  />
                </Cell>
              </SectionGrid>
            </TabsContent>

            <TabsContent value="size">
              <SectionGrid>
                <Cell label="Year built">
                  <CompactInput
                    id={id("year")}
                    type="number"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Year renovated">
                  <CompactInput
                    id={id("renov")}
                    type="number"
                    value={yearRenovated}
                    onChange={(e) => setYearRenovated(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Total sqft">
                  <CompactInput
                    id={id("sqft")}
                    type="number"
                    value={totalSqft}
                    onChange={(e) => setTotalSqft(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Stories">
                  <CompactInput
                    id={id("stories")}
                    type="number"
                    value={numStories}
                    onChange={(e) => setNumStories(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Units">
                  <CompactInput
                    id={id("units")}
                    type="number"
                    value={numUnits}
                    onChange={(e) => setNumUnits(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
              </SectionGrid>
            </TabsContent>

            <TabsContent value="construction">
              <SectionGrid>
                <Cell label="Construction type">
                  <CompactInput
                    id={id("construction")}
                    value={constructionType}
                    onChange={(e) => setConstructionType(e.target.value)}
                    onBlur={save}
                    placeholder="Masonry, frame, JM…"
                  />
                </Cell>
                <Cell label="Roof type">
                  <CompactInput
                    id={id("roof")}
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Roof covering">
                  <CompactInput
                    id={id("roofcov")}
                    value={roofCoveringType}
                    onChange={(e) => setRoofCoveringType(e.target.value)}
                    onBlur={save}
                    placeholder="Asphalt, metal, TPO…"
                  />
                </Cell>
                <Cell label="Roof covering year">
                  <CompactInput
                    id={id("roofcovyr")}
                    type="number"
                    value={roofCoveringYear}
                    onChange={(e) => setRoofCoveringYear(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
              </SectionGrid>
            </TabsContent>

            <TabsContent value="systems">
              <SectionGrid>
                <Cell label="Electrical">
                  <CompactInput
                    id={id("elec")}
                    value={electricalType}
                    onChange={(e) => setElectricalType(e.target.value)}
                    onBlur={save}
                    placeholder="Copper / Romex"
                  />
                </Cell>
                <Cell label="Electrical year">
                  <CompactInput
                    id={id("elecyr")}
                    type="number"
                    value={electricalYear}
                    onChange={(e) => setElectricalYear(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Plumbing">
                  <CompactInput
                    id={id("plumb")}
                    value={plumbingType}
                    onChange={(e) => setPlumbingType(e.target.value)}
                    onBlur={save}
                    placeholder="Copper / PEX"
                  />
                </Cell>
                <Cell label="Plumbing year">
                  <CompactInput
                    id={id("plumbyr")}
                    type="number"
                    value={plumbingYear}
                    onChange={(e) => setPlumbingYear(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="HVAC">
                  <CompactInput
                    id={id("hvac")}
                    value={hvacType}
                    onChange={(e) => setHvacType(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="HVAC year">
                  <CompactInput
                    id={id("hvacyr")}
                    type="number"
                    value={hvacYear}
                    onChange={(e) => setHvacYear(e.target.value)}
                    onBlur={save}
                  />
                </Cell>
              </SectionGrid>
            </TabsContent>

            <TabsContent value="protection">
              <SectionGrid>
                <Cell label="Sprinkler %">
                  <PctInput
                    id={id("sprinklerpct")}
                    value={sprinklerCoveragePct}
                    onChange={setSprinklerCoveragePct}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Burglar alarm type">
                  <CompactInput
                    id={id("burglar")}
                    value={burglarAlarmType}
                    onChange={(e) => setBurglarAlarmType(e.target.value)}
                    onBlur={save}
                    placeholder="Local / Central / None"
                  />
                </Cell>
                <Cell label="Fire alarm type">
                  <CompactInput
                    id={id("firealarm")}
                    value={fireAlarmType}
                    onChange={(e) => setFireAlarmType(e.target.value)}
                    onBlur={save}
                    placeholder="Local / Monitored / None"
                  />
                </Cell>
                <Cell label="Sprinklered" inline>
                  <Switch
                    id={id("sprinkler")}
                    checked={sprinklered}
                    onCheckedChange={(v) => {
                      setSprinklered(v === true);
                      setTimeout(save, 0);
                    }}
                  />
                  <Label
                    htmlFor={id("sprinkler")}
                    className="text-muted-foreground text-xs"
                  >
                    Fully sprinklered
                  </Label>
                </Cell>
                <Cell label="Fire protection notes" span={4}>
                  <CompactInput
                    id={id("fireprot")}
                    value={fireProtection}
                    onChange={(e) => setFireProtection(e.target.value)}
                    onBlur={save}
                    placeholder="Standpipes, extinguishers, hydrant proximity…"
                  />
                </Cell>
              </SectionGrid>
            </TabsContent>

            <TabsContent value="condition">
              <SectionGrid>
                <Cell label="Property condition">
                  <CompactInput
                    id={id("cond")}
                    value={propertyCondition}
                    onChange={(e) => setPropertyCondition(e.target.value)}
                    onBlur={save}
                    placeholder="Excellent / Good / Average…"
                  />
                </Cell>
                <Cell label="Building exterior">
                  <CompactInput
                    id={id("ext")}
                    value={buildingExterior}
                    onChange={(e) => setBuildingExterior(e.target.value)}
                    onBlur={save}
                    placeholder="Brick, stucco, vinyl…"
                  />
                </Cell>
                <Cell label="Walkways & driveways">
                  <CompactInput
                    id={id("walk")}
                    value={walkwaysDriveways}
                    onChange={(e) => setWalkwaysDriveways(e.target.value)}
                    onBlur={save}
                    placeholder="Concrete, asphalt…"
                  />
                </Cell>
                <Cell label="Pool" inline>
                  <Switch
                    id={id("pool")}
                    checked={pool}
                    onCheckedChange={(v) => {
                      setPool(v === true);
                      setTimeout(save, 0);
                    }}
                  />
                  <Label
                    htmlFor={id("pool")}
                    className="text-muted-foreground text-xs"
                  >
                    Pool on site
                  </Label>
                </Cell>
              </SectionGrid>
            </TabsContent>

            <TabsContent value="valuation">
              <SectionGrid>
                <Cell label="Insurable value">
                  <UsdInput
                    id={id("iv")}
                    value={insurableValue}
                    onChange={setInsurableValue}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Replacement cost">
                  <UsdInput
                    id={id("rcost")}
                    value={replacementCost}
                    onChange={setReplacementCost}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Repl / sqft">
                  <UsdInput
                    id={id("rpsqft")}
                    value={replacementPerSqft}
                    onChange={setReplacementPerSqft}
                    onBlur={save}
                  />
                </Cell>
                <Cell label="Suggested rent">
                  <UsdInput
                    id={id("rent")}
                    value={suggestedRent}
                    onChange={setSuggestedRent}
                    onBlur={save}
                  />
                </Cell>
              </SectionGrid>
            </TabsContent>
          </Tabs>
        </div>
      </AccordionPrimitive.Panel>
    </AccordionPrimitive.Item>
  );
}

// -----------------------------------------------------------------------------
// Compact field helpers
// -----------------------------------------------------------------------------

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  const isDash = value === "—";
  return (
    <div className="col-span-1 flex flex-col gap-0.5 truncate">
      <span className="text-muted-foreground text-[9px] font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span
        className={
          isDash
            ? "text-muted-foreground/60 truncate text-xs tabular-nums"
            : emphasize
              ? "text-foreground truncate text-xs font-semibold tabular-nums"
              : "text-foreground truncate text-xs tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function SectionGrid({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card mt-3 rounded-md border p-4">
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function Cell({
  label,
  children,
  span,
  inline,
}: {
  label: string;
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  inline?: boolean;
}) {
  const colSpan =
    span === 4
      ? "sm:col-span-4"
      : span === 3
        ? "sm:col-span-3"
        : span === 2
          ? "sm:col-span-2"
          : "sm:col-span-1";
  return (
    <div className={`flex flex-col gap-1 ${colSpan}`}>
      <span className="text-muted-foreground text-[11px] font-medium">
        {label}
      </span>
      {inline ? (
        <div className="flex items-center gap-2 pt-1">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}

function CompactInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={`h-8 text-sm ${props.className ?? ""}`} />;
}

function PctInput({
  id,
  value,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <InputGroup className="h-8">
      <InputGroupInput
        id={id}
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="h-8 text-sm"
      />
      <InputGroupAddon align="inline-end">%</InputGroupAddon>
    </InputGroup>
  );
}

function UsdInput({
  id,
  value,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <InputGroup className="h-8">
      <InputGroupAddon align="inline-start">$</InputGroupAddon>
      <InputGroupInput
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="0"
        className="h-8 text-sm"
      />
    </InputGroup>
  );
}

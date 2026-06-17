import { OccupancyClass } from "@insureinvestorsv2/db";

export const OCCUPANCY_CLASS_LABELS: Record<OccupancyClass, string> = {
  none: "None",
  adult_day_care: "Adult day care",
  adult_entertainment_club: "Adult entertainment club",
  agriculture: "Agriculture (barns, poultry, etc.)",
  arts_entertainment_recreation:
    "Arts, Entertainment & Recreation (museums, theaters, cinemas, fitness)",
  auto_repair_or_sales:
    "Automobile / boat / RV / truck repair, maintenance, sales",
  aviation_or_aerospace: "Aviation or aerospace",
  bowling_alley: "Bowling alley",
  children_playcenter: "Children's play center",
  church_or_worship: "Church or other house of worship",
  daycare: "Day care",
  detective_or_investigative: "Detective or investigative services",
  distillery_or_liquor: "Distillery or liquor manufacturing / storage",
  mobile_or_manufactured_home: "Mobile home or manufactured home",
  nursing_home: "Nursing home or assisted living facility",
  paint_sales_or_mixing: "Paint sales or mixing on premises",
  rehabilitation_housing: "Rehabilitation housing",
  shelter: "Shelter",
  sorority_or_fraternity: "Sorority or fraternity",
};

export const OCCUPANCY_CLASS_OPTIONS = (
  Object.keys(OCCUPANCY_CLASS_LABELS) as OccupancyClass[]
).map((value) => ({ value, label: OCCUPANCY_CLASS_LABELS[value] }));

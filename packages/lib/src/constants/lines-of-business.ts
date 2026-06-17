export const LINES_OF_BUSINESS = [
  { code: "PROP", label: "Commercial Property" },
  { code: "GL", label: "General Liability" },
  { code: "UMB", label: "Umbrella" },
  { code: "AUTO", label: "Commercial Auto" },
  { code: "WC", label: "Workers' Compensation" },
  { code: "CRIME", label: "Crime" },
] as const;

export type LineOfBusinessCode = (typeof LINES_OF_BUSINESS)[number]["code"];

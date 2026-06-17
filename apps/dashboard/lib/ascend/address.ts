/**
 * Address validation for the Ascend handoff. Ascend's sandbox only accepts US
 * mailing/business addresses — non-US states and zip codes return 422.
 */

const US_STATE_CODES: ReadonlySet<string> = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI", "GU", "AS", "MP",
]);

const FULL_NAME_TO_CODE: ReadonlyMap<string, string> = new Map([
  ["alabama", "AL"], ["alaska", "AK"], ["arizona", "AZ"], ["arkansas", "AR"],
  ["california", "CA"], ["colorado", "CO"], ["connecticut", "CT"],
  ["delaware", "DE"], ["florida", "FL"], ["georgia", "GA"], ["hawaii", "HI"],
  ["idaho", "ID"], ["illinois", "IL"], ["indiana", "IN"], ["iowa", "IA"],
  ["kansas", "KS"], ["kentucky", "KY"], ["louisiana", "LA"], ["maine", "ME"],
  ["maryland", "MD"], ["massachusetts", "MA"], ["michigan", "MI"],
  ["minnesota", "MN"], ["mississippi", "MS"], ["missouri", "MO"],
  ["montana", "MT"], ["nebraska", "NE"], ["nevada", "NV"],
  ["new hampshire", "NH"], ["new jersey", "NJ"], ["new mexico", "NM"],
  ["new york", "NY"], ["north carolina", "NC"], ["north dakota", "ND"],
  ["ohio", "OH"], ["oklahoma", "OK"], ["oregon", "OR"],
  ["pennsylvania", "PA"], ["rhode island", "RI"], ["south carolina", "SC"],
  ["south dakota", "SD"], ["tennessee", "TN"], ["texas", "TX"], ["utah", "UT"],
  ["vermont", "VT"], ["virginia", "VA"], ["washington", "WA"],
  ["west virginia", "WV"], ["wisconsin", "WI"], ["wyoming", "WY"],
  ["district of columbia", "DC"], ["puerto rico", "PR"],
  ["us virgin islands", "VI"], ["u.s. virgin islands", "VI"],
  ["virgin islands", "VI"], ["guam", "GU"], ["american samoa", "AS"],
  ["northern mariana islands", "MP"],
]);

export function normalizeUSState(raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (US_STATE_CODES.has(upper)) return upper;
  const byName = FULL_NAME_TO_CODE.get(trimmed.toLowerCase());
  return byName ?? null;
}

/** US zip = 5 digits or 5+4 (e.g. 90210 or 90210-1234). */
export function isValidUSZip(raw: string): boolean {
  return /^\d{5}(-\d{4})?$/.test((raw ?? "").trim());
}

export type AscendAddressIssue = {
  field: string;
  message: string;
};

/**
 * Validates a customer's mailing address against Ascend's US-only requirements.
 * Returns the issues array (empty if valid) plus the normalized state code.
 */
export function validateAscendAddress(input: {
  state: string;
  zipCode: string;
}): { issues: AscendAddressIssue[]; normalizedState: string | null } {
  const issues: AscendAddressIssue[] = [];
  const normalizedState = normalizeUSState(input.state);
  if (!normalizedState) {
    issues.push({
      field: "state",
      message: `State "${input.state || "(blank)"}" isn't a US state — Ascend only accepts US addresses.`,
    });
  }
  if (!isValidUSZip(input.zipCode)) {
    issues.push({
      field: "zipCode",
      message: `Zip "${input.zipCode || "(blank)"}" isn't a valid US zip (5 digits, optionally +4).`,
    });
  }
  return { issues, normalizedState };
}

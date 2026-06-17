/**
 * Mortgagee reference list + typeahead search.
 *
 * The data (data/mortgage-list.json) was exported from the legacy AMS360
 * mortgagee table. This module is intentionally NOT re-exported from the
 * package barrel (index.ts) so the ~290KB JSON never lands in a client bundle.
 * Import it from a server-only context (a "use server" action or a Server
 * Component) via `@insureinvestorsv2/lib/src/mortgagees`.
 */

import rawList from "./data/mortgage-list.json";

type RawMortgagee = {
  Name: string | null;
  Name2: string | null;
  email: string | null;
  FAX: string | null;
  Telephone: string | null;
  Telephone2: string | null;
  Address: string | null;
  City: string | null;
  State: string | null;
  ZIP: string | null;
  Notes: string | null;
  LastUpdated: string | null;
};

export type MortgageeSuggestion = {
  /** Full payee line (Name + Name2). This is what we store on the location
   *  and match on for re-lookup, so keep it stable. */
  name: string;
  /** Lender Name (Name). */
  lenderName: string;
  /** ISAOA/ATIMA designation extracted from Name2, normalized. "" when absent. */
  isaoaAtima: string;
  /** Paste-ready mortgagee clause: payee + mailing address. */
  clause: string;
  /** Formatted single-line insurance mailing address. */
  mailingAddress: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  /** Telephone (and Telephone2 when present). */
  phone: string;
  fax: string;
  email: string;
  /** Not present in the source data — kept for the UI, always "". */
  contactName: string;
  /** Last verified / updated date, formatted (e.g. "Jan 1, 2020"). */
  lastVerified: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic date format (no locale) so server + client render identically.
function formatVerified(raw: string | null): string {
  const datePart = (raw ?? "").trim().split(/\s+/)[0] ?? "";
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(datePart);
  if (!m) return (raw ?? "").trim();
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  return month ? `${month} ${Number(d)}, ${y}` : datePart;
}

// Pull the ISAOA / ATIMA language out of Name2, normalized to "ISAOA/ATIMA".
function extractIsaoa(name2: string): string {
  const m = /isaoa(\s*[/&]\s*atima)?/i.exec(name2);
  if (!m) return "";
  return m[1] ? "ISAOA/ATIMA" : "ISAOA";
}

function join(parts: Array<string | null | undefined>, sep: string): string {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join(sep);
}

function normalize(m: RawMortgagee): MortgageeSuggestion {
  const lenderName = (m.Name ?? "").trim();
  const name2 = (m.Name2 ?? "").trim();
  const address = (m.Address ?? "").trim();
  const city = (m.City ?? "").trim();
  const state = (m.State ?? "").trim().slice(0, 2).toUpperCase();
  const zipCode = (m.ZIP ?? "").trim();

  const cityLine = join([city, join([state, zipCode], " ")], ", ");
  const mailingAddress = join([address, cityLine], ", ");
  const payee = join([lenderName, name2], " ");

  return {
    name: payee,
    lenderName,
    isaoaAtima: extractIsaoa(name2),
    clause: join([payee, mailingAddress], ", "),
    mailingAddress,
    address,
    city,
    state,
    zipCode,
    phone: join([m.Telephone, m.Telephone2], " / "),
    fax: (m.FAX ?? "").trim(),
    email: (m.email ?? "").trim(),
    contactName: "",
    lastVerified: formatVerified(m.LastUpdated),
  };
}

// Normalize once at module load — trims noise and drops nameless rows.
const MORTGAGEES: MortgageeSuggestion[] = (rawList as RawMortgagee[])
  .map(normalize)
  .filter((m) => m.name.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

/** Case-insensitive search over name + city. Returns up to 20 matches. */
export function searchMortgagees(query: string): MortgageeSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const matches = MORTGAGEES.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.city.toLowerCase().includes(q),
  );

  // Surface prefix matches first — they're almost always what the user means.
  matches.sort((a, b) => {
    const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return ap - bp || a.name.localeCompare(b.name);
  });

  return matches.slice(0, 20);
}

/** Re-derive the full mortgagee record from a stored name. Null when no match
 *  (e.g. a free-form name the user typed that isn't in the reference list). */
export function getMortgageeByName(
  name: string | null | undefined,
): MortgageeSuggestion | null {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return null;
  return MORTGAGEES.find((m) => m.name.toLowerCase() === key) ?? null;
}

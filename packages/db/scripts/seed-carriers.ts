/**
 * Seeds Carrier + CarrierPersonnel from the legacy `program data.json` export
 * (`parent_companies` array). This is the canonical source — it has personnel
 * and writing_companies, unlike the address-only all_*.json files.
 *
 * Mapping:
 *   parent.short_name === "Insurance"  -> kind = carrier
 *   parent.short_name === "Brokerage"  -> kind = wholesaler
 *   other short_names                  -> skipped (Finance, TC, etc.)
 *
 * Each parent's writing_companies are seeded as child Carrier rows linked via
 * parentCompanyId. Personnel are attached to the parent. Identifier is the
 * legacy Django PK (parent_company.id / writing_company.id) as a string —
 * (kind, identifier) is the unique key so re-runs are idempotent.
 *
 * Run with:  bun --filter @insureinvestorsv2/db run db:seed
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { db } from "../src/index";
import type { CompanyKind } from "@prisma/client";

type LegacyPersonnel = {
  id: number;
  name: string;
  email: string;
  position?: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  business_phone?: string;
};

type LegacyWritingCompany = {
  id: number;
  name: string;
  short_name?: string;
  naic?: string;
  status?: string;
};

type LegacyParent = {
  id: number;
  name: string;
  short_name: string;
  identifier: string | null;
  naic?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  personnel: LegacyPersonnel[] | null;
  writing_companies: LegacyWritingCompany[] | null;
};

const LEGACY_ROOT = resolve(__dirname, "../../../..");
const PROGRAM_DATA_PATH = resolve(LEGACY_ROOT, "program data.json");

function loadParentCompanies(): LegacyParent[] {
  const raw = readFileSync(PROGRAM_DATA_PATH, "utf8");
  // The file has a literal "program data: \n\n" prefix before the JSON.
  const json = raw.slice(raw.indexOf("{"));
  const parsed = JSON.parse(json) as { parent_companies: LegacyParent[] };
  return parsed.parent_companies ?? [];
}

function kindFor(parent: LegacyParent): CompanyKind | null {
  if (parent.short_name === "Insurance") return "carrier";
  if (parent.short_name === "Brokerage") return "wholesaler";
  return null;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const trimmed = full.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function main() {
  const parents = loadParentCompanies();

  // Wipe existing Carrier rows so re-runs from older seeds don't leave junk.
  // CarrierPersonnel cascades. Writing-company self-links cascade via SetNull.
  const wiped = await db.carrier.deleteMany({});
  console.log(`Wiped ${wiped.count} existing Carrier rows.`);

  let parentCount = 0;
  let writingCount = 0;
  let personnelCount = 0;
  let skipped = 0;

  for (const parent of parents) {
    const kind = kindFor(parent);
    if (!kind) {
      skipped++;
      continue;
    }

    const parentRow = await db.carrier.create({
      data: {
        kind,
        identifier: String(parent.id),
        name: parent.name,
        naic: parent.naic ?? "",
        addressStreet1: parent.description ?? "",
        addressCity: parent.address ?? "",
        addressState: parent.city ?? "",
        addressZip: parent.state ?? "",
        isActive: true,
      },
    });
    parentCount++;

    for (const p of parent.personnel ?? []) {
      if (!p.email) continue;
      const { firstName, lastName } = splitName(p.name ?? "");
      await db.carrierPersonnel.create({
        data: {
          carrierId: parentRow.id,
          firstName,
          lastName,
          email: p.email,
          phone: p.business_phone ?? "",
          title: p.position ?? "",
          isActive: true,
        },
      });
      personnelCount++;
    }

    for (const wc of parent.writing_companies ?? []) {
      await db.carrier.create({
        data: {
          kind,
          identifier: `wc_${wc.id}`,
          name: wc.name,
          naic: wc.naic ?? "",
          parentCompanyId: parentRow.id,
          isActive: (wc.status ?? "") !== "inactive",
        },
      });
      writingCount++;
    }
  }

  console.log(
    `✓ ${parentCount} parent companies, ${writingCount} writing companies, ${personnelCount} personnel`,
  );
  console.log(`  (skipped ${skipped} parents with non-insurance short_name)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

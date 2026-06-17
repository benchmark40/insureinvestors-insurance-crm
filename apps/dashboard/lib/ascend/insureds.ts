/**
 * Sync v2 Customer/SubmissionContact rows into Ascend. Idempotent:
 *  - getOrCreateAscendContact uses the local SubmissionContact.ascendId first,
 *    falls back to POST /contacts, and on conflict searches /contacts?search=
 *  - getOrCreateAscendInsured does the same for Customer.ascendId vs /insureds
 *
 * Returns the Ascend IDs; callers persist them onto our rows.
 */

import { db } from "@insureinvestorsv2/db";

import { ascendFetch, isConflict } from "@/lib/ascend/client";

type AscendContact = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

type AscendInsured = {
  id: string;
  email?: string;
  business_name?: string;
};

type ContactInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

async function searchAscendContact(email: string): Promise<AscendContact | null> {
  try {
    const data = await ascendFetch<
      AscendContact[] | { data?: AscendContact[]; results?: AscendContact[] }
    >("GET", `/contacts?search=${encodeURIComponent(email)}`);
    const list = Array.isArray(data) ? data : (data.data ?? data.results ?? []);
    const lower = email.toLowerCase();
    return (
      list.find((c) => (c.email ?? "").toLowerCase() === lower) ?? list[0] ?? null
    );
  } catch {
    return null;
  }
}

async function searchAscendInsured(email: string): Promise<AscendInsured | null> {
  try {
    const data = await ascendFetch<
      AscendInsured[] | { data?: AscendInsured[]; results?: AscendInsured[] }
    >("GET", `/insureds?search=${encodeURIComponent(email)}`);
    const list = Array.isArray(data) ? data : (data.data ?? data.results ?? []);
    return list[0] ?? null;
  } catch {
    return null;
  }
}

export async function getOrCreateAscendContact(
  contactId: number,
  input: ContactInput,
): Promise<string> {
  const existing = await db.submissionContact.findUnique({
    where: { id: contactId },
    select: { ascendId: true },
  });
  if (existing?.ascendId) return existing.ascendId;

  let ascendId: string;
  try {
    const created = await ascendFetch<AscendContact>("POST", "/contacts", {
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    });
    ascendId = created.id;
  } catch (err) {
    if (!isConflict(err)) throw err;
    const found = await searchAscendContact(input.email);
    if (!found) {
      throw new Error(
        `Contact ${input.email} exists in Ascend but couldn't be found via search`,
      );
    }
    ascendId = found.id;
  }

  await db.submissionContact.update({
    where: { id: contactId },
    data: { ascendId },
  });
  return ascendId;
}

type InsuredInput = {
  isBusiness: boolean;
  businessName?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  primaryContactEmail: string;
  primaryAscendContactId: string;
};

export async function getOrCreateAscendInsured(
  customerId: number,
  input: InsuredInput,
): Promise<string> {
  const existing = await db.customer.findUnique({
    where: { id: customerId },
    select: { ascendId: true },
  });
  if (existing?.ascendId) return existing.ascendId;

  const payload: Record<string, unknown> = {
    is_business: input.isBusiness,
    mailing_address_street_one: input.addressLine1,
    mailing_address_street_two: input.addressLine2,
    mailing_address_city: input.city,
    mailing_address_state: input.state,
    mailing_address_zip_code: input.zipCode,
    insured_contacts: [{ role: "primary", id: input.primaryAscendContactId }],
  };
  if (input.isBusiness && input.businessName) {
    payload.business_name = input.businessName;
  }

  let ascendId: string;
  try {
    const created = await ascendFetch<AscendInsured>(
      "POST",
      "/insureds",
      payload,
    );
    ascendId = created.id;
  } catch (err) {
    if (!isConflict(err)) throw err;
    const found = await searchAscendInsured(input.primaryContactEmail);
    if (!found) {
      throw new Error(
        `Insured for ${input.primaryContactEmail} exists in Ascend but couldn't be found via search`,
      );
    }
    ascendId = found.id;
  }

  await db.customer.update({
    where: { id: customerId },
    data: { ascendId },
  });
  return ascendId;
}

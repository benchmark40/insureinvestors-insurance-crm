"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  CustomerPatchSchema,
  type CustomerPatch,
} from "@insureinvestorsv2/lib";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedCustomer } from "@/lib/scope";

export async function updateCustomer(
  uuid: string,
  patch: CustomerPatch,
): Promise<void> {
  const ctx = await requireAuth();
  const customer = await assertOwnedCustomer(ctx, uuid);
  const parsed = CustomerPatchSchema.parse(patch);
  await db.customer.update({ where: { id: customer.id }, data: parsed });
  revalidatePath("/", "layout");
}

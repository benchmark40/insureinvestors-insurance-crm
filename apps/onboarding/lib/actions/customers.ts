"use server";

import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";
import {
  CustomerPatchSchema,
  type CustomerPatch,
} from "@insureinvestorsv2/lib";

export async function updateCustomer(
  uuid: string,
  patch: CustomerPatch,
): Promise<void> {
  const parsed = CustomerPatchSchema.parse(patch);
  await db.customer.update({ where: { uuid }, data: parsed });
  // Revalidate any submission flow that references this customer.
  revalidatePath("/", "layout");
}

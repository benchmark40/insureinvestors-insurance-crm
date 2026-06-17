"use server";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";

export async function getPolicyByUuid(uuid: string) {
  const { broker } = await requireAuth();
  return db.policy.findFirst({
    where: { uuid, customer: { brokerId: broker.id } },
    include: {
      customer: true,
      carrier: true,
      submission: true,
      boundQuote: { include: { carrier: true } },
      transactions: {
        orderBy: { effectiveDate: "desc" },
        include: {
          invoice: true,
          buildingCoverages: {
            include: {
              building: { include: { location: true } },
              lineOfBusiness: true,
            },
          },
        },
      },
      linesOfBusiness: { include: { writingCompany: true } },
      locations: {
        orderBy: { locationNumber: "asc" },
        include: { buildings: { orderBy: { buildingNumber: "asc" } } },
      },
    },
  });
}

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";

/** Submission KPI counts shown on the underwriting dashboard cards. Broker-scoped. */
export async function getSubmissionStats() {
  const { broker } = await requireAuth();
  const where = { customer: { brokerId: broker.id } };

  const [total, byStatus, last30] = await Promise.all([
    db.submission.count({ where }),
    db.submission.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    db.submission.count({
      where: {
        ...where,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of byStatus) counts[row.status] = row._count._all;

  return {
    total,
    last30Days: last30,
    draft: counts.draft ?? 0,
    inFlight: (counts.ready ?? 0) + (counts.sent ?? 0) + (counts.partial ?? 0),
    quoted: counts.quoted ?? 0,
    bound: counts.bound ?? 0,
    lost: (counts.declined ?? 0) + (counts.lost ?? 0) + (counts.expired ?? 0),
  };
}

/** All submissions for the current broker, newest first. */
export async function listSubmissions() {
  const { broker } = await requireAuth();
  const rows = await db.submission.findMany({
    where: { customer: { brokerId: broker.id } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      _count: { select: { locations: true, quotes: true } },
    },
  });

  return rows.map((s) => ({
    id: s.id,
    uuid: s.uuid,
    status: s.status,
    customer: s.customer.businessName || s.namedInsured || "—",
    linesOfBusiness: (s.linesOfBusiness as string[]) ?? [],
    targetEffectiveDate: s.targetEffectiveDate?.toISOString().split("T")[0] ?? null,
    createdAt: s.createdAt.toISOString(),
    locationCount: s._count.locations,
    buildingCount: 0,
    quoteCount: s._count.quotes,
  }));
}

export type SubmissionRow = Awaited<ReturnType<typeof listSubmissions>>[number];

/** All policies for the current broker, newest first. */
export async function listPolicies() {
  const { broker } = await requireAuth();
  const rows = await db.policy.findMany({
    where: { customer: { brokerId: broker.id } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      carrier: true,
      transactions: {
        where: { status: "in_force" },
        orderBy: { effectiveDate: "desc" },
        take: 1,
      },
    },
  });
  return rows.map((p) => {
    const txn = p.transactions[0];
    return {
      id: p.id,
      uuid: p.uuid,
      policyNumber: p.policyNumber,
      customer: p.customer.businessName || "—",
      carrier: p.carrier.name,
      inceptionDate: p.inceptionDate.toISOString(),
      expirationDate: p.expirationDate.toISOString(),
      premium: txn ? Number(txn.premiumChange) : 0,
      status: txn?.status ?? "pending",
    };
  });
}

/** All carrier quotes across the current broker's submissions. */
export async function listQuotes() {
  const { broker } = await requireAuth();
  const rows = await db.carrierQuote.findMany({
    where: { submission: { customer: { brokerId: broker.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      carrier: true,
      submission: { include: { customer: true } },
    },
  });
  return rows.map((q) => ({
    id: q.id,
    status: q.status,
    quoteNumber: q.quoteNumber,
    premium: Number(q.premium),
    effectiveDate: q.effectiveDate?.toISOString() ?? null,
    receivedAt: q.receivedAt?.toISOString() ?? null,
    carrier: q.carrier.name,
    submissionUuid: q.submission.uuid,
    customer: q.submission.customer.businessName || "—",
  }));
}

/** All customers in the current broker. */
export async function listCustomers() {
  const { broker } = await requireAuth();
  const rows = await db.customer.findMany({
    where: { brokerId: broker.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true, policies: true, claims: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    uuid: c.uuid,
    name:
      c.businessName ||
      `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() ||
      "Unnamed",
    email: c.email,
    phone: c.phone,
    city: c.city,
    state: c.state,
    submissionCount: c._count.submissions,
    policyCount: c._count.policies,
    claimCount: c._count.claims,
    createdAt: c.createdAt.toISOString(),
  }));
}

/** Carrier panel (shared across brokers — no scoping). */
export async function listCarriers() {
  await requireAuth();
  const rows = await db.carrier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { personnel: true, policies: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    naic: c.naic,
    parentCompany: c.parentCompany,
    kind: c.kind,
    isActive: c.isActive,
    personnelCount: c._count.personnel,
    policyCount: c._count.policies,
  }));
}

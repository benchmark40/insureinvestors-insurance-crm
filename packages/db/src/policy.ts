import { Prisma } from "@prisma/client";

import { db } from "./index";

/**
 * Bind a single carrier quote into a Policy: snapshot the submission (locations,
 * buildings), create the policy header, lines of business, a new-business
 * in-force transaction, per-building coverages, and an invoice.
 *
 * This is the system-context core shared by the staff "Bind" action, the Ascend
 * webhook, and the customer-side purchase poll. It performs NO auth and NO
 * redirect/revalidate — callers own those concerns.
 *
 * Idempotent + concurrency-safe: the carrier quote is claimed with an atomic
 * conditional update, so a quote can only ever produce one policy even if the
 * webhook and the buyer's poll fire at the same time. Returns the new policy's
 * uuid, or null when the quote was already bound (nothing to do).
 */
export async function bindCarrierQuoteCore(
  quoteId: number,
): Promise<string | null> {
  const quote = await db.carrierQuote.findUnique({
    where: { id: quoteId },
    include: {
      submission: {
        include: {
          customer: true,
          locations: {
            include: { buildings: true },
            orderBy: { locationNumber: "asc" },
          },
        },
      },
    },
  });
  if (!quote) throw new Error("Quote not found");

  const effective =
    quote.effectiveDate ?? quote.submission.targetEffectiveDate ?? new Date();
  const expiration =
    quote.expirationDate ??
    quote.submission.targetExpirationDate ??
    new Date(
      effective.getFullYear() + 1,
      effective.getMonth(),
      effective.getDate(),
    );

  const lobCodes =
    (quote.submission.linesOfBusiness as string[] | null) ?? ["PROP"];

  const buildings = quote.submission.locations.flatMap((l) => l.buildings);
  const totalInsurable = buildings.reduce(
    (sum, b) => sum + (b.insurableValue ? Number(b.insurableValue) : 0),
    0,
  );

  const premium = Number(quote.premium);
  const fees = Number(quote.policyFee) + Number(quote.otherFees);
  const taxes = Number(quote.taxes);
  const total = premium + fees + taxes;

  return db.$transaction(async (tx) => {
    // Atomically claim the bind — only one caller can flip a non-bound quote to
    // bound. If we didn't win the claim, the quote is already bound: skip.
    const claim = await tx.carrierQuote.updateMany({
      where: { id: quote.id, NOT: { status: "bound" } },
      data: { status: "bound" },
    });
    if (claim.count === 0) return null;

    // 1. Policy header
    const policy = await tx.policy.create({
      data: {
        customerId: quote.submission.customerId,
        submissionId: quote.submission.id,
        boundQuoteId: quote.id,
        carrierId: quote.carrierId,
        policyNumber: quote.quoteNumber || `POL-${Date.now()}`,
        inceptionDate: effective,
        expirationDate: expiration,
      },
    });

    // 2. Copy Locations -> Buildings, preserving sourceLocation link
    const bldById = new Map<number, number>(); // original bld.id -> new bld.id
    for (const loc of quote.submission.locations) {
      const newLoc = await tx.location.create({
        data: {
          policyId: policy.id,
          sourceLocationId: loc.id,
          locationNumber: loc.locationNumber,
          namedInsured: loc.namedInsured,
          addressLine1: loc.addressLine1,
          addressLine2: loc.addressLine2,
          city: loc.city,
          state: loc.state,
          zipCode: loc.zipCode,
          county: loc.county,
          latitude: loc.latitude,
          longitude: loc.longitude,
          interestType: loc.interestType,
          occupancy: loc.occupancy,
          protectionClass: loc.protectionClass,
          coastalClass: loc.coastalClass,
          tierRate: loc.tierRate,
          fireDistrict: loc.fireDistrict,
          mortgageeName: loc.mortgageeName,
          loanNumber: loc.loanNumber,
          escrowed: loc.escrowed,
          occupancyClass: loc.occupancyClass,
        },
      });

      for (const b of loc.buildings) {
        const newB = await tx.building.create({
          data: {
            locationId: newLoc.id,
            buildingNumber: b.buildingNumber,
            name: b.name,
            propertyType: b.propertyType,
            propertyUsage: b.propertyUsage,
            tenantType: b.tenantType,
            occupancyPercent: b.occupancyPercent,
            numUnits: b.numUnits,
            numStories: b.numStories,
            totalSqft: b.totalSqft,
            yearBuilt: b.yearBuilt,
            yearRenovated: b.yearRenovated,
            constructionType: b.constructionType,
            roofType: b.roofType,
            roofCoveringType: b.roofCoveringType,
            roofCoveringYear: b.roofCoveringYear,
            electricalType: b.electricalType,
            electricalYear: b.electricalYear,
            plumbingType: b.plumbingType,
            plumbingYear: b.plumbingYear,
            hvacType: b.hvacType,
            hvacYear: b.hvacYear,
            sprinklered: b.sprinklered,
            burglarAlarmType: b.burglarAlarmType,
            fireAlarmType: b.fireAlarmType,
            propertyCondition: b.propertyCondition,
            buildingExterior: b.buildingExterior,
            pool: b.pool,
            insurableValue: b.insurableValue,
            replacementCost: b.replacementCost,
          },
        });
        bldById.set(b.id, newB.id);
      }
    }

    // 3. Policy lines of business (one row per LOB code on the submission)
    const lobRows: { id: number; code: string }[] = [];
    for (const code of lobCodes) {
      const lob = await tx.policyLineOfBusiness.create({
        data: {
          policyId: policy.id,
          code,
          name: code,
          effectiveDate: effective,
          expirationDate: expiration,
          writingCompanyId: quote.carrierId,
        },
      });
      lobRows.push({ id: lob.id, code });
    }
    const propertyLob = lobRows.find((l) => l.code === "PROP") ?? lobRows[0];

    // 4. PolicyTransaction (new business, in force)
    const txn = await tx.policyTransaction.create({
      data: {
        policyId: policy.id,
        transactionType: "new_business",
        status: "in_force",
        effectiveDate: effective,
        reason: "New business — quote bound",
        description: `Bound from quote ${quote.quoteNumber || `#${quote.id}`}`,
        premiumChange: premium,
        feeChange: fees,
        taxChange: taxes,
      },
    });

    // 5. BuildingCoverage rows — one 'building' coverage per building.
    if (propertyLob && buildings.length > 0) {
      for (const b of buildings) {
        const newBuildingId = bldById.get(b.id);
        if (!newBuildingId) continue;
        const iv = b.insurableValue ? Number(b.insurableValue) : 0;
        const share =
          totalInsurable > 0 ? iv / totalInsurable : 1 / buildings.length;
        await tx.buildingCoverage.create({
          data: {
            transactionId: txn.id,
            buildingId: newBuildingId,
            lineOfBusinessId: propertyLob.id,
            coverageType: "building",
            limit: iv as unknown as Prisma.Decimal,
            premium: (premium * share) as unknown as Prisma.Decimal,
            valuationBasis: "RCV",
            sortOrder: b.buildingNumber,
          },
        });
      }
    }

    // 6. Invoice
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);
    await tx.invoice.create({
      data: {
        transactionId: txn.id,
        customerId: quote.submission.customerId,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: now,
        dueDate: due,
        premiumAmount: premium,
        fees,
        taxes,
        commission: Number(quote.commissionAmount),
        total,
      },
    });

    // 7. Submission follows the bound quote.
    await tx.submission.update({
      where: { id: quote.submission.id },
      data: { status: "bound" },
    });

    return policy.uuid;
  });
}

/**
 * Mark a proposal accepted (idempotent) and bind every carrier quote it bundles
 * into a Policy. Safe to call more than once — already-bound quotes are skipped,
 * so the Ascend webhook and the buyer's poll can both call it without creating
 * duplicate policies. Returns the uuids of policies created on this run.
 */
export async function acceptAndBindProposal(
  proposalId: number,
): Promise<{ policyUuids: string[] }> {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      status: true,
      quotes: { select: { carrierQuoteId: true } },
    },
  });
  if (!proposal) throw new Error("Proposal not found");

  if (proposal.status !== "accepted") {
    await db.proposal.update({
      where: { id: proposalId },
      data: { status: "accepted", acceptedAt: new Date() },
    });
  }

  const policyUuids: string[] = [];
  for (const pq of proposal.quotes) {
    const uuid = await bindCarrierQuoteCore(pq.carrierQuoteId);
    if (uuid) policyUuids.push(uuid);
  }
  return { policyUuids };
}

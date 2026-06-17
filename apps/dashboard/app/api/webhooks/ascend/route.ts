import { NextResponse } from "next/server";

import { acceptAndBindProposal, db } from "@insureinvestorsv2/db";

import { fetchAscendProgramStatus } from "@/lib/ascend/programs";

/**
 * Ascend webhook — fires when a program changes (e.g. the customer pays). We use
 * it as the reliable, server-to-server signal that a proposal was purchased, so
 * issuance doesn't depend on the buyer's browser finishing the poll.
 *
 * Security: gated by ASCEND_WEBHOOK_SECRET (sent as `x-webhook-secret` header or
 * `?secret=`). We do NOT trust the payload's status — we only pull a program id
 * from it and then re-fetch the program from Ascend's authenticated API to
 * confirm it's actually "purchased" before issuing any policy.
 */
export async function POST(req: Request) {
  const secret = process.env.ASCEND_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-webhook-secret") ??
      new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // tolerate empty/non-JSON bodies
  }

  // Pull a program id out of the common payload shapes.
  const data = (body.data ?? {}) as Record<string, unknown>;
  const program = (body.program ?? {}) as Record<string, unknown>;
  const programId = String(
    data.id ??
      data.program_id ??
      body.program_id ??
      program.id ??
      body.id ??
      "",
  );
  if (!programId) {
    return NextResponse.json({ error: "no program id in payload" }, { status: 400 });
  }

  // Authoritative check — confirm purchase via Ascend's API, not the payload.
  let remote: { status: string };
  try {
    remote = await fetchAscendProgramStatus(programId);
  } catch {
    return NextResponse.json({ error: "program lookup failed" }, { status: 502 });
  }
  if (remote.status !== "purchased") {
    return NextResponse.json({ ok: true, ignored: remote.status });
  }

  const proposal = await db.proposal.findFirst({
    where: { ascendProgramId: programId },
    select: { id: true },
  });
  if (!proposal) {
    // 200 so Ascend doesn't retry forever for a program we don't track.
    return NextResponse.json({ ok: true, note: "no matching proposal" });
  }

  const { policyUuids } = await acceptAndBindProposal(proposal.id);
  return NextResponse.json({ ok: true, policiesIssued: policyUuids.length });
}

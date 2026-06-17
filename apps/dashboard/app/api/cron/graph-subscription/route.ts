/**
 * Cron-fired endpoint that makes sure a Graph subscription exists on the
 * shared mailbox and renews it before expiry. Hit this every 30 min.
 *
 * Auth: header `Authorization: Bearer <GRAPH_CRON_SECRET>`.
 */

import { NextResponse } from "next/server";

import { ensureGlobalSubscription } from "@/lib/email/subscription";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const expected = process.env.GRAPH_CRON_SECRET ?? "";
  if (!expected) return false;
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const sub = await ensureGlobalSubscription();
    return NextResponse.json({
      ok: true,
      subscriptionId: sub.subscriptionId,
      expirationAt: sub.expirationAt.toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export const GET = POST;

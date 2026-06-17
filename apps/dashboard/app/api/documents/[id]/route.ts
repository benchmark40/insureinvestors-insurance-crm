import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { NextResponse } from "next/server";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import { fullStoragePath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const auth = await requireAuth();
  const doc = await db.submissionDocument.findFirst({
    where: {
      id,
      submission: { customer: { brokerId: auth.broker.id } },
    },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = fullStoragePath(doc.storagePath);
  let size: number;
  try {
    const s = await stat(path);
    size = s.size;
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 410 });
  }

  // Stream the file rather than buffering it in memory.
  // Node's Readable -> ReadableStream conversion is handled by Next.
  const nodeStream = createReadStream(path);
  // Cast through unknown — Next accepts a Node Readable here.
  const body = nodeStream as unknown as ReadableStream;

  return new NextResponse(body, {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${doc.filename.replace(
        /"/g,
        "",
      )}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

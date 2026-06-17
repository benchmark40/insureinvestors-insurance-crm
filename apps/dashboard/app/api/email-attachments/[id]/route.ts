/**
 * Stream an EmailAttachment file. The DB row holds the storageKey + filename;
 * we authenticate the caller, look up the row, and stream from local disk.
 */

import { stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { ReadableStream as NodeReadableStream } from "node:stream/web";
import { Readable } from "node:stream";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import {
  readAttachmentStream,
  resolveStoragePath,
} from "@/lib/storage/email-attachments";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAuth();
  const { id } = await ctx.params;
  const attachmentId = Number(id);
  if (!Number.isFinite(attachmentId)) {
    return new NextResponse("Bad id", { status: 400 });
  }

  const row = await db.emailAttachment.findUnique({
    where: { id: attachmentId },
  });
  if (!row) return new NextResponse("Not found", { status: 404 });

  const path = resolveStoragePath(row.storageKey);
  if (!path) return new NextResponse("Not found", { status: 404 });

  try {
    await stat(path);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const nodeStream = readAttachmentStream(path);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": row.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=0",
    },
  });
}

// Silence unused-import warning in some TS configs.
export type _Unused = NodeReadableStream;

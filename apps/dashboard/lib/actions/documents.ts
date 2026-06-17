"use server";

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { revalidatePath } from "next/cache";

import { db } from "@insureinvestorsv2/db";

import { requireAuth } from "@/lib/require-auth";
import { assertOwnedSubmission } from "@/lib/scope";
import { fullStoragePath, uploadsRootFor } from "@/lib/uploads";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_PREFIXES = ["application/", "image/", "text/"]; // generous; we're sandboxed

export async function uploadSubmissionDocument(formData: FormData): Promise<void> {
  const ctx = await requireAuth();
  const submissionUuid = String(formData.get("submissionUuid") ?? "");
  const sub = await assertOwnedSubmission(ctx, submissionUuid);

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (file.size === 0) throw new Error("Empty file");
  if (file.size > MAX_BYTES) throw new Error("File exceeds 20MB limit");
  if (
    file.type &&
    !ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))
  ) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  const dir = uploadsRootFor(submissionUuid);
  await mkdir(dir, { recursive: true });
  const safeExt = extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const stored = `${randomBytes(12).toString("hex")}${safeExt}`;
  const fullPath = `${dir}/${stored}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  await db.submissionDocument.create({
    data: {
      submissionId: sub.id,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storagePath: `${submissionUuid}/${stored}`,
      uploadedById: ctx.user.id,
    },
  });
  revalidatePath(`/submissions/${submissionUuid}`);
}

export async function deleteSubmissionDocument(id: number): Promise<void> {
  const ctx = await requireAuth();
  const doc = await db.submissionDocument.findFirst({
    where: {
      id,
      submission: { customer: { brokerId: ctx.broker.id } },
    },
    include: { submission: { select: { uuid: true } } },
  });
  if (!doc) throw new Error("Document not found");

  // Best-effort file deletion (ignore if it's already gone).
  try {
    await unlink(fullStoragePath(doc.storagePath));
  } catch {
    // ignore
  }

  await db.submissionDocument.delete({ where: { id: doc.id } });
  revalidatePath(`/submissions/${doc.submission.uuid}`);
}

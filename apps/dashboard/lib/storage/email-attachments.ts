/**
 * Local filesystem storage for email-reply attachments. Files land under
 * apps/dashboard/storage/email-attachments/{yyyy}/{mm}/{uuid}-{filename}.
 * We store the relative path (storageKey) in the EmailAttachment row.
 *
 * Swap this module out for S3/R2 in prod — call sites only depend on
 * saveAttachment + readAttachment.
 */

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { resolve as resolvePath } from "node:path";
import { randomUUID } from "node:crypto";

const ROOT = resolvePath(process.cwd(), "storage", "email-attachments");

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").slice(-180);
}

export type SavedAttachment = {
  storageKey: string;
  absolutePath: string;
  sizeBytes: number;
};

export async function saveAttachment(
  bytes: Buffer,
  filename: string,
): Promise<SavedAttachment> {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dir = resolvePath(ROOT, year, month);
  await mkdir(dir, { recursive: true });

  const safe = sanitizeFilename(filename);
  const ext = extname(safe);
  const base = ext ? safe.slice(0, -ext.length) : safe;
  const unique = `${randomUUID()}-${base}${ext}`;
  const absolutePath = resolvePath(dir, unique);

  await writeFile(absolutePath, bytes);
  return {
    storageKey: `${year}/${month}/${unique}`,
    absolutePath,
    sizeBytes: bytes.byteLength,
  };
}

/**
 * Resolve a storageKey back to an absolute path. Rejects anything that tries
 * to escape the attachments root.
 */
export function resolveStoragePath(storageKey: string): string | null {
  const abs = resolvePath(ROOT, storageKey);
  if (!abs.startsWith(ROOT + "/") && abs !== ROOT) return null;
  return abs;
}

export function readAttachmentStream(absolutePath: string) {
  return createReadStream(absolutePath);
}

import { join, resolve } from "node:path";

// Centralized uploads root so server actions and the streaming route handler
// agree on the location. Lives outside `public/` so files only flow through
// the broker-scoped download route.
export const UPLOADS_ROOT = resolve(process.cwd(), "..", "..", "data", "uploads");

export function uploadsRootFor(submissionUuid: string): string {
  return join(UPLOADS_ROOT, submissionUuid);
}

export function fullStoragePath(storagePath: string): string {
  return join(UPLOADS_ROOT, storagePath);
}

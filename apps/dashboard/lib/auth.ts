import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@insureinvestorsv2/db";

/** Shared default broker — same one the anonymous onboarding flow attaches submissions to. */
async function defaultBroker() {
  const existing = await db.broker.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;
  return db.broker.create({
    data: {
      domain: "default.localinsureinvestors.com",
      name: "Default Agency",
    },
  });
}

// Resolve the canonical base URL. An explicit DASHBOARD_BASE_URL (a real custom
// domain) always wins; otherwise fall back to Vercel's auto-provided production
// URL so we don't have to hardcode the (often truncated) *.vercel.app hostname.
const rawBaseURL =
  process.env.DASHBOARD_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001");
// Tolerate a scheme-less DASHBOARD_BASE_URL (e.g. "admin.insureinvestors.com");
// Better Auth needs a full URL or `new URL()` throws ERR_INVALID_URL.
const baseURL = /^https?:\/\//.test(rawBaseURL)
  ? rawBaseURL
  : `https://${rawBaseURL}`;

// Trust the current deployment's own origin too, so Vercel preview deployments
// (whose hostname differs from the stable production URL) pass the origin check.
const trustedOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
].filter((v): v is string => Boolean(v));

export const auth = betterAuth({
  // Without an explicit base URL Better Auth warns and its callbacks/redirects
  // can misbehave in server actions where there's no request to derive it from.
  baseURL,
  trustedOrigins,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  // MVP: keep email verification off so a fresh signup can go straight to the
  // dashboard. Turn on once we wire an email sender (Phase 7 polish).
  emailVerification: { sendOnSignUp: false },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const broker = await defaultBroker();
          await db.user.update({
            where: { id: user.id },
            data: { brokerId: broker.id },
          });
        },
      },
    },
  },
});

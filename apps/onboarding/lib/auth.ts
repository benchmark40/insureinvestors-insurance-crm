import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@insureinvestorsv2/db";

/**
 * Client-portal auth instance for the onboarding app.
 *
 * Shares the Better Auth tables (User/Session/Account) with the broker
 * dashboard, but this instance is for INSURED clients, not staff. The key
 * difference from the dashboard's `auth` is the signup hook: it flags new users
 * `isClient` and never assigns a broker. Because clients get no `brokerId`, the
 * dashboard's `requireAuth` (which demands a broker) keeps them out
 * automatically.
 *
 * Email verification stays off (MVP, no email sender wired) so a fresh signup
 * lands straight in the portal.
 */
// Resolve the canonical base URL. An explicit ONBOARDING_BASE_URL (a real custom
// domain) always wins; otherwise fall back to Vercel's auto-provided production
// URL so we don't have to hardcode the (often truncated) *.vercel.app hostname.
const rawBaseURL =
  process.env.ONBOARDING_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
// Tolerate a scheme-less ONBOARDING_BASE_URL (e.g. "application.insureinvestors.com");
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
  emailVerification: { sendOnSignUp: false },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.user.update({
            where: { id: user.id },
            data: { isClient: true },
          });
        },
      },
    },
  },
});

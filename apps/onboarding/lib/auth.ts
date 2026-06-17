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
export const auth = betterAuth({
  // Without an explicit base URL Better Auth warns and its callbacks/redirects
  // can misbehave in server actions where there's no request to derive it from.
  baseURL: process.env.ONBOARDING_BASE_URL ?? "http://localhost:3000",
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

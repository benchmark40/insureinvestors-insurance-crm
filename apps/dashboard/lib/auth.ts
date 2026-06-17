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

export const auth = betterAuth({
  // Without an explicit base URL Better Auth warns and its callbacks/redirects
  // can misbehave in server actions where there's no request to derive it from.
  baseURL: process.env.DASHBOARD_BASE_URL ?? "http://localhost:3001",
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

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@insureinvestorsv2/db";

import { auth } from "@/lib/auth";

/**
 * Server-side gate for the client portal. Use from portal server components,
 * server actions, and route handlers. Bounces to /portal/login if there's no
 * session or the user isn't a client account.
 */
export async function requireClient() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/portal/login");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.isClient) {
    redirect("/portal/login");
  }

  return { user };
}

export type ClientAuthContext = Awaited<ReturnType<typeof requireClient>>;

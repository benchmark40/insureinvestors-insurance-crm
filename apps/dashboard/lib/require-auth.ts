import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@insureinvestorsv2/db";

import { auth } from "@/lib/auth";

/**
 * Server-side auth gate. Use from server components, server actions, and route
 * handlers. Bounces to /login if there's no session OR if the user has no
 * broker yet (signup hook hadn't fired — shouldn't happen but safer to gate).
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { broker: true },
  });
  if (!user || !user.broker) {
    redirect("/login");
  }

  return { user, broker: user.broker };
}

export type AuthContext = Awaited<ReturnType<typeof requireAuth>>;

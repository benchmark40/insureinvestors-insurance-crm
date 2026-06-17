import { headers } from "next/headers";
import Link from "next/link";

import { db } from "@insureinvestorsv2/db";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * Top header for the public onboarding + proposal pages. When a CLIENT is signed
 * in it surfaces their email, a link to their portal, and a logout button.
 * Admin/underwriter accounts are intentionally NOT treated as a client session
 * here — they get the plain header — keeping the two account types separate.
 */
export async function SessionHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  let clientEmail: string | null = null;
  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, isClient: true },
    });
    if (user?.isClient) clientEmail = user.email;
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-semibold tracking-tight hover:opacity-80"
        >
          InsureInvestors
        </Link>
        {clientEmail ? (
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{clientEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/portal/submissions" />}
            >
              My portal
            </Button>
            <SignOutButton />
          </div>
        ) : (
          <nav className="text-muted-foreground flex items-center gap-4 text-sm">
            <a
              href="tel:+18005551234"
              className="hover:text-foreground transition-colors"
            >
              Need help? Call us
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

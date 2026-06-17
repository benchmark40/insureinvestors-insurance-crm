"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export function PortalHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  function onSignOut() {
    startTransition(async () => {
      await signOut();
      router.replace("/portal/login");
      router.refresh();
    });
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/portal/submissions"
          className="font-semibold tracking-tight hover:opacity-80"
        >
          InsureInvestors
        </Link>
        {session && (
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <span className="hidden sm:inline">{session.user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              disabled={isPending}
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

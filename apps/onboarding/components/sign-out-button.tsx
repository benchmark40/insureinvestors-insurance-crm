"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

/**
 * Logs the current client out and refreshes the page so server components
 * re-render in their signed-out state. Used in the onboarding header.
 */
export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSignOut() {
    startTransition(async () => {
      await signOut();
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={onSignOut} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

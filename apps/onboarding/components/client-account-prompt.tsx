"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Lock, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp } from "@/lib/auth-client";
import {
  linkClientToProposal,
  linkClientToSubmission,
} from "@/lib/actions/client";

/** Which record to attach the client to once they authenticate. */
type LinkTarget =
  | { kind: "submission"; uuid: string }
  | { kind: "proposal"; token: string };

type Props = {
  /** The "Your business" email — the account is always tied to this address. */
  email: string;
  /** True when an account already exists for {@link email}. */
  exists: boolean;
  /** True when the visitor is already signed in as a CLIENT (not staff). */
  signedIn: boolean;
  link: LinkTarget;
};

async function runLink(link: LinkTarget): Promise<void> {
  if (link.kind === "submission") await linkClientToSubmission(link.uuid);
  else await linkClientToProposal(link.token);
}

export function ClientAccountPrompt({
  email,
  exists,
  signedIn,
  link,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);
  // Start in login mode if we already know an account exists for this email.
  const [mode, setMode] = useState<"signin" | "signup">(
    exists ? "signin" : "signup",
  );
  const [password, setPassword] = useState("");

  // Already signed in as a client — confirm the email (locked) and point them
  // to their portal. They can't change which account they're using here.
  if (signedIn) {
    return (
      <Card className="w-full max-w-sm text-left">
        <CardHeader>
          <CardTitle className="text-base">You&apos;re signed in</CardTitle>
        </CardHeader>
        <CardContent>
          <Field className="mb-4">
            <FieldLabel htmlFor="acct-email">Account</FieldLabel>
            <Input
              id="acct-email"
              type="email"
              value={email}
              readOnly
              disabled
            />
          </Field>
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href="/portal/submissions" />}
          >
            View in your portal
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (dismissed) return null;

  const isSignup = mode === "signup";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = isSignup
        ? await signUp.email({ email, password, name: email })
        : await signIn.email({ email, password });

      if (error) {
        // Account already exists — flip to sign-in instead of failing.
        if (isSignup && error.status === 422) {
          setMode("signin");
          toast.info("You already have an account — please sign in.");
          return;
        }
        toast.error(
          error.message ||
            (isSignup
              ? "Couldn't create your account"
              : "Invalid email or password"),
        );
        return;
      }

      try {
        await runLink(link);
      } catch {
        // Account/auth succeeded even if linking hiccupped; the portal matches
        // by email so the submission still shows up.
      }
      router.push("/portal/submissions");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-sm text-left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="text-primary size-4" />
          {isSignup ? "Track this quote" : "Sign in to continue"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">
          {isSignup
            ? "Create a password to follow your submission's status and start future quotes faster."
            : "You already have an account for this email. Enter your password to continue."}
        </p>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="acct-email">Email</FieldLabel>
              <Input
                id="acct-email"
                type="email"
                value={email}
                readOnly
                aria-readonly
              />
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                <Lock className="size-3" />
                Tied to your business email
              </p>
            </Field>
            <Field>
              <FieldLabel htmlFor="acct-password">Password</FieldLabel>
              <Input
                id="acct-password"
                type="password"
                required
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Spinner data-icon="inline-start" />}
              {isSignup
                ? isPending
                  ? "Creating…"
                  : "Create account"
                : isPending
                  ? "Signing in…"
                  : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setDismissed(true)}
            >
              Skip for now
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

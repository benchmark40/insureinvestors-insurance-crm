"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp } from "@/lib/auth-client";

export default function PortalLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = isSignup
        ? await signUp.email({ email, password, name: name || email })
        : await signIn.email({ email, password });
      if (error) {
        toast.error(
          error.message ||
            (isSignup ? "Couldn't create account" : "Invalid email or password"),
        );
        return;
      }
      router.replace("/portal/submissions");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex max-w-sm justify-center pt-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isSignup ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? "Track your submissions and their status."
              : "Sign in to your client portal."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              {isSignup && (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={isSignup ? "new-password" : "current-password"}
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
            </FieldGroup>
          </form>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            {isSignup ? "Already have an account?" : "No account yet?"}{" "}
            <button
              type="button"
              className="text-foreground hover:underline"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
            >
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

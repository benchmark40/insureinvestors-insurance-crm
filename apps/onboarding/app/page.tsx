import Link from "next/link";
import { ArrowRight, Building2, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { SessionHeader } from "@/components/session-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    icon: Building2,
    title: "Tell us about your business",
    body: "Company name, entity type, and what kind of coverage you need.",
  },
  {
    icon: ShieldCheck,
    title: "Add your properties",
    body: "Addresses and building details — year built, sqft, construction, systems.",
  },
  {
    icon: Sparkles,
    title: "Confirm and submit",
    body: "Prior insurance, claims history, and the date you want coverage to start.",
  },
];

export default async function HomePage() {
  return (
    <>
      <SessionHeader />
      <main>
        <section className="border-b">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-20 text-center">
            <Badge variant="secondary" className="gap-1.5">
              <Clock data-icon="inline-start" />
              Quotes back in 24–48 hours
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Commercial property insurance,
              <br className="hidden sm:inline" />
              <span className="text-primary">quoted in minutes.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg">
              Tell us about your business and your properties. We send your
              request to our carrier panel and bring quotes back to you fast.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/start" />}
              >
                Start a submission
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="#how-it-works" />}
              >
                How it works
              </Button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Three steps. About 10 minutes.
            </h2>
            <p className="text-muted-foreground mt-2">
              Your submission saves as you go — pick up right where you left off.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card key={step.title}>
                  <CardHeader>
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                      <Icon />
                    </div>
                    <CardTitle className="pt-2">
                      <span className="text-muted-foreground mr-2 text-sm font-normal">
                        0{i + 1}
                      </span>
                      {step.title}
                    </CardTitle>
                    <CardDescription>{step.body}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

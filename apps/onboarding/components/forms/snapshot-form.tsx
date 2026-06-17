"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/forms/date-picker";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  markSubmissionReady,
  updateSubmission,
} from "@/lib/actions/submissions";

type Props = {
  submissionUuid: string;
  submission: {
    hasPriorCoverage: boolean;
    priorCarrier: string;
    priorExpirationDate: string | null;
    claimsInLast5Years: number;
    priorClaimsMoldOrAsbestos: boolean;
  };
};

export function SnapshotForm({ submissionUuid, submission }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [hasPriorCoverage, setHasPriorCoverage] = useState(
    submission.hasPriorCoverage,
  );
  const [priorCarrier, setPriorCarrier] = useState(submission.priorCarrier);
  const [priorExpirationDate, setPriorExpirationDate] = useState<Date | undefined>(
    submission.priorExpirationDate
      ? new Date(submission.priorExpirationDate)
      : undefined,
  );
  const [claimsInLast5Years, setClaimsInLast5Years] = useState(
    submission.claimsInLast5Years.toString(),
  );
  const [priorClaimsMoldOrAsbestos, setPriorClaimsMoldOrAsbestos] = useState(
    submission.priorClaimsMoldOrAsbestos,
  );

  function onBack() {
    router.push(`/${submissionUuid}/multy-property`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateSubmission(submissionUuid, {
          hasPriorCoverage,
          priorCarrier,
          priorExpirationDate: priorExpirationDate ?? null,
          claimsInLast5Years: Number(claimsInLast5Years) || 0,
          priorClaimsMoldOrAsbestos,
        });
        await markSubmissionReady(submissionUuid);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't submit. Please try again.");
      }
    });
  }

  const claimsCount = Number(claimsInLast5Years) || 0;

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Prior insurance</CardTitle>
          <CardDescription>
            Helps carriers understand your history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <Switch
                id="hasPriorCoverage"
                checked={hasPriorCoverage}
                onCheckedChange={(v) => setHasPriorCoverage(v === true)}
              />
              <Label htmlFor="hasPriorCoverage">
                We had coverage in place before this quote
              </Label>
            </Field>
            {hasPriorCoverage && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="priorCarrier">Prior carrier</FieldLabel>
                  <Input
                    id="priorCarrier"
                    value={priorCarrier}
                    onChange={(e) => setPriorCarrier(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="priorExpirationDate">
                    Policy expires
                  </FieldLabel>
                  <DatePicker
                    id="priorExpirationDate"
                    value={priorExpirationDate}
                    onChange={setPriorExpirationDate}
                    placeholder="Pick the expiration date"
                  />
                </Field>
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claims history</CardTitle>
          <CardDescription>
            Most carriers ask about the last 5 years.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field className="sm:max-w-xs">
              <FieldLabel htmlFor="claimsInLast5Years">
                Claims in the last 5 years
              </FieldLabel>
              <Input
                id="claimsInLast5Years"
                type="number"
                min={0}
                value={claimsInLast5Years}
                onChange={(e) => setClaimsInLast5Years(e.target.value)}
              />
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="priorClaimsMoldOrAsbestos"
                checked={priorClaimsMoldOrAsbestos}
                onCheckedChange={(v) =>
                  setPriorClaimsMoldOrAsbestos(v === true)
                }
              />
              <Label htmlFor="priorClaimsMoldOrAsbestos">
                Any prior claims involved mold or asbestos
              </Label>
            </Field>
            {claimsCount > 0 && (
              <Alert>
                <Info />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>
                  Your broker may follow up for loss runs (a one-page summary from
                  your prior carrier) once we send your submission.
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isPending ? "Submitting…" : "Submit for quote"}
        </Button>
      </div>
    </form>
  );
}

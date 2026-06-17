"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ExternalLink, FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { refreshProposalFromAscendByToken } from "@/lib/actions/proposals";

type Props = {
  token: string;
  status: string;
  programCheckoutUrl: string | null;
  paymentProposalUrl: string | null;
};

export function CheckoutPanel({
  token,
  status: initialStatus,
  programCheckoutUrl,
  paymentProposalUrl,
}: Props) {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [polling, setPolling] = useState(false);

  // When Ascend redirects back with ?checkout-complete=true, poll a few times
  // until the program is marked purchased on their side.
  useEffect(() => {
    if (search.get("checkout-complete") !== "true") return;
    if (status === "accepted") return;
    let cancelled = false;
    setPolling(true);
    (async () => {
      for (let i = 0; i < 6 && !cancelled; i++) {
        try {
          const result = await refreshProposalFromAscendByToken(token);
          if (result.status === "accepted") {
            setStatus("accepted");
            // Re-render the server component so the page's status badge updates.
            router.refresh();
            break;
          }
        } catch {
          // ignore — keep polling
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) setPolling(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [search, status, token]);

  if (status === "accepted") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-green-900">
            <CheckCircle2 className="size-5" />
            Proposal accepted
          </CardTitle>
          <CardDescription className="text-green-800">
            Thanks — payment was received. Your broker will follow up with the
            policy documents shortly.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status !== "presented") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Not yet available</CardTitle>
          <CardDescription>
            This proposal is{" "}
            <span className="font-mono">{status}</span>. Your broker will send
            you a checkout link once it&apos;s ready.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ready to bind?</CardTitle>
        <CardDescription>
          Pay and accept this proposal through our secure Ascend checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 pb-6">
        {programCheckoutUrl ? (
          <Button
            size="lg"
            nativeButton={false}
            render={
              <a
                href={programCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink data-icon="inline-start" />
            Proceed to checkout
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">
            Checkout URL not yet available — refresh in a moment.
          </p>
        )}
        {paymentProposalUrl && (
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={
              <a
                href={paymentProposalUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <FileDown data-icon="inline-start" />
            View proposal PDF
          </Button>
        )}
        {polling && (
          <span className="text-muted-foreground flex items-center gap-2 text-xs">
            <Spinner className="size-3" />
            Confirming payment with Ascend…
          </span>
        )}
      </CardContent>
    </Card>
  );
}

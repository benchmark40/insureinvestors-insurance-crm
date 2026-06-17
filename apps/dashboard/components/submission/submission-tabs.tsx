"use client";

import { useState, type ReactNode } from "react";

import { Tabs } from "@/components/ui/tabs";

/**
 * Controlled wrapper around the submission detail Tabs that mirrors the active
 * tab into the `?tab=` query param. We use native history.replaceState rather
 * than router.replace so switching tabs doesn't trigger a server roundtrip
 * (the page is force-dynamic and would refetch the whole submission). On a hard
 * refresh the server reads the param and renders the right tab; the URL is also
 * shareable.
 */
export function SubmissionTabs({
  initialTab,
  children,
}: {
  initialTab: string;
  children: ReactNode;
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        const next = String(value);
        setTab(next);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", next);
        window.history.replaceState(null, "", url);
      }}
      className="px-4 lg:px-6"
    >
      {children}
    </Tabs>
  );
}

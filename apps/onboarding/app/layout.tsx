import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Benchmark — Property Portfolio Quote",
  description: "Quote your property portfolio, one address at a time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background min-h-screen antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

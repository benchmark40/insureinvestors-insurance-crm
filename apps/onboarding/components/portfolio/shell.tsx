import Link from "next/link";

import { Logo } from "./bm-ui";

/**
 * Flow chrome for the Property Portfolio Quote — the `.bmflow` wrapper (which
 * scopes the ported design system), the sticky topbar, the scroll area and the
 * footer. Each step renders its content inside the centered stage.
 */
export function PortfolioShell({
  children,
  wide = false,
  startOver = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
  startOver?: boolean;
}) {
  return (
    <div className="bmflow app" data-density="comfortable">
      <header className="topbar">
        <Link href="/" aria-label="Benchmark — home">
          <Logo />
        </Link>
        <div className="topbar__right">
          {startOver && (
            <Link href="/" className="topbar__exit">
              Start over
            </Link>
          )}
          <span className="topbar__tag">Property portfolio quote</span>
        </div>
      </header>

      <div className="scroller">
        <main className={"stage" + (wide ? " stage--wide" : "")}>{children}</main>
        <footer className="foot">
          <span>Benchmark Insurance Group</span>
          <span className="foot__dot">·</span>
          <span>Property &amp; casualty</span>
          <span className="foot__dot">·</span>
          <span>Investor portfolios</span>
        </footer>
      </div>
    </div>
  );
}

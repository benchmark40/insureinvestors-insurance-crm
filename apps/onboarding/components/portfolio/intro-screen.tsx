import Link from "next/link";

import { Icon } from "./bm-ui";

/**
 * Landing / intro — ported from the Benchmark design. "Start your portfolio"
 * enters the routed flow (which creates a submission and redirects to step 1).
 */
export function IntroScreen() {
  const steps = [
    {
      n: "01",
      t: "Enter the address",
      d: "We pull year built, size, construction & risk data instantly.",
      i: "pin",
    },
    {
      n: "02",
      t: "Confirm property & risk",
      d: "Review what we found — flood zone, protection class, condition.",
      i: "gauge",
    },
    {
      n: "03",
      t: "Step through coverage",
      d: "Location, coverage, condition, safety — pre-filled for you.",
      i: "shieldchk",
    },
  ];
  return (
    <div className="intro">
      <span className="intro__badge">
        <span className="dot" />
        Property &amp; casualty · Investor portfolios
      </span>
      <h1 className="intro__h1">
        Quote your property portfolio, one address at a time
      </h1>
      <p className="intro__sub">
        Add each property by address — we confirm the building details and risk
        profile automatically, then walk you through coverage in four quick
        steps.
      </p>
      <Link href="/start" className="btn btn--primary btn--lg">
        <Icon name="plus" size={17} />
        Start your portfolio
      </Link>
      <ul className="intro__steps">
        {steps.map((s) => (
          <li key={s.n} className="introstep">
            <span className="introstep__ic">
              <Icon name={s.i} size={20} />
            </span>
            <div>
              <span className="introstep__n">{s.n}</span>
              <p className="introstep__t">{s.t}</p>
              <p className="introstep__d">{s.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

/**
 * Portfolio quote snapshot — step 3 (the design's checkout), restyled. Shows the
 * portfolio's total insured value + per-property breakdown (no premium), keeps
 * the prior-insurance / claims questions our backend requires, confirms contact
 * details, then marks the submission ready (which redirects to the completion
 * page).
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateCustomer } from "@/lib/actions/customers";
import { markSubmissionReady, updateSubmission } from "@/lib/actions/submissions";

import { Btn, Field, Icon, TextInput, fmtFull, num } from "./bm-ui";

type PropLine = { line1: string; use: string; tiv: string };

type Props = {
  submissionUuid: string;
  customer: {
    uuid: string;
    name: string;
    email: string;
    phone: string;
    entity: string;
  };
  snapshot: {
    hasPriorCoverage: boolean;
    priorCarrier: string;
    priorExpirationDate: string | null;
    claimsInLast5Years: number;
    priorClaimsMoldOrAsbestos: boolean;
  };
  properties: PropLine[];
};

export function CheckoutSnapshot({
  submissionUuid,
  customer,
  snapshot,
  properties,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [entity, setEntity] = useState(customer.entity);

  const [hasPrior, setHasPrior] = useState(snapshot.hasPriorCoverage);
  const [priorCarrier, setPriorCarrier] = useState(snapshot.priorCarrier);
  const [priorExp, setPriorExp] = useState(snapshot.priorExpirationDate ?? "");
  const [claims, setClaims] = useState(String(snapshot.claimsInLast5Years || 0));
  const [moldAsbestos, setMoldAsbestos] = useState(
    snapshot.priorClaimsMoldOrAsbestos,
  );

  const totals = {
    count: properties.length,
    units: properties.reduce((n) => n + 1, 0),
    tiv: properties.reduce((sum, p) => sum + num(p.tiv), 0),
  };
  const claimsCount = Number(claims) || 0;
  const valid = name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || "");

  function onSubmit() {
    if (!valid) {
      toast.error("Add a name and a valid email so we can reach you.");
      return;
    }
    startTransition(async () => {
      try {
        const parts = name.trim().split(/\s+/);
        const firstName = parts.slice(0, -1).join(" ") || parts[0] || "";
        const lastName = parts.length > 1 ? parts[parts.length - 1]! : "";
        await updateCustomer(customer.uuid, {
          email,
          phone,
          businessName: entity || undefined,
          firstName,
          lastName,
        });
        await updateSubmission(submissionUuid, {
          hasPriorCoverage: hasPrior,
          priorCarrier,
          priorExpirationDate: priorExp ? new Date(priorExp) : null,
          claimsInLast5Years: Number(claims) || 0,
          priorClaimsMoldOrAsbestos: moldAsbestos,
        });
      } catch (e) {
        console.error(e);
        toast.error("Couldn't submit. Please try again.");
        return;
      }
      // markSubmissionReady calls redirect() — keep it outside the try/catch so
      // Next's redirect signal isn't swallowed as an error.
      await markSubmissionReady(submissionUuid);
    });
  }

  return (
    <div className="checkout">
      <h1 className="checkout__title">Portfolio quote snapshot</h1>
      <p className="checkout__sub">
        A summary across {totals.count}{" "}
        {totals.count === 1 ? "property" : "properties"}. A licensed advisor
        prices your portfolio after carrier review — there&apos;s no obligation.
      </p>

      {/* coverage summary (navy block) — no premium */}
      <div className="estimate">
        <span className="estimate__lbl">Total insured value</span>
        <div className="estimate__big">{fmtFull(totals.tiv)}</div>
        <p className="estimate__note">
          {totals.count} {totals.count === 1 ? "property" : "properties"} ·{" "}
          {totals.units} buildings · premium calculated after advisor review
        </p>
      </div>

      <div className="cosum">
        <h3 className="cosum__h">Per-property breakdown</h3>
        <ul className="cosum__list">
          {properties.map((p, i) => (
            <li key={i} className="cosum__row">
              <span className="cosum__num">{i + 1}</span>
              <div className="cosum__id">
                <b>{p.line1 || "Property"}</b>
                <em>
                  {(p.use || "—") + " · " + fmtFull(p.tiv) + " TIV"}
                </em>
              </div>
              <span className="cosum__prem cosum__prem--pending">
                After review
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* prior insurance + claims (required by our backend) */}
      <div className="contact">
        <h3 className="cosum__h">Prior insurance &amp; claims</h3>
        <div className="fgrid">
          <Field label="Had coverage before this quote?" span={2}>
            <div className="seg">
              {["Yes", "No"].map((o) => (
                <button
                  key={o}
                  type="button"
                  className={
                    "seg__b" +
                    ((o === "Yes") === hasPrior ? " is-sel" : "")
                  }
                  onClick={() => setHasPrior(o === "Yes")}
                >
                  {o}
                </button>
              ))}
            </div>
          </Field>
          {hasPrior && (
            <>
              <Field label="Prior carrier" span={2}>
                <TextInput value={priorCarrier} onChange={setPriorCarrier} placeholder="Acme Mutual" />
              </Field>
              <Field label="Policy expires" span={2} optional>
                <span className="f-affix">
                  <input
                    type="date"
                    className="f-input"
                    value={priorExp}
                    onChange={(e) => setPriorExp(e.target.value)}
                  />
                </span>
              </Field>
            </>
          )}
          <Field label="Claims in the last 5 years" span={3}>
            <TextInput value={claims} onChange={setClaims} inputMode="numeric" mono />
          </Field>
          <Field label="Any prior mold or asbestos claims?" span={3}>
            <div className="seg">
              {["Yes", "No"].map((o) => (
                <button
                  key={o}
                  type="button"
                  className={
                    "seg__b" +
                    ((o === "Yes") === moldAsbestos ? " is-sel" : "")
                  }
                  onClick={() => setMoldAsbestos(o === "Yes")}
                >
                  {o}
                </button>
              ))}
            </div>
          </Field>
        </div>
        {claimsCount > 0 && (
          <div className="snapnote">
            <Icon name="info" size={14} />
            Your advisor may follow up for loss runs (a one-page summary from
            your prior carrier) once we send your submission.
          </div>
        )}
      </div>

      {/* contact */}
      <div className="contact">
        <h3 className="cosum__h">Where should we send it?</h3>
        <div className="fgrid">
          <Field label="Full name" span={3}>
            <TextInput value={name} onChange={setName} placeholder="Jordan Avery" />
          </Field>
          <Field label="Email" span={3}>
            <TextInput value={email} onChange={setEmail} placeholder="jordan@portfolio.com" inputMode="email" />
          </Field>
          <Field label="Phone" span={3} optional>
            <TextInput value={phone} onChange={setPhone} placeholder="(713) 555-0142" inputMode="tel" />
          </Field>
          <Field label="Entity / LLC" span={3} optional>
            <TextInput value={entity} onChange={setEntity} placeholder="Royal Ln Holdings LLC" />
          </Field>
        </div>
        <Btn
          kind="accent"
          size="lg"
          className="contact__submit"
          iconRight="arrow"
          disabled={!valid || isPending}
          onClick={onSubmit}
        >
          {isPending ? "Submitting…" : "Send my portfolio for review"}
        </Btn>
        <p className="contact__fine">
          No obligation. A licensed advisor reviews every submission.
        </p>
      </div>
    </div>
  );
}

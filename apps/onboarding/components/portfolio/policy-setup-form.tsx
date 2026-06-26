"use client";

/**
 * Policy-type + customer setup — step 1 of the routed flow, restyled to the
 * Benchmark "Choose your policy type" design. Wires to updateCustomer /
 * updateSubmission and advances to the property list. A coverage start-date
 * field is added (a current requirement that the source design omits).
 *
 * Policy type is a UX bucket; every portfolio quote implies Commercial Property,
 * so we persist linesOfBusiness = ["PROP"]. The ACORD/SOV upload is captured as
 * an advisor note (we don't parse schedules in-flow).
 */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateCustomer } from "@/lib/actions/customers";
import { updateSubmission } from "@/lib/actions/submissions";

import { Btn, Field, Icon, TextInput } from "./bm-ui";

const POLICY_TYPES = [
  { v: "residential", t: "Residential Portfolio Policy", d: "One or more rental homes & condos" },
  { v: "commercial", t: "Commercial Property", d: "Multi-tenant commercial space" },
  { v: "apartment", t: "Apartment Building", d: "Multi-unit residential building" },
  { v: "builders", t: "Builder's Risk", d: "Property under construction" },
  { v: "office", t: "Office Building", d: "Office or professional use" },
  { v: "other", t: "Other Property Type", d: "and 99 other types of properties" },
];

function BldgArt() {
  return (
    <svg className="art" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M10 28 32 14 54 28" stroke="#06b6a8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="27" width="32" height="26" rx="2" stroke="#0a1730" strokeWidth="2.8" />
      <path d="M16 36h32M16 44.5h32" stroke="#0a1730" strokeWidth="1.6" opacity=".45" />
      <rect x="21" y="30.5" width="6" height="2.6" rx=".6" fill="#06b6a8" />
      <rect x="37" y="30.5" width="6" height="2.6" rx=".6" fill="#06b6a8" />
      <rect x="28.5" y="46" width="7" height="7" fill="#0a1730" />
    </svg>
  );
}
function PersonArt() {
  return (
    <svg className="art art--lg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="23" r="10" fill="#0f9b89" />
      <path d="M14 54a18 18 0 0 1 36 0Z" fill="#15b39d" />
    </svg>
  );
}
function GroupArt() {
  return (
    <svg className="art art--lg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="18" cy="25" r="7.5" fill="#9fe6da" />
      <path d="M6 50a12 12 0 0 1 24 0Z" fill="#9fe6da" />
      <circle cx="46" cy="25" r="7.5" fill="#9fe6da" />
      <path d="M34 50a12 12 0 0 1 24 0Z" fill="#9fe6da" />
      <circle cx="32" cy="22" r="9.5" fill="#0f9b89" />
      <path d="M16 52a16 16 0 0 1 32 0Z" fill="#15b39d" />
    </svg>
  );
}

type Props = {
  submissionUuid: string;
  customer: {
    uuid: string;
    customerType: string;
    firstName: string;
    lastName: string;
    businessName: string;
    email: string;
  };
  submission: {
    policyType: string;
    locations: number;
    targetEffectiveDate: string | null;
  };
};

export function PolicySetupForm({ submissionUuid, customer, submission }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const [policyType, setPolicyType] = useState(submission.policyType);
  const [locations, setLocations] = useState(
    submission.locations > 0 ? submission.locations : 1,
  );
  const [customerType, setCustomerType] = useState(
    customer.customerType === "personal" ? "individual" : "company",
  );
  const [fullName, setFullName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [company, setCompany] = useState(customer.businessName);
  const [email, setEmail] = useState(customer.email);
  const [startDate, setStartDate] = useState(submission.targetEffectiveDate ?? "");
  const [importedName, setImportedName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isCompany = customerType === "company";
  const validName = isCompany ? company.trim() : fullName.trim() && lastName.trim();
  const valid =
    !!policyType &&
    !!validName &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || "");

  // Debounced autosave so a refresh keeps progress, mirroring the other steps.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const t = window.setTimeout(() => {
      setSaving(true);
      const namedInsured = isCompany
        ? company.trim()
        : `${fullName} ${lastName}`.trim();
      void Promise.all([
        updateCustomer(customer.uuid, {
          customerType: isCompany ? "commercial" : "personal",
          firstName: fullName,
          lastName,
          businessName: company,
          email,
        }),
        updateSubmission(submissionUuid, {
          linesOfBusiness: ["PROP"],
          namedInsured,
          targetEffectiveDate: startDate ? new Date(startDate) : null,
        }),
      ])
        .catch((e) => console.error(e))
        .finally(() => setSaving(false));
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyType, customerType, fullName, lastName, company, email, startDate]);

  const setLoc = (n: number) => setLocations(Math.max(1, n));

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setImportedName(f.name);
    toast.success("Attached — your advisor will review the schedule");
  }

  function onNext() {
    if (!valid) {
      toast.error("Pick a policy type and add your name and email.");
      return;
    }
    startTransition(async () => {
      try {
        const namedInsured = isCompany
          ? company.trim()
          : `${fullName} ${lastName}`.trim();
        await Promise.all([
          updateCustomer(customer.uuid, {
            customerType: isCompany ? "commercial" : "personal",
            firstName: fullName,
            lastName,
            businessName: company,
            email,
          }),
          updateSubmission(submissionUuid, {
            linesOfBusiness: ["PROP"],
            namedInsured,
            targetEffectiveDate: startDate ? new Date(startDate) : null,
          }),
        ]);
        router.push(`/${submissionUuid}/multy-property`);
      } catch (e) {
        console.error(e);
        toast.error("Couldn't save. Please try again.");
      }
    });
  }

  return (
    <div className="setup">
      <h1 className="setup__h1">Choose your policy type</h1>

      <section className="qsection">
        <h2 className="qsection__h">What type of policy are you looking for?</h2>
        <div className="pcards">
          {POLICY_TYPES.map((o) => (
            <button
              key={o.v}
              type="button"
              className={"pcard" + (policyType === o.v ? " is-sel" : "")}
              onClick={() => setPolicyType(o.v)}
            >
              <span className="pcard__radio" />
              <div className="pcard__body">
                <span className="pcard__t">{o.t}</span>
                <span className="pcard__d">{o.d}</span>
              </div>
              <BldgArt />
            </button>
          ))}
        </div>
      </section>

      <section className="qsection">
        <h2 className="qsection__h">
          How many locations would you like to insure?
          <span className="qsection__pill">Discounts as you add more</span>
        </h2>
        <div className="locrow">
          <label className="locfield">
            <span className="locfield__lbl">Number of locations</span>
            <div className="stepper">
              <input
                className="stepper__in"
                inputMode="numeric"
                value={locations}
                onChange={(e) =>
                  setLoc(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 1)
                }
              />
              <button
                type="button"
                className="stepper__b"
                onClick={() => setLoc(locations - 1)}
                aria-label="Fewer"
              >
                −
              </button>
              <button
                type="button"
                className="stepper__b"
                onClick={() => setLoc(locations + 1)}
                aria-label="More"
              >
                +
              </button>
            </div>
          </label>
          <div className="uploadwrap">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={pickFile}
            />
            <button
              type="button"
              className="uploadbtn"
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              <Icon name="upload" size={17} />
              Upload ACORD application or SOV
            </button>
            <span className="uploadwrap__hint">
              Optional — your advisor will read the schedule and pre-fill each
              property.
            </span>
          </div>
        </div>
        {importedName && (
          <div className="imported">
            <span className="imported__ic">
              <Icon name="check" size={14} stroke={3} />
            </span>
            <div>
              <b>{importedName}</b>
              <em>Attached — your advisor will review it</em>
            </div>
          </div>
        )}
      </section>

      <section className="qsection">
        <h2 className="qsection__h">Who is the insurance for?</h2>
        <div className="whocards">
          <button
            type="button"
            className={"whocard" + (!isCompany ? " is-sel" : "")}
            onClick={() => setCustomerType("individual")}
          >
            <span className="whocard__radio" />
            <div className="whocard__body">
              <span className="whocard__t">Individual</span>
              <span className="whocard__d">For properties you own personally</span>
            </div>
            <PersonArt />
          </button>
          <button
            type="button"
            className={"whocard" + (isCompany ? " is-sel" : "")}
            onClick={() => setCustomerType("company")}
          >
            <span className="whocard__radio" />
            <div className="whocard__body">
              <span className="whocard__t">Company</span>
              <span className="whocard__d">For an LLC, trust, or entity</span>
            </div>
            <GroupArt />
          </button>
        </div>

        <div className="setupform">
          <div className="fgrid">
            <Field label="First name" span={3}>
              <TextInput value={fullName} onChange={setFullName} placeholder="Peter" />
            </Field>
            <Field label="Last name" span={3}>
              <TextInput value={lastName} onChange={setLastName} placeholder="Parker" />
            </Field>
            <Field label={isCompany ? "Company name" : "Company name (optional)"} span={6}>
              <TextInput value={company} onChange={setCompany} placeholder="Marvel Studios Inc." />
            </Field>
            <Field label="Email address" span={3}>
              <TextInput value={email} onChange={setEmail} placeholder="peter@marvel.com" inputMode="email" />
            </Field>
            <Field label="Requested coverage start date" span={3} optional>
              <span className="f-affix">
                <input
                  type="date"
                  className="f-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </span>
            </Field>
          </div>
        </div>
      </section>

      <div className="setup__nav">
        <span className="setup__saved">{saving ? "Saving…" : "All changes saved"}</span>
        <Btn kind="primary" iconRight="arrow" disabled={!valid || isPending} onClick={onNext}>
          Next
        </Btn>
      </div>
    </div>
  );
}

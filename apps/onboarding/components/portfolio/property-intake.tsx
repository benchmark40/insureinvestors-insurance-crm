"use client";

/**
 * Address-first property intake drawer — ported from the Benchmark design's
 * left-panel intake, wired to our Location/Building backend via the portfolio
 * server actions. Stages: address → analyzing → confirm (map + summary cards) →
 * four detail sections (Location · Coverage · Condition · Safety).
 *
 * Per product decision, no premium estimates are shown anywhere — pricing is
 * left to advisor review. Property/risk facts that come from real enrichment
 * are shown; risk scoring we don't compute is labelled "advisor review".
 */

import { useEffect, useRef, useState, useTransition } from "react";

import {
  searchAddresses,
  type AddressSuggestion,
} from "@/lib/actions/addresses";
import {
  confirmPropertyAddress,
  savePropertyDetails,
} from "@/lib/actions/portfolio";
import type { PortfolioProperty } from "@/components/portfolio/property";
import { toBuildingPatch, toLocationPatch } from "@/components/portfolio/property";
import {
  SECTIONS,
  completeness,
  sectionDone,
  type FieldDef,
  type PropertyValues,
  type SectionDef,
} from "@/components/portfolio/schema";

import {
  Btn,
  Field,
  Icon,
  MoneyInput,
  Ring,
  SelectInput,
  TextInput,
  fmtFull,
  num,
} from "./bm-ui";

type Stage = "address" | "analyzing" | "confirm" | "form";

/** Best-effort parse of a typed address when RealEstateAPI has no match. */
function synthSuggestion(text: string): AddressSuggestion {
  const parts = text.split(",").map((s) => s.trim());
  const line1 = parts[0] ?? text;
  const city = parts[1] ?? "";
  const rest = (parts[2] ?? "").split(/\s+/).filter(Boolean);
  const state = (rest[0] ?? "").slice(0, 2).toUpperCase();
  const zipCode = rest[1] ?? "";
  return {
    displayName: text,
    addressLine1: line1,
    city,
    state,
    zipCode,
    county: "",
    latitude: 0,
    longitude: 0,
    propertyId: "",
    house: "",
    street: "",
  };
}

export function PropertyIntake({
  initial,
  index,
  submissionUuid,
  startSectionId,
  onSaved,
  onCancel,
}: {
  initial: PortfolioProperty;
  index: number;
  submissionUuid: string;
  startSectionId?: SectionDef["id"];
  onSaved: (p: PortfolioProperty) => void;
  onCancel: () => void;
}) {
  const [prop, setProp] = useState<PortfolioProperty>(initial);
  const [values, setValues] = useState<PropertyValues>(initial.values);
  const startIdx = startSectionId
    ? Math.max(0, SECTIONS.findIndex((s) => s.id === startSectionId))
    : 0;
  const [stage, setStage] = useState<Stage>(initial.confirmed ? "form" : "address");
  const [active, setActive] = useState(startIdx);
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const set = (k: string, v: string) =>
    setValues((o) => ({ ...o, [k]: v }));

  /** Persist the current property (location + building) and bubble the result. */
  function persist(next: PropertyValues = values) {
    if (!prop.uuid) return;
    setSaving(true);
    startTransition(async () => {
      try {
        const saved = await savePropertyDetails(
          prop.uuid,
          toLocationPatch(next),
          toBuildingPatch(next),
          submissionUuid,
        );
        if (saved) {
          setProp(saved);
          onSaved(saved);
        }
      } finally {
        setSaving(false);
      }
    });
  }

  // Debounced autosave while editing the detail form / confirm cards.
  useEffect(() => {
    if (stage !== "form" && stage !== "confirm") return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persist(values), 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, stage]);

  function runLookup(picked: AddressSuggestion) {
    setStage("analyzing");
    startTransition(async () => {
      const saved = await confirmPropertyAddress(
        prop.uuid,
        picked,
        submissionUuid,
      ).catch(() => null);
      if (saved) {
        setProp(saved);
        setValues(saved.values);
        onSaved(saved);
      }
      setStage("confirm");
    });
  }

  const sections = SECTIONS;
  const cmpl = completeness(values);

  function next() {
    if (active < sections.length - 1) {
      setActive(active + 1);
    } else {
      persist(values);
      onSaved({ ...prop, values });
      onCancel();
    }
  }
  function back() {
    if (active > 0) setActive(active - 1);
    else setStage("confirm");
  }

  return (
    <div className="intake">
      <div className="intake__scrim" onClick={onCancel} />
      <div className="intake__shell">
        {/* ───── LEFT PANEL ───── */}
        <aside className="ipanel">
          <div className="ipanel__top">
            <button type="button" className="ipanel__close" onClick={onCancel}>
              <Icon name="arrowL" size={16} />
              All properties
            </button>
          </div>

          <div className="ipanel__badge">
            <span className="ipanel__num">
              <Icon name="home" size={16} /> Property #{index + 1}
            </span>
          </div>

          <h2 className="ipanel__addr">{prop.line1 || prop.address || "New property"}</h2>
          {(prop.city || prop.region) && (
            <p className="ipanel__sub">
              {[prop.city, prop.region].filter(Boolean).join(", ")}
            </p>
          )}

          {prop.confirmed && (
            <div className="ipanel__facts">
              <span>
                <Icon name="building" size={13} />
                {values.units || 1} units
              </span>
              <span>
                <Icon name="home" size={13} />
                {values.propUse || "—"}
              </span>
              <span>
                <Icon name="ruler" size={13} />
                {values.bldgSqft
                  ? Number(values.bldgSqft).toLocaleString() + " sqft"
                  : "—"}
              </span>
              <span>
                <Icon name="owner" size={13} />
                {values.owner || "Owner TBD"}
              </span>
            </div>
          )}

          <div className="ipanel__money">
            <div>
              <span className="ipanel__mlbl">Total Insured Value</span>
              <b className="ipanel__tiv">{fmtFull(values.tiv)}</b>
            </div>
            <div>
              <span className="ipanel__mlbl">Premium</span>
              <b className="ipanel__prem ipanel__prem--pending">After review</b>
            </div>
          </div>

          {/* section nav */}
          <nav className="inav">
            {sections.map((sec, i) => {
              const done = prop.confirmed && sectionDone(values, sec.id);
              const isActive = stage === "form" && active === i;
              const reachable = prop.confirmed;
              return (
                <button
                  key={sec.id}
                  type="button"
                  className={
                    "inav__item" +
                    (isActive ? " is-active" : "") +
                    (done ? " is-done" : "")
                  }
                  disabled={!reachable}
                  onClick={() => {
                    setStage("form");
                    setActive(i);
                  }}
                >
                  <span className="inav__ic">
                    {done ? (
                      <Icon name="check" size={15} stroke={3} />
                    ) : (
                      <Icon name={sec.icon} size={16} />
                    )}
                  </span>
                  <span className="inav__txt">
                    <b>{sec.title}</b>
                    <em>{sec.blurb}</em>
                  </span>
                  <span className="inav__step">{i + 1}</span>
                </button>
              );
            })}
          </nav>

          {prop.confirmed && (
            <div className="ipanel__progress">
              <Ring value={cmpl.pct} size={30} done={cmpl.pct >= 1} />
              <span>
                {cmpl.filled} of {cmpl.total} fields confirmed
              </span>
            </div>
          )}
        </aside>

        {/* ───── RIGHT CONTENT ───── */}
        <main className="icontent">
          {stage === "address" && <AddressStage onConfirm={runLookup} />}
          {stage === "analyzing" && (
            <AnalyzingStage addr={prop.line1 || prop.address} />
          )}
          {stage === "confirm" && (
            <ConfirmStage
              prop={prop}
              values={values}
              set={set}
              onContinue={() => {
                persist(values);
                setStage("form");
                setActive(0);
              }}
            />
          )}
          {stage === "form" && (
            <FormStage
              section={sections[active]!}
              values={values}
              set={set}
              index={active}
              saving={saving}
              onBack={back}
              onNext={next}
              isLast={active === sections.length - 1}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ───── Address entry ───── */
function AddressStage({
  onConfirm,
}: {
  onConfirm: (picked: AddressSuggestion) => void;
}) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<number | null>(null);

  function onType(v: string) {
    setText(v);
    if (debounce.current) window.clearTimeout(debounce.current);
    if (v.trim().length < 4) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounce.current = window.setTimeout(async () => {
      const res = await searchAddresses(v).catch(() => []);
      setItems(res);
      setOpen(res.length > 0);
    }, 300);
  }

  async function confirm() {
    if (!text.trim()) return;
    setBusy(true);
    let picked = items[0];
    if (!picked) {
      const res = await searchAddresses(text).catch(() => []);
      picked = res[0] ?? synthSuggestion(text);
    }
    setBusy(false);
    onConfirm(picked);
  }

  return (
    <div className="istage istage--address">
      <span className="istage__eyebrow">
        <Icon name="pin" size={13} /> Step 1 · Location
      </span>
      <h1 className="istage__h1">Let&apos;s start with the address</h1>
      <p className="istage__lead">
        Enter the property address and we&apos;ll pull building details and a
        risk profile automatically — you&apos;ll confirm everything before
        continuing.
      </p>
      <div className="addrbox" style={{ position: "relative" }}>
        <span className="addrbox__ic">
          <Icon name="search" size={20} />
        </span>
        <input
          className="addrbox__in"
          autoFocus
          placeholder="145 Brooklyn Ave, Brooklyn, NY 11201"
          value={text}
          autoComplete="new-password"
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void confirm();
            }
          }}
        />
        {open && items.length > 0 && (
          <ul className="addrbox__menu">
            {items.slice(0, 6).map((it, i) => (
              <li
                key={`${it.latitude}-${it.longitude}-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setText(
                    [it.addressLine1, it.city, it.state, it.zipCode]
                      .filter(Boolean)
                      .join(", "),
                  );
                  setOpen(false);
                  onConfirm(it);
                }}
              >
                <Icon name="pin" size={14} />
                <span>
                  <b>{it.addressLine1 || it.displayName.split(",")[0]}</b>
                  <em>
                    {[it.city, it.state, it.zipCode].filter(Boolean).join(", ")}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="addrbox__hint">
        <Icon name="spark" size={14} />
        We use the address to look up year built, size, construction, flood zone
        and protection class.
      </div>
      <Btn
        kind="primary"
        size="lg"
        iconRight="arrow"
        disabled={!text.trim() || busy}
        onClick={confirm}
      >
        Confirm property
      </Btn>
    </div>
  );
}

/* ───── Analyzing ───── */
function AnalyzingStage({ addr }: { addr: string }) {
  return (
    <div className="istage istage--analyze">
      <div className="analyze">
        <div className="analyze__pulse">
          <Icon name="pin" size={26} />
        </div>
        <h2 className="analyze__h">Analyzing the property…</h2>
        <p className="analyze__addr">{addr}</p>
        <ul className="analyze__list">
          <li>
            <Icon name="check" size={14} stroke={3} />
            Matching public property records
          </li>
          <li>
            <Icon name="check" size={14} stroke={3} />
            Estimating replacement cost
          </li>
          <li className="is-running">
            <span className="dot3" />
            Pulling flood &amp; protection-class data
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ───── Confirm: map + summary cards ───── */
function ConfirmStage({
  prop,
  values,
  set,
  onContinue,
}: {
  prop: PortfolioProperty;
  values: PropertyValues;
  set: (k: string, v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="istage istage--confirm">
      <span className="istage__eyebrow istage__eyebrow--ok">
        <Icon name="check" size={13} stroke={3} /> Property found
      </span>
      <h1 className="istage__h1">Confirm the property details</h1>
      <p className="istage__lead">
        Here&apos;s what we pulled for <b>{prop.line1 || prop.address}</b>. Review
        each section and edit anything that looks off before continuing.
      </p>

      <MapCard prop={prop} />

      <div className="summary-grid">
        <LocationSummary values={values} set={set} />
        <RiskSummary />
        <InvestmentSummary prop={prop} />
      </div>

      <div className="confval">
        <div className="confval__est">
          <span className="confval__lbl">Estimated insurable value</span>
          <b>{fmtFull(values.tiv)}</b>
          <em>
            {values.bldgSqft && num(values.tiv)
              ? "≈ $" +
                Math.round(num(values.tiv) / num(values.bldgSqft)) +
                "/sqft · " +
                (values.construction || "—")
              : ""}
          </em>
        </div>
        <Btn kind="primary" size="lg" iconRight="arrow" onClick={onContinue}>
          Continue to details
        </Btn>
      </div>
    </div>
  );
}

function MapCard({ prop }: { prop: PortfolioProperty }) {
  return (
    <div className="mapcard">
      <svg
        className="mapcard__svg"
        viewBox="0 0 760 206"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="760" height="206" fill="#e8edf3" />
        <path
          d="M598 0 H760 V206 H648 C636 150 700 96 612 54 C572 34 588 16 598 0Z"
          fill="#cfe0f2"
        />
        <rect x="44" y="120" width="150" height="120" rx="6" fill="#dceadb" />
        <rect x="470" y="-20" width="120" height="96" rx="6" fill="#dceadb" />
        <g stroke="#d9e0ea" strokeWidth="22">
          <path d="M-10 64 H770" />
          <path d="M-10 150 H630" />
          <path d="M250 -10 V216" />
          <path d="M520 -10 V120" />
          <path d="M120 64 L320 216" />
        </g>
        <g stroke="#ffffff" strokeWidth="15">
          <path d="M-10 64 H770" />
          <path d="M-10 150 H630" />
          <path d="M250 -10 V216" />
          <path d="M520 -10 V120" />
          <path d="M120 64 L320 216" />
        </g>
        <g stroke="#ffd9a8" strokeWidth="6">
          <path d="M-10 64 H770" />
        </g>
        <rect
          x="296"
          y="86"
          width="120"
          height="78"
          rx="4"
          fill="rgba(230,38,110,.13)"
          stroke="#e6266e"
          strokeWidth="2"
        />
        <g fill="#cdd6e3">
          <rect x="70" y="78" width="40" height="30" rx="2" />
          <rect x="158" y="86" width="34" height="26" rx="2" />
          <rect x="560" y="150" width="44" height="34" rx="2" />
          <rect x="640" y="92" width="38" height="30" rx="2" />
        </g>
        <g className="mappin" transform="translate(356 96)">
          <path
            d="M0 56 C-18 32 -20 22 -20 12 A20 20 0 1 1 20 12 C20 22 18 32 0 56Z"
            fill="#e6266e"
          />
          <circle cx="0" cy="12" r="7" fill="#fff" />
        </g>
      </svg>
      <div className="mapcard__addr">
        <Icon name="pin" size={17} />
        <span>
          <b>{prop.line1 || prop.address || "Property location"}</b>
          <br />
          <em>
            {[prop.city, prop.region].filter(Boolean).join(", ") ||
              "Geocoded from address"}
          </em>
        </span>
      </div>
      <span className="mapcard__tag">Map data · Benchmark</span>
    </div>
  );
}

function SummaryCard({
  title,
  icon,
  tinted,
  editable,
  className,
  children,
}: {
  title: string;
  icon?: string;
  tinted?: boolean;
  editable?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [edit, setEdit] = useState(false);
  return (
    <section
      className={
        "scard" +
        (tinted ? " scard--tinted" : "") +
        (className ? " " + className : "")
      }
    >
      <div className="scard__head">
        <span className="scard__title">
          {icon && <Icon name={icon} size={18} />}
          {title}
        </span>
        {editable && (
          <span className="scard__tools">
            <button
              type="button"
              className={"scard__btn" + (edit ? " is-on" : "")}
              title={edit ? "Done editing" : "Edit"}
              onClick={() => setEdit((e) => !e)}
            >
              <Icon name={edit ? "check" : "edit"} size={15} stroke={edit ? 3 : 2} />
            </button>
          </span>
        )}
      </div>
      <div className="scard__body" data-editing={edit ? "1" : "0"}>
        {children}
      </div>
    </section>
  );
}

function SumRow({
  label,
  value,
  display,
  type,
  opts,
  onChange,
  total,
  lock,
  editing,
}: {
  label: string;
  value?: string;
  display: React.ReactNode;
  type?: "text" | "number" | "money" | "select";
  opts?: readonly string[];
  onChange?: (v: string) => void;
  total?: boolean;
  lock?: boolean;
  editing?: boolean;
}) {
  const ctrl =
    type === "money" ? (
      <MoneyInput value={value} onChange={onChange ?? (() => {})} />
    ) : type === "select" ? (
      <SelectInput value={value} opts={opts ?? []} onChange={onChange ?? (() => {})} />
    ) : (
      <TextInput
        value={value}
        onChange={onChange ?? (() => {})}
        mono={type === "number"}
        inputMode={type === "number" ? "numeric" : undefined}
      />
    );
  return (
    <div
      className={
        "srow" + (editing ? " srow--edit" : "") + (total ? " srow--total" : "")
      }
    >
      <span className="srow__l">{label}</span>
      {editing && !lock ? (
        <span className="srow__edit">{ctrl}</span>
      ) : (
        <span className={"srow__v" + (lock ? " srow__muted" : "")}>{display}</span>
      )}
    </div>
  );
}

function LocationSummary({
  values,
  set,
}: {
  values: PropertyValues;
  set: (k: string, v: string) => void;
}) {
  const n = (k: string) => (num(values[k]) ? num(values[k]).toLocaleString() : "—");
  return (
    <SummaryCard title="Location Summary" icon="pin" tinted editable>
      <Editable>
        {(editing) => (
          <>
            <SumRow editing={editing} label="Named Insured" type="text" value={values.owner} display={values.owner || "—"} onChange={(v) => set("owner", v)} />
            <SumRow editing={editing} label="Mortgagee" type="text" value={values.mortgage} display={values.mortgage || "—"} onChange={(v) => set("mortgage", v)} />
            <SumRow editing={editing} label="Property Use" type="text" value={values.propUse} display={values.propUse || "—"} onChange={(v) => set("propUse", v)} />
            <SumRow editing={editing} label="Total Sqft" type="number" value={values.bldgSqft} display={n("bldgSqft")} onChange={(v) => set("bldgSqft", v)} />
            <SumRow editing={editing} label="Year Built" type="number" value={values.yearBuilt} display={values.yearBuilt || "—"} onChange={(v) => set("yearBuilt", v)} />
            <SumRow editing={editing} label="Construction Type" type="text" value={values.construction} display={values.construction || "—"} onChange={(v) => set("construction", v)} />
          </>
        )}
      </Editable>
    </SummaryCard>
  );
}

function InvestmentSummary({ prop }: { prop: PortfolioProperty }) {
  return (
    <SummaryCard title="Investment Metrics" icon="coins" tinted className="scard--invest">
      <SumRow label="Market Value" display={fmtFull(prop.marketValue)} lock />
      <SumRow label="Land Value" display={fmtFull(prop.landValue)} lock />
      <SumRow label="Estimated Equity" display={fmtFull(prop.estimatedEquity)} lock />
      <SumRow label="Mortgage Balance" display={fmtFull(prop.mortgageBalance)} lock />
      <SumRow lock total label="Source" display="RealEstateAPI" />
    </SummaryCard>
  );
}

function RiskSummary() {
  const rows = [
    { icon: "wind", t: "Wind Damage Risk" },
    { icon: "building", t: "Rebuild Cost" },
    { icon: "wave", t: "Flood" },
    { icon: "fire2", t: "Fire & Smoke" },
    { icon: "hand", t: "Crime & Vandalism" },
  ];
  return (
    <SummaryCard title="Risk Summary">
      {rows.map((row, i) => (
        <div key={i} className="rrow">
          <span className="rrow__ic">
            <Icon name={row.icon} size={20} />
          </span>
          <div className="rrow__main">
            <div className="rrow__t">{row.t}</div>
            <div className="rrow__sub">Assessed during advisor review</div>
          </div>
          <div className="rrow__right">
            <span className="dbadge dbadge--low">
              <span className="dbadge__v">—</span>
            </span>
          </div>
        </div>
      ))}
    </SummaryCard>
  );
}

/** Tiny helper that re-exposes a card's edit state to its rows. */
function Editable({
  children,
}: {
  children: (editing: boolean) => React.ReactNode;
}) {
  // The SummaryCard wrapper sets data-editing on .scard__body; we read it via a
  // ref so individual rows can toggle their inline editor.
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const el = ref.current?.closest(".scard__body") as HTMLElement | null;
    if (!el) return;
    const obs = new MutationObserver(() => {
      setEditing(el.getAttribute("data-editing") === "1");
    });
    obs.observe(el, { attributes: true, attributeFilter: ["data-editing"] });
    setEditing(el.getAttribute("data-editing") === "1");
    return () => obs.disconnect();
  }, []);
  return (
    <>
      <div ref={ref} style={{ display: "none" }} />
      {children(editing)}
    </>
  );
}

/* ───── Coverage section (no monthly price shown) ───── */
function CoverageSection({
  values,
  set,
}: {
  values: PropertyValues;
  set: (k: string, v: string) => void;
}) {
  const tiv = num(values.tiv);
  const items: {
    k: string;
    icon: string;
    title: string;
    desc: string;
    rlabel?: string;
    suggest: number;
    persisted?: boolean;
  }[] = [
    {
      k: "lossRents",
      icon: "coins",
      title: "Loss of Rents",
      desc: "Protects your income if tenants have to move out after an insured event.",
      rlabel: "Average Annual Market Rent",
      suggest: Math.round((tiv * 0.08) / 1000) * 1000,
      persisted: true,
    },
    {
      k: "contents",
      icon: "shieldchk",
      title: "Content Coverage",
      desc: "Covers loss or damage to the things in the building that aren't part of the structure.",
      suggest: Math.round((tiv * 0.2) / 1000) * 1000,
    },
    {
      k: "flood",
      icon: "wave",
      title: "Flood Insurance",
      desc: "Covers losses directly caused by flooding.",
      suggest: Math.round(tiv / 1000) * 1000,
    },
  ];

  return (
    <div className="cvsec">
      <div className="cvhero">
        <div className="cvhero__left">
          <h2 className="cvhero__title">
            Select Your Property&apos;s <em>Insurable Value</em>
          </h2>
          <p className="cvhero__sub">
            This is the reconstruction cost, not the market value of your
            building.
          </p>
        </div>
        <div className="cvhero__right">
          <label className="cvvalue">
            <span className="cvvalue__ic">
              <Icon name="shield" size={20} />
            </span>
            <span className="cvvalue__amt">
              $
              <input
                inputMode="numeric"
                value={tiv ? tiv.toLocaleString() : ""}
                onChange={(e) => set("tiv", e.target.value.replace(/[^0-9]/g, ""))}
              />
            </span>
            <span className="cvvalue__pill">Minimum coverage</span>
          </label>
          <span className="cvhero__basis">
            Based on Rebuild Cost Estimate <Icon name="info" size={14} />
          </span>
        </div>
      </div>

      {items.map((it) => {
        const on = values[it.k] != null && num(values[it.k]) > 0;
        const amt = on ? num(values[it.k]) : it.suggest;
        return (
          <div key={it.k} className={"cvcard" + (on ? " is-on" : "")}>
            <span className="cvcard__badge">{on ? "Included" : "Not included"}</span>
            <div className="cvcard__info">
              <span className="cvcard__ic">
                <Icon name={it.icon} size={22} />
              </span>
              <div className="cvcard__main">
                <h4>{it.title}</h4>
                <p>{it.desc}</p>
                {!it.persisted && (
                  <div className="cvcard__risk">
                    <span style={{ color: "var(--ink-3)", fontSize: 12 }}>
                      Captured for your advisor — final pricing after review
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="cvcard__action">
              {it.rlabel && <span className="cvcard__alabel">{it.rlabel}</span>}
              <div className="cvaction">
                <span className="cvaction__val">
                  $
                  <input
                    inputMode="numeric"
                    value={amt ? amt.toLocaleString() : "0"}
                    onChange={(e) =>
                      set(it.k, e.target.value.replace(/[^0-9]/g, ""))
                    }
                    onFocus={() => {
                      if (!on) set(it.k, String(it.suggest));
                    }}
                  />
                </span>
                {on ? (
                  <button
                    type="button"
                    className="cvbtn cvbtn--on"
                    onClick={() => set(it.k, "")}
                  >
                    <Icon name="check" size={14} stroke={3} /> Added
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cvbtn"
                    onClick={() => set(it.k, String(it.suggest))}
                  >
                    Add coverage
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───── Section form ───── */
function FormStage({
  section,
  values,
  set,
  index,
  saving,
  onBack,
  onNext,
  isLast,
}: {
  section: SectionDef;
  values: PropertyValues;
  set: (k: string, v: string) => void;
  index: number;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const cardSection = section.id === "condition" || section.id === "safety";

  return (
    <div className="istage istage--form">
      <div className="istage__formhead">
        <span className="istage__eyebrow">
          <Icon name={section.icon} size={13} /> Step {index + 2} · {section.title}
        </span>
        {section.id !== "coverage" && (
          <h1 className="istage__h1">{section.title}</h1>
        )}
        {section.id !== "coverage" && (
          <p className="istage__lead">{section.blurb}</p>
        )}
      </div>

      <div className="fgroups">
        {section.id === "coverage" ? (
          <CoverageSection values={values} set={set} />
        ) : cardSection ? (
          section.groups.map((g, gi) => (
            <fieldset className="fgroup" key={gi}>
              <legend className="fgroup__h">{g.title}</legend>
              <div className="qgrid">
                {g.fields.map((f) => (
                  <QuestionCard key={f.k} f={f} values={values} set={set} />
                ))}
              </div>
            </fieldset>
          ))
        ) : (
          section.groups.map((g, gi) => (
            <fieldset className="fgroup" key={gi}>
              <legend className="fgroup__h">{g.title}</legend>
              <div className="fgrid">
                {g.fields.map((f) => (
                  <FieldControl key={f.k} f={f} values={values} set={set} />
                ))}
              </div>
            </fieldset>
          ))
        )}
      </div>

      <div className="iform__nav">
        <Btn kind="ghost" icon="arrowL" onClick={onBack}>
          Back
        </Btn>
        <div className="iform__navright">
          <span className="iform__prem">{saving ? "Saving…" : "Saved"}</span>
          <Btn
            kind="primary"
            iconRight={isLast ? "check" : "arrow"}
            onClick={onNext}
          >
            {isLast ? "Save property" : "Continue"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* card-style question (condition / safety) */
function OptionCards({
  value,
  opts,
  onChange,
}: {
  value: string;
  opts: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="optcards">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          className={"optcard" + (value === o ? " is-sel" : "")}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          <span className="optradio" />
          <span>{o}</span>
        </button>
      ))}
    </div>
  );
}

function QArt() {
  return (
    <svg className="qcard__art" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M7 21 24 9.5 41 21"
        stroke="#06b6a8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="11.5" y="20.5" width="25" height="19.5" rx="1.5" stroke="#0a1730" strokeWidth="2.2" />
      <path d="M11.5 27h25M11.5 33.5h25" stroke="#0a1730" strokeWidth="1.4" opacity=".5" />
      <rect x="16" y="23.5" width="4.5" height="2" rx=".5" fill="#06b6a8" />
      <rect x="27.5" y="23.5" width="4.5" height="2" rx=".5" fill="#06b6a8" />
      <rect x="21" y="35" width="6" height="5" fill="#0a1730" />
    </svg>
  );
}

function QuestionCard({
  f,
  values,
  set,
}: {
  f: FieldDef;
  values: PropertyValues;
  set: (k: string, v: string) => void;
}) {
  const val = values[f.k] ?? "";
  const answered = val != null && String(val).trim() !== "";
  let ctrl: React.ReactNode;
  if (f.type === "select") {
    // Short option sets read well as tap-cards; long lists (construction, roof,
    // tenant type, …) would be an unwieldy wall of cards, so use a dropdown.
    const opts = f.opts ?? [];
    ctrl =
      opts.length > 6 ? (
        <div className="optcards optcards--num">
          <SelectInput
            value={val}
            opts={opts}
            onChange={(v) => set(f.k, v)}
            placeholder="Select…"
          />
        </div>
      ) : (
        <OptionCards value={val} opts={opts} onChange={(v) => set(f.k, v)} />
      );
  } else if (f.type === "money") {
    ctrl = (
      <div className="optcards optcards--num">
        <MoneyInput value={val} onChange={(v) => set(f.k, v)} placeholder="0" />
      </div>
    );
  } else {
    ctrl = (
      <div className="optcards optcards--num">
        <TextInput
          value={val}
          onChange={(v) => set(f.k, v)}
          placeholder={f.placeholder}
          suffix={f.suffix}
          inputMode={f.type === "number" ? "numeric" : undefined}
          mono={f.type === "number"}
        />
      </div>
    );
  }
  return (
    <div className={"qcard" + (answered ? " is-answered" : "")}>
      <QArt />
      <h4 className="qcard__title">
        {f.label}
        {f.info && (
          <span className="field__info" title={f.info}>
            <Icon name="info" size={13} />
          </span>
        )}
        <span className="qcard__check">
          <Icon name="check" size={13} stroke={3} />
        </span>
      </h4>
      {ctrl}
      {f.meta && (
        <div className="qcard__foot">
          <SelectInput
            value={values[f.meta.k]}
            opts={f.meta.opts}
            onChange={(v) => set(f.meta!.k, v)}
            placeholder={f.meta.label}
          />
        </div>
      )}
    </div>
  );
}

function FieldControl({
  f,
  values,
  set,
}: {
  f: FieldDef;
  values: PropertyValues;
  set: (k: string, v: string) => void;
}) {
  const val = values[f.k] ?? "";
  const ctrl =
    f.type === "money" ? (
      <MoneyInput value={val} onChange={(v) => set(f.k, v)} placeholder="250,000" />
    ) : f.type === "select" ? (
      <SelectInput value={val} opts={f.opts ?? []} onChange={(v) => set(f.k, v)} />
    ) : (
      <TextInput
        value={val}
        onChange={(v) => set(f.k, v)}
        placeholder={f.placeholder}
        suffix={f.suffix}
        inputMode={f.type === "number" ? "numeric" : undefined}
        mono={f.type === "number"}
      />
    );
  return (
    <Field label={f.label} info={f.info} optional={f.optional} span={f.meta ? 2 : 1}>
      {f.meta ? (
        <div className="field__withmeta">
          {ctrl}
          <div className="field__meta">
            <span className="field__metalbl">{f.meta.label}</span>
            <SelectInput
              value={values[f.meta.k]}
              opts={f.meta.opts}
              onChange={(v) => set(f.meta!.k, v)}
              placeholder="—"
            />
          </div>
        </div>
      ) : (
        ctrl
      )}
    </Field>
  );
}

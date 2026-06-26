"use client";

/**
 * "Properties Added" list — ported from the Benchmark design. Owns the property
 * list, the filter bar, the expandable detail rows, and the address-first intake
 * drawer. Wires to the portfolio server actions; "Proceed to checkout" advances
 * the routed flow to the snapshot/checkout step. No premium figures are shown.
 */

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { addProperty, removeProperty } from "@/lib/actions/portfolio";
import type { PortfolioProperty } from "@/components/portfolio/property";
import {
  SECTIONS,
  completeness,
  type FieldDef,
  type PropertyValues,
  type SectionDef,
} from "@/components/portfolio/schema";

import { Btn, DetailRow, Icon, fmtFull, num } from "./bm-ui";
import { PropertyIntake } from "./property-intake";

type IntakeState = {
  prop: PortfolioProperty;
  startSectionId?: SectionDef["id"];
} | null;

export function PropertiesList({
  submissionUuid,
  initialProperties,
}: {
  submissionUuid: string;
  initialProperties: PortfolioProperty[];
}) {
  const router = useRouter();
  const [props, setProps] = useState<PortfolioProperty[]>(initialProperties);
  const [intake, setIntake] = useState<IntakeState>(null);
  const [filterAddr, setFilterAddr] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [openId, setOpenId] = useState<string | null>(
    initialProperties[0]?.uuid ?? null,
  );
  const [pending, startTransition] = useTransition();

  const owners = useMemo(
    () => [...new Set(props.map((p) => p.values.owner).filter(Boolean))],
    [props],
  );
  const shown = props.filter(
    (p) =>
      (!filterAddr ||
        (p.line1 || p.address || "")
          .toLowerCase()
          .includes(filterAddr.toLowerCase())) &&
      (!filterOwner || p.values.owner === filterOwner),
  );

  const totals = useMemo(() => {
    let tiv = 0;
    let units = 0;
    props.forEach((p) => {
      tiv += num(p.values.tiv);
      units += num(p.values.units) || 1;
    });
    return { count: props.length, tiv, units };
  }, [props]);

  function upsert(p: PortfolioProperty) {
    setProps((list) =>
      list.some((x) => x.uuid === p.uuid)
        ? list.map((x) => (x.uuid === p.uuid ? p : x))
        : [...list, p],
    );
  }

  function onAdd() {
    startTransition(async () => {
      try {
        const created = await addProperty(submissionUuid);
        upsert(created);
        setOpenId(created.uuid);
        setIntake({ prop: created });
      } catch {
        toast.error("Couldn't add a property.");
      }
    });
  }

  function onEdit(uuid: string, sectionId?: SectionDef["id"]) {
    const p = props.find((x) => x.uuid === uuid);
    if (p) setIntake({ prop: p, startSectionId: sectionId });
  }

  function onRemove(uuid: string) {
    const p = props.find((x) => x.uuid === uuid);
    if (
      !confirm(
        `Remove property ${p?.locationNumber ?? ""}? This deletes its building details too.`,
      )
    )
      return;
    startTransition(async () => {
      await removeProperty(uuid, submissionUuid);
      setProps((list) => list.filter((x) => x.uuid !== uuid));
      toast.success("Property removed");
    });
  }

  function onCheckout() {
    if (props.length === 0) {
      toast.error("Add at least one property first.");
      return;
    }
    router.push(`/${submissionUuid}/quoting-snapshot`);
  }

  return (
    <div className="plist">
      <div className="plist__head">
        <div>
          <h1 className="plist__title">Properties Added</h1>
          <p className="plist__sub">
            {totals.count} {totals.count === 1 ? "property" : "properties"} ·{" "}
            {totals.units} units · {fmtFull(totals.tiv)} insured
          </p>
        </div>
        <Btn kind="primary" icon="plus" onClick={onAdd} disabled={pending}>
          Add Property
        </Btn>
      </div>

      {props.length > 0 && (
        <div className="plist__bar">
          <div className="filt">
            <label className="filt__f">
              <span>Filter by address</span>
              <span className="filt__in">
                <Icon name="search" size={14} />
                <input
                  value={filterAddr}
                  placeholder="1000 Main"
                  onChange={(e) => setFilterAddr(e.target.value)}
                />
              </span>
            </label>
            <label className="filt__f">
              <span>Ownership</span>
              <span className="f-selwrap">
                <select
                  className="filt__sel"
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                >
                  <option value="">All owners</option>
                  {owners.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <span className="f-chev">
                  <Icon name="chevron" size={14} />
                </span>
              </span>
            </label>
            {(filterAddr || filterOwner) && (
              <button
                type="button"
                className="filt__reset"
                onClick={() => {
                  setFilterAddr("");
                  setFilterOwner("");
                }}
              >
                <Icon name="arrowL" size={13} />
                Reset
              </button>
            )}
          </div>
          <div className="plist__totstrip">
            <span>
              <em>Total insured value</em>
              <b>{fmtFull(totals.tiv)}</b>
            </span>
          </div>
        </div>
      )}

      {props.length === 0 ? (
        <button type="button" className="pempty" onClick={onAdd}>
          <span className="pempty__ic">
            <Icon name="plus" size={26} />
          </span>
          <span className="pempty__t">Add your first property</span>
          <span className="pempty__d">
            Enter an address — we&apos;ll confirm the building details and risk
            profile for you.
          </span>
        </button>
      ) : (
        <div className="prows">
          {shown.map((p) => (
            <PropertyRow
              key={p.uuid}
              p={p}
              index={props.indexOf(p)}
              open={openId === p.uuid}
              onToggle={() => setOpenId(openId === p.uuid ? null : p.uuid)}
              onEdit={() => onEdit(p.uuid)}
              onEditSection={(sec) => onEdit(p.uuid, sec)}
              onRemove={() => onRemove(p.uuid)}
            />
          ))}
          {shown.length === 0 && (
            <p className="prows__none">No properties match your filters.</p>
          )}
        </div>
      )}

      {props.length > 0 && (
        <div className="plist__foot">
          <button type="button" className="plist__back" onClick={onAdd}>
            <Icon name="plus" size={14} />
            Add another property
          </button>
          <Btn kind="accent" size="lg" iconRight="arrow" onClick={onCheckout}>
            Proceed to Checkout
          </Btn>
        </div>
      )}

      {intake && (
        <PropertyIntake
          initial={intake.prop}
          index={props.findIndex((x) => x.uuid === intake.prop.uuid)}
          submissionUuid={submissionUuid}
          startSectionId={intake.startSectionId}
          onSaved={upsert}
          onCancel={() => setIntake(null)}
        />
      )}
    </div>
  );
}

function StripFact({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="sfact">
      <span className="sfact__ic">
        <Icon name={icon} size={15} />
      </span>
      <div>
        <span className="sfact__l">{label}</span>
        <span className="sfact__v">{value}</span>
      </div>
    </div>
  );
}

function formatVal(f: FieldDef, p: PropertyValues): { text: string; empty: boolean } {
  const raw = p[f.k];
  if (f.type === "coverage") {
    const on = raw != null && String(raw) !== "" && num(raw) > 0;
    return on
      ? { text: fmtFull(raw), empty: false }
      : { text: "Not included", empty: true };
  }
  if (raw == null || String(raw).trim() === "") return { text: "—", empty: true };
  if (f.type === "money") return { text: fmtFull(raw), empty: false };
  if (f.suffix) return { text: Number(raw).toLocaleString() + " " + f.suffix, empty: false };
  return { text: String(raw), empty: false };
}

function PropertyRow({
  p,
  index,
  open,
  onToggle,
  onEdit,
  onEditSection,
  onRemove,
}: {
  p: PortfolioProperty;
  index: number;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEditSection: (sec: SectionDef["id"]) => void;
  onRemove: () => void;
}) {
  const cmpl = completeness(p.values);
  const incomplete = cmpl.pct < 1;
  const v = p.values;
  return (
    <article className={"prow" + (open ? " is-open" : "")}>
      <header className="prow__head" onClick={onToggle}>
        <div className="prow__id">
          <span className="prow__badge">
            <Icon name="home" size={14} />
            Property #{index + 1}
          </span>
          <div className="prow__addr">
            <h3>{p.line1 || p.address || "Untitled property"}</h3>
            <p>{[p.city, p.region].filter(Boolean).join(", ") || "Location pending"}</p>
          </div>
        </div>
        <div className="prow__tools" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="prow__tool prow__tool--danger"
            title="Remove"
            onClick={onRemove}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
        <div className="prow__prem">
          <div>
            <span>Insured value</span>
            <b>{fmtFull(v.tiv)}</b>
          </div>
          <div>
            <span>Premium</span>
            <b className="prow__annual prow__annual--pending">After review</b>
          </div>
        </div>
      </header>

      <div className="prow__strip">
        <StripFact icon="owner" label="Property Ownership" value={v.owner || "—"} />
        <StripFact icon="home" label="Property Use" value={v.propUse || "—"} />
        <StripFact icon="shield" label="Insurable Value" value={fmtFull(v.tiv)} />
        <StripFact
          icon="ruler"
          label="Total Building SqFt"
          value={v.bldgSqft ? Number(v.bldgSqft).toLocaleString() + " sq ft" : "—"}
        />
        <div className="prow__strip-cta">
          {incomplete ? (
            <button type="button" className="prow__continue" onClick={onEdit}>
              Answer remaining questions
              <Icon name="arrow" size={13} />
            </button>
          ) : (
            <span className="prow__ready">
              <Icon name="check" size={13} stroke={3} />
              All questions answered
            </span>
          )}
          <button type="button" className="prow__expand" onClick={onToggle}>
            <Icon name="chevron" size={18} className={open ? "rot180" : ""} />
          </button>
        </div>
      </div>

      {open && (
        <div className="prow__body">
          {SECTIONS.map((sec) => (
            <section className="dsec" key={sec.id}>
              <div className="dsec__h">
                <h4>
                  <Icon name={sec.icon} size={14} />
                  {sec.title}
                </h4>
                <button
                  type="button"
                  className="dsec__edit"
                  onClick={() => onEditSection(sec.id)}
                >
                  <Icon name="edit" size={13} />
                  Edit section
                </button>
              </div>
              {sec.groups.map((g, gi) => (
                <div className="dgroup" key={gi}>
                  <h5 className="dgroup__h">{g.title}</h5>
                  <div className="drows">
                    {g.fields.map((f) => {
                      const val = formatVal(f, v);
                      const sub = f.meta ? v[f.meta.k] : null;
                      return (
                        <DetailRow
                          key={f.k}
                          label={f.label}
                          value={val.text}
                          empty={val.empty}
                          sub={sub}
                          info={f.info}
                          onEdit={() => onEditSection(sec.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

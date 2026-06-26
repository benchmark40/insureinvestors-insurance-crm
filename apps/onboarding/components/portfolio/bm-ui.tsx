"use client";

/**
 * Shared design primitives for the Property Portfolio Quote flow.
 * Ported from the Benchmark "Property Portfolio Quote" design (shared-UI module)
 * into typed client components. Styling comes from app/portfolio.css (scoped to
 * the `.bmflow` wrapper). These render the design's exact class names so the look
 * matches the source 1:1 — only the data wiring is ours.
 */

import * as React from "react";

/* ---- Brand logo ---------------------------------------------------------- */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={"bm-logo" + (light ? " bm-logo--light" : "")}>
      <span className="bm-logo__tile">
        <span className="bm-logo__sq" />
      </span>
      <span className="bm-logo__word">
        Bench<span className="bm-accent">mark</span>
      </span>
    </div>
  );
}

/* ---- Icons --------------------------------------------------------------- */
export const ICON_PATHS: Record<string, string> = {
  pin: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  building:
    '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  owner: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  ruler:
    '<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z"/>',
  shieldchk:
    '<path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z"/><path d="m9 11.5 2 2 4-4.5"/>',
  flame:
    '<path d="M12 3c1 3 4 4.2 4 8a4 4 0 0 1-8 0c0-1.4.5-2.2 1.2-3 .2 1 .8 1.6 1.6 1.8C10.4 8 11 6 12 3Z"/>',
  coins:
    '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M15 11.5c2.8.3 6 1.5 6 3.5 0 1.7-2.7 3-6 3-1.4 0-2.7-.2-3.7-.6"/>',
  wave: '<path d="M3 8c2 0 2 2 4.5 2S10 8 12 8s2 2 4.5 2S19 8 21 8"/><path d="M3 13c2 0 2 2 4.5 2S10 13 12 13s2 2 4.5 2S19 13 21 13"/><path d="M3 18c2 0 2 2 4.5 2S10 18 12 18s2 2 4.5 2S19 18 21 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  edit: '<path d="M14 4 18 8 8 18l-4 1 1-4 9-9Z"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  print: '<path d="M7 8V3h10v5M7 17H4v-6h16v6h-3M7 14h10v6H7z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  spark:
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  drop: '<path d="M12 3c3 4 6 7 6 10a6 6 0 0 1-12 0c0-3 3-6 6-10Z"/>',
  fire2:
    '<path d="M9 3c2 3 1 5 3 6 1-1 1-2 1-3 2 2 3 4 3 6a6 6 0 0 1-12 0c0-3 2-6 5-9Z"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  gauge:
    '<path d="M5 18a8 8 0 1 1 14 0"/><path d="m12 14 4-4"/><circle cx="12" cy="14" r="1.2"/>',
  wind: '<path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12h14a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16h8a2.2 2.2 0 1 1-2.2 2.2"/>',
  hand: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2.2-3a1.6 1.6 0 0 1 2.5-2L8 14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>',
};

export function Icon({
  name,
  size = 20,
  stroke = 2,
  className,
}: {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }}
    />
  );
}

/* ---- Buttons ------------------------------------------------------------- */
type BtnKind = "primary" | "accent" | "teal" | "ghost" | "navghost";
export function Btn({
  kind = "primary",
  onClick,
  disabled,
  children,
  icon,
  iconRight,
  className = "",
  size,
  type = "button",
}: {
  kind?: BtnKind;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  icon?: string;
  iconRight?: string;
  className?: string;
  size?: "lg";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`btn btn--${kind} ${size ? "btn--" + size : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={17} />}
    </button>
  );
}

/* ---- Form inputs --------------------------------------------------------- */
export function TextInput({
  value,
  onChange,
  placeholder,
  error,
  suffix,
  inputMode,
  mono,
  onEnter,
  onBlur,
  name,
  id,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  suffix?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  mono?: boolean;
  onEnter?: () => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
}) {
  return (
    <span className={"f-affix" + (suffix ? " has-suffix" : "")}>
      <input
        id={id}
        name={name}
        className={
          "f-input" + (error ? " is-err" : "") + (mono ? " is-mono" : "")
        }
        value={value ?? ""}
        placeholder={placeholder}
        inputMode={inputMode}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {suffix && <span className="f-suffix">{suffix}</span>}
    </span>
  );
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  error,
  onBlur,
}: {
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  onBlur?: () => void;
}) {
  const display =
    value === "" || value == null
      ? ""
      : Number(String(value).replace(/[^0-9.]/g, "")).toLocaleString();
  return (
    <span className="f-affix has-prefix">
      <span className="f-prefix">$</span>
      <input
        className={"f-input is-mono" + (error ? " is-err" : "")}
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={onBlur}
      />
    </span>
  );
}

export function SelectInput({
  value,
  onChange,
  opts,
  placeholder,
  error,
  onBlur,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  opts: readonly string[];
  placeholder?: string;
  error?: boolean;
  onBlur?: () => void;
}) {
  // Always show the current value even if it's off-list (e.g. from enrichment).
  const list =
    value && !opts.includes(value) ? [value, ...opts] : (opts as string[]);
  return (
    <span className="f-selwrap">
      <select
        className={
          "f-input f-select" + (error ? " is-err" : "") + (value ? "" : " is-ph")
        }
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      >
        <option value="" disabled>
          {placeholder || "Select…"}
        </option>
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="f-chev">
        <Icon name="chevron" size={15} />
      </span>
    </span>
  );
}

export function Field({
  label,
  info,
  optional,
  error,
  children,
  span,
}: {
  label?: string;
  info?: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <label
      className="field"
      style={span ? { gridColumn: `span ${span}` } : undefined}
    >
      {label && (
        <span className="field__label">
          {label}
          {info && (
            <span className="field__info" title={info}>
              <Icon name="info" size={12} />
            </span>
          )}
          {optional && <em className="field__opt">optional</em>}
        </span>
      )}
      {children}
      {error && (
        <span className="field__error">
          <Icon name="alert" size={12} /> {error}
        </span>
      )}
    </label>
  );
}

/* segmented choice (for short option sets) */
export function Segments({
  value,
  onChange,
  opts,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: readonly string[];
}) {
  return (
    <div className="seg">
      {opts.map((o) => (
        <button
          type="button"
          key={o}
          className={"seg__b" + (value === o ? " is-sel" : "")}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---- Completeness ring --------------------------------------------------- */
export function Ring({
  value,
  size = 34,
  done,
}: {
  value: number;
  size?: number;
  done?: boolean;
}) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value);
  return (
    <span
      className={"ring" + (done ? " ring--done" : "")}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring__bg"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring__fg"
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring__txt">
        {done ? <Icon name="check" size={14} stroke={3} /> : Math.round(value * 100)}
      </span>
    </span>
  );
}

/* ---- Detail row (label · value · check · edit) --------------------------- */
export function DetailRow({
  label,
  value,
  sub,
  onEdit,
  info,
  empty,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  onEdit?: () => void;
  info?: string;
  empty?: boolean;
}) {
  return (
    <div className={"drow" + (empty ? " drow--empty" : "")}>
      <span className="drow__label">
        {label}
        {info && (
          <span className="drow__info" title={info}>
            <Icon name="info" size={11} />
          </span>
        )}
      </span>
      <div className="drow__right">
        {sub && <span className="drow__sub">{sub}</span>}
        <span className="drow__value">{value}</span>
        {!empty && (
          <span className="drow__check">
            <Icon name="check" size={13} stroke={3} />
          </span>
        )}
        {onEdit && (
          <button type="button" className="drow__edit" onClick={onEdit}>
            <Icon name="edit" size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Money formatting helpers (ported from the design) ------------------- */
export function fmtFull(n: unknown): string {
  if (n == null || n === "" || isNaN(Number(n))) return "—";
  return "$" + Math.round(Number(n)).toLocaleString();
}
export function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

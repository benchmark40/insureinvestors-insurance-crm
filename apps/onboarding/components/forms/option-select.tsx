"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ensureOpt } from "@insureinvestorsv2/lib/src/building-options";

type Props = {
  id?: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  /** Fired with the chosen value. */
  onValueChange: (next: string) => void;
};

/**
 * A plain string-list dropdown. Tolerant of off-list values: whatever is
 * currently stored (e.g. a RealEstateAPI-enriched value) is always shown as an
 * option via `ensureOpt`, so it stays selectable and visible.
 */
export function OptionSelect({
  id,
  value,
  options,
  placeholder = "Select…",
  onValueChange,
}: Props) {
  const opts = ensureOpt(value, options);
  return (
    <Select
      value={value || null}
      onValueChange={(next) => onValueChange((next as string) ?? "")}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder}>
          {(v) => (v as string) || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

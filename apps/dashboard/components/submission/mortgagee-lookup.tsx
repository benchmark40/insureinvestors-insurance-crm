"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Building, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  type MortgageeSuggestion,
  searchMortgagees,
} from "@/lib/actions/mortgagees";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  /** Called when the user picks a mortgagee from the list. */
  onPick: (mortgagee: MortgageeSuggestion) => void;
  /** Saved when the field is left (caller's autosave hook). */
  onCommit?: () => void;
  placeholder?: string;
};

export function MortgageeLookup({
  id,
  value,
  onChange,
  onPick,
  onCommit,
  placeholder = "Search mortgagees…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MortgageeSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const blurRef = useRef<number | null>(null);
  const listId = useId();

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (blurRef.current) window.clearTimeout(blurRef.current);
    };
  }, []);

  function search(q: string) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchMortgagees(q);
        setItems(results);
        setActiveIndex(-1);
        setOpen(true);
      });
    }, 250);
  }

  function pick(item: MortgageeSuggestion) {
    onChange(item.name);
    // onPick persists the full clause itself — don't also fire onCommit/save(),
    // which would run with a stale closure value and clobber it with the
    // half-typed query on the next save race.
    onPick(item);
    setItems([]);
    setActiveIndex(-1);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const picked = items[activeIndex];
      if (picked) pick(picked);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open && (isPending || items.length > 0 || value.trim().length >= 2);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className="h-9"
        onChange={(e) => {
          onChange(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Delay close so a mousedown on a suggestion is handled first.
          blurRef.current = window.setTimeout(() => {
            setOpen(false);
            onCommit?.();
          }, 150);
        }}
      />
      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="bg-popover absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg p-1 text-sm shadow-md ring-1 ring-foreground/10"
        >
          {isPending && items.length === 0 ? (
            <li className="text-muted-foreground flex items-center justify-center gap-2 py-6">
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </li>
          ) : items.length === 0 ? (
            <li className="text-muted-foreground py-6 text-center">
              {value.trim().length < 2
                ? "Keep typing the mortgagee name…"
                : "No matches. Type more or enter it manually."}
            </li>
          ) : (
            items.map((item, idx) => (
              <li
                key={`${item.name}-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                // mousedown (not click) so it fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5",
                  idx === activeIndex && "bg-muted text-foreground",
                )}
              >
                <Building className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                <div className="grid gap-0.5">
                  <span className="font-medium">{item.name}</span>
                  {(item.city || item.state) && (
                    <span className="text-muted-foreground text-xs">
                      {[item.address, item.city, item.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  type AddressSuggestion,
  searchAddresses,
} from "@/lib/actions/addresses";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  /** Called when the user picks a suggestion. Receives the full structured address. */
  onPick: (address: AddressSuggestion) => void;
  /** Saved when a pick is made or the field is left (caller's autosave hook). */
  onCommit?: () => void;
  placeholder?: string;
};

export function AddressLookup({
  id,
  name,
  value,
  onChange,
  onPick,
  onCommit,
  placeholder = "Start typing an address…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AddressSuggestion[]>([]);
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
    if (q.trim().length < 4) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchAddresses(q);
        setItems(results);
        setActiveIndex(-1);
        setOpen(true);
      });
    }, 300);
  }

  function pick(item: AddressSuggestion) {
    onPick(item);
    setItems([]);
    setActiveIndex(-1);
    setOpen(false);
    onCommit?.();
    inputRef.current?.blur();
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
      // Only intercept Enter when a suggestion is highlighted — otherwise let
      // the form handle it. Stops an accidental form submit mid-selection.
      e.preventDefault();
      const picked = items[activeIndex];
      if (picked) pick(picked);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open && (isPending || items.length > 0 || value.trim().length >= 4);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        // Chrome ignores autocomplete="off" on address-shaped fields and overlays
        // its own autofill dropdown on top of our suggestions. On a text input,
        // "new-password" reliably suppresses that address autofill (no password
        // UI, since the field isn't type=password). The data-* hints do the same
        // for 1Password / LastPass / Dashlane.
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        value={value}
        placeholder={placeholder}
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
              {value.trim().length < 4
                ? "Keep typing the address…"
                : "No matches. Type more or fill in manually."}
            </li>
          ) : (
            items.map((item, idx) => (
              <li
                key={`${item.latitude}-${item.longitude}-${idx}`}
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
                <MapPin className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                <div className="grid gap-0.5">
                  <span className="font-medium">
                    {item.addressLine1 || item.displayName.split(",")[0]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {[item.city, item.state, item.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

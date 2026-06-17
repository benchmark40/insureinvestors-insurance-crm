"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  /** Matcher for dates that can't be selected (e.g. `{ before: today }`). */
  disabled?: React.ComponentProps<typeof Calendar>["disabled"];
};

function formatDisplay(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  ariaInvalid,
  ariaDescribedBy,
  disabled,
}: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            nativeButton
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {value ? formatDisplay(value) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

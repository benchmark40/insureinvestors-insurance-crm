import type { ChangeEvent } from "react";

/**
 * Detects a browser-autofill (or otherwise programmatic) change.
 *
 * Inline edit fields in this app persist on blur, not on every keystroke. That
 * breaks Chrome autofill: picking a suggestion fills several fields at once, but
 * only the field you triggered it from ever receives focus/blur — the rest show
 * the value yet never save. Real keystrokes carry an `inputType`
 * ("insertText", "insertFromPaste", "deleteContentBackward", …); autofill and
 * programmatic value changes fire an `input` event with no `inputType`. Treat
 * that as a signal to commit immediately so autofilled values are recorded.
 */
export function isAutofillChange(e: ChangeEvent<HTMLInputElement>): boolean {
  return !(e.nativeEvent as InputEvent).inputType;
}

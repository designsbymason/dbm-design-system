import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "./DatePicker";
import type { DatePickerProps } from "./DatePicker.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering. The
// calendar's own clock (today) is read after the first commit, so the first client render matches the server's.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const variants: Array<[string, Partial<DatePickerProps>]> = [
  ["empty", {}],
  ["with a value", { defaultValue: "2026-10-03", clearable: true }],
  ["open by default", { defaultOpen: true, defaultValue: "2026-10-03" }],
  ["open with nothing chosen", { defaultOpen: true }],
  ["controlled open", { open: true, value: "2026-10-03", onValueChange: () => undefined }],
  ["named and required", { name: "when", required: true }],
  ["day first", { format: "dmy", separator: ".", defaultValue: "2026-10-03" }],
  ["right to left", { dir: "rtl", defaultOpen: true, format: "ymd" }],
  ["with bounds and an unavailable rule", { min: "2026-10-01", max: "2026-10-31", isDateDisabled: (date) => date.endsWith("-10"), defaultValue: "2026-10-10" }],
  ["translated digits", { formatNumber: (n) => String.fromCodePoint(0x660 + n), defaultValue: "2026-10-03" }],
  ["by month", { granularity: "month", defaultValue: "2026-10", min: "today" }],
  ["by month, open", { granularity: "month", defaultValue: "2026-10", defaultOpen: true, presets: [{ label: "Next", value: "2026-11" }] }],
  ["today as a bound", { min: "today", max: "2030-01-01", defaultValue: "2026-10-03" }],
  ["presets that ask for today", { defaultOpen: true, presets: [{ label: "Soon", value: (today: string) => today }] }],
  ["a reason and a side", { defaultOpen: true, side: "top", align: "center", unavailableReason: (date: string) => (date.endsWith("-10") ? "Booked" : undefined) }],
  ["full width", { defaultOpen: true, presentation: "full-width" }],
  ["a responsive presentation", { defaultOpen: true, presentation: { base: "full-width", sm: "anchored" } }],
  ["a today and a calendar option", { today: "2026-10-16", showTodayButton: true, defaultOpen: true, calendarProps: { showWeekNumbers: true } }],
];

describe("DatePicker on the server and in hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<DatePicker aria-label="When" {...props} />));
    expect(html).toContain('role="group"');
  });

  it.each(variants)("hydrates %s over its server HTML without a mismatch", async (_name, props) => {
    const markup = <DatePicker aria-label="When" {...props} />;
    const html = onTheServer(() => renderToString(markup));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await act(async () => {
      hydrateRoot(container, markup, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(screen.getByRole("group", { name: "When" })).toBeInTheDocument();
    container.remove();
  });
});

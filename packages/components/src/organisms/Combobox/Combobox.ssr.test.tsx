import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";
import type { ComboboxProps } from "./Combobox.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const options = [
  { value: "a", label: "Alpha", group: "Letters" },
  { value: "b", label: "Beta", group: "Letters" },
  { value: "1", label: "One", description: "The first" },
];

const variants: Array<[string, Partial<ComboboxProps>]> = [
  ["closed", {}],
  ["open by default", { defaultOpen: true }],
  ["controlled open", { open: true, defaultValue: "b" }],
  ["with a value", { defaultValue: "a", clearable: true }],
  ["named and required", { name: "pick", required: true }],
  ["loading and in error", { defaultOpen: true, loading: true, error: true }],
  ["right to left", { defaultOpen: true, dir: "rtl" }],
  ["a custom value", { allowCustomValue: true, defaultValue: "free text" }],
];

describe("Combobox on the server and in hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Combobox aria-label="Pick" options={options} {...props} />));
    expect(html).toContain('role="combobox"');
  });

  it.each(variants)("hydrates %s over its server HTML without a mismatch", async (_name, props) => {
    const markup = <Combobox aria-label="Pick" options={options} {...props} />;
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
    expect(screen.getByRole("combobox", { name: "Pick" })).toBeInTheDocument();
    container.remove();
  });
});

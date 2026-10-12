import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";
import type { ToastProviderProps } from "./Toast.types";

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

function Tree({ provider, declared }: { provider?: Omit<ToastProviderProps, "children">; declared?: boolean }) {
  return (
    <Toast.Provider {...provider}>
      <p>The app</p>
      {declared && (
        <Toast tone="success" defaultOpen>
          <Toast.Title>Saved</Toast.Title>
          <Toast.Description>Your changes are live.</Toast.Description>
          <Toast.Action altText="Open it from the list">View</Toast.Action>
        </Toast>
      )}
    </Toast.Provider>
  );
}

const variants: Array<[string, Parameters<typeof Tree>[0]]> = [
  ["a bare provider", {}],
  ["every placement", { provider: { placement: "top-start" } }],
  ["a responsive placement", { provider: { placement: { base: "bottom", md: "top-end" } } }],
  ["right to left", { provider: { dir: "rtl", placement: "bottom-start" } }],
  ["a limit and a variant", { provider: { limit: 1, variant: "solid", size: "lg", duration: null } }],
  ["a declared toast", { declared: true }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Toast on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    expect(html).toContain("The app");
    // the region and its toasts are drawn into the body after mount, so none of it is on the server
    expect(html).not.toContain('role="region"');
    expect(html).not.toContain("Saved");
  });
});

describe("Toast hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch, and draws the region", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    let root!: ReturnType<typeof hydrateRoot>;
    // React 19 reports a hydration mismatch through this callback (and recovers by redrawing), not console.error.
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <Tree {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
      expect(await screen.findByRole("region", { hidden: true, name: /notifications/i })).toBeInTheDocument();
      if (props.declared) expect(await screen.findByText("Saved")).toBeInTheDocument();
      expect(recoverable).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
    error.mockRestore();
    warn.mockRestore();
  });
});

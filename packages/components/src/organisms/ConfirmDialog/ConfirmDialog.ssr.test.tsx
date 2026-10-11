import { act, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ConfirmDialogProps } from "./ConfirmDialog.types";

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

function Tree(props: Partial<ConfirmDialogProps>) {
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">Delete</Button>}
      title="Delete project?"
      description="It cannot be undone."
      labels={{ confirm: "Delete", cancel: "Keep it" }}
      {...props}
    />
  );
}

const variants: Array<[string, Partial<ConfirmDialogProps>]> = [
  ["closed", {}],
  ["open by default", { defaultOpen: true }],
  ["controlled open", { open: true }],
  ["info tone", { defaultOpen: true, tone: "info" }],
  ["danger tone, no icon", { defaultOpen: true, tone: "danger", icon: false }],
  ["with a body", { defaultOpen: true, children: <p>Three files.</p> }],
  ["type to confirm", { defaultOpen: true, requireText: "Atlas" }],
  ["with a don't-ask-again box", { defaultOpen: true, dontAskAgain: { key: "ssr-box" } }],
  ["held back for a moment", { defaultOpen: true, confirmDelay: 4000 }],
  ["a larger title, focus on confirm, own buttons", { defaultOpen: true, titleSize: "3xl", initialFocus: "confirm", confirmProps: { variant: "primary" }, cancelProps: { variant: "ghost" } }],
  ["type to confirm, any capitalisation", { defaultOpen: true, requireText: "Atlas", requireTextMatch: "ignore-case" }],
  ["busy with a scrim", { defaultOpen: true, busy: true, scrimBlur: true, scrimOpacity: 80 }],
  ["extra small, escape off, no nudge", { defaultOpen: true, size: "xs", closeOnEscape: false, nudge: false }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ConfirmDialog on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    // the trigger is server-rendered; the panel is portaled after mount, so it is not
    expect(html).toContain("Delete");
    expect(html).not.toContain('role="alertdialog"');
  });
});

describe("ConfirmDialog hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch, and opens", async (_name, props) => {
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
      const opensByDefault = Boolean(props.defaultOpen || props.open);
      if (opensByDefault) {
        expect(await screen.findByRole("alertdialog", { hidden: true })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      }
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

describe("ConfirmDialog remembered, hydrating", () => {
  afterEach(() => window.localStorage.clear());

  // The server can't read the browser's storage, so it draws what it would for a first-time visitor; the browser
  // then finds the choice remembered. Hydration must match the server's HTML, and only then answer.
  it.each([
    ["by default open", { defaultOpen: true }],
    ["controlled open", { open: true }],
  ] as const)("hydrates %s with no mismatch, then answers once and draws no dialog", async (_name, extra) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const html = onTheServer(() =>
      renderToString(<Tree {...extra} dontAskAgain={{ key: "ssr-remembered" }} />),
    );
    window.localStorage.setItem("dbm-dismissed:ssr-remembered", "0");
    const onConfirm = vi.fn();
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const recoverable: string[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(
        container,
        <Tree {...extra} dontAskAgain={{ key: "ssr-remembered" }} onConfirm={onConfirm} />,
        { onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)) },
      );
    });
    try {
      await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(recoverable).toEqual([]);
      expect(error).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      error.mockRestore();
    }
  });
});

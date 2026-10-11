import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { Dialog } from "./Dialog";
import type { DialogContentProps, DialogProps } from "./Dialog.types";

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

function Tree({
  root,
  content,
}: {
  root?: Omit<DialogProps, "children">;
  content?: DialogContentProps;
}) {
  return (
    <Dialog {...root}>
      <Dialog.Trigger asChild>
        <Button>Open</Button>
      </Dialog.Trigger>
      <Dialog.Content {...content}>
        <Dialog.Header>
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>Changes are saved.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <input aria-label="Name" />
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close>Cancel</Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

const variants: Array<[string, Parameters<typeof Tree>[0]]> = [
  ["closed", {}],
  ["open by default", { root: { defaultOpen: true } }],
  ["controlled open", { root: { open: true } }],
  ["non-modal and open", { root: { defaultOpen: true, modal: false } }],
  ["kept mounted, closed", { content: { keepMounted: true } }],
  [
    "kept mounted and open",
    { root: { defaultOpen: true }, content: { keepMounted: true } },
  ],
  [
    "full screen on a phone, top placed, auto-divided",
    {
      root: { defaultOpen: true },
      content: {
        fullScreen: { base: true, md: false },
        placement: "top",
        divided: "auto",
      },
    },
  ],
  [
    "busy with a scrim",
    {
      root: { defaultOpen: true },
      content: { busy: true, scrimBlur: true, scrimOpacity: 80 },
    },
  ],
  [
    "named only by aria-label",
    { root: { defaultOpen: true }, content: { "aria-label": "Labelled" } },
  ],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Dialog on the server", () => {
  it.each(variants)(
    "renders %s without touching window or document",
    (_name, props) => {
      const html = onTheServer(() => renderToString(<Tree {...props} />));
      expect(typeof html).toBe("string");
      // the trigger is server-rendered; the panel is portaled after mount, so it is not
      expect(html).toContain("Open");
      expect(html).not.toContain('role="dialog"');
    },
  );

  it("creates no element for keepMounted while there is no document", () => {
    expect(() =>
      onTheServer(() =>
        renderToString(
          <Tree root={{ defaultOpen: true }} content={{ keepMounted: true }} />,
        ),
      ),
    ).not.toThrow();
  });
});

describe("Dialog hydrating", () => {
  it.each(variants)(
    "hydrates %s without a mismatch, and opens",
    async (_name, props) => {
      const error = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const warn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const html = onTheServer(() => renderToString(<Tree {...props} />));
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      let root!: ReturnType<typeof hydrateRoot>;
      // React 19 reports a hydration mismatch through this callback (and recovers by redrawing), not console.error.
      const recoverable: string[] = [];
      await act(async () => {
        root = hydrateRoot(container, <Tree {...props} />, {
          onRecoverableError: (caught) =>
            recoverable.push(String((caught as Error).message).slice(0, 400)),
        });
      });
      try {
        const opensByDefault = Boolean(
          props.root?.defaultOpen || props.root?.open,
        );
        if (opensByDefault)
          expect(
            await screen.findByRole("dialog", { hidden: true }),
          ).toBeInTheDocument();
        else expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(recoverable).toEqual([]);
        expect(error).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
      error.mockRestore();
      warn.mockRestore();
    },
  );
});

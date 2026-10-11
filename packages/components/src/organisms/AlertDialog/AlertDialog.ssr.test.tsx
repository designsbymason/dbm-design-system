import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { AlertDialog } from "./AlertDialog";
import type {
  AlertDialogContentProps,
  AlertDialogProps,
} from "./AlertDialog.types";

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
  root?: Omit<AlertDialogProps, "children">;
  content?: AlertDialogContentProps;
}) {
  return (
    <AlertDialog {...root}>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content {...content}>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>
            It cannot be undone.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <input aria-label="Name" />
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

const variants: Array<[string, Parameters<typeof Tree>[0]]> = [
  ["closed", {}],
  ["open by default", { root: { defaultOpen: true } }],
  ["controlled open", { root: { open: true } }],
  [
    "neutral tone",
    { root: { defaultOpen: true }, content: { tone: "neutral" } },
  ],
  ["info tone", { root: { defaultOpen: true }, content: { tone: "info" } }],
  [
    "warning tone",
    { root: { defaultOpen: true }, content: { tone: "warning" } },
  ],
  [
    "danger tone, no icon",
    { root: { defaultOpen: true }, content: { tone: "danger", icon: false } },
  ],
  [
    "busy with a scrim",
    {
      root: { defaultOpen: true },
      content: { busy: true, scrimBlur: true, scrimOpacity: 80 },
    },
  ],
  [
    "extra small, escape off, no nudge",
    {
      root: { defaultOpen: true },
      content: { size: "xs", closeOnEscape: false, nudge: false },
    },
  ],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AlertDialog on the server", () => {
  it.each(variants)(
    "renders %s without touching window or document",
    (_name, props) => {
      const html = onTheServer(() => renderToString(<Tree {...props} />));
      expect(typeof html).toBe("string");
      // the trigger is server-rendered; the panel is portaled after mount, so it is not
      expect(html).toContain("Delete");
      expect(html).not.toContain('role="alertdialog"');
    },
  );
});

describe("AlertDialog hydrating", () => {
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
            await screen.findByRole("alertdialog", { hidden: true }),
          ).toBeInTheDocument();
        else expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
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

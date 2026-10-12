import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Menu } from "./Menu";
import type { MenuContentProps, MenuProps } from "./Menu.types";

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

function Tree({ root, content }: { root?: Omit<MenuProps, "children">; content?: MenuContentProps }) {
  return (
    <Menu {...root}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content {...content}>
        <Menu.Group>
          <Menu.Label>Edit</Menu.Label>
          <Menu.Item shortcut="⌘C">Copy</Menu.Item>
          <Menu.Item description="Plan and invoices" trailing="New">
            Billing
          </Menu.Item>
          <Menu.Item disabled disabledReason="Admins only">
            Delete
          </Menu.Item>
          <Menu.Item onSelect={() => new Promise<void>(() => undefined)}>Export</Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.CheckboxItem defaultChecked>Show grid</Menu.CheckboxItem>
        <Menu.RadioGroup defaultValue="a" aria-label="Sort by">
          <Menu.RadioItem value="a">Name</Menu.RadioItem>
        </Menu.RadioGroup>
        <Menu.Sub>
          <Menu.SubTrigger>More</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item>Inside</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
      </Menu.Content>
    </Menu>
  );
}

const variants: Array<[string, Parameters<typeof Tree>[0]]> = [
  ["closed", {}],
  ["open by default", { root: { defaultOpen: true } }],
  ["controlled open", { root: { open: true } }],
  ["extra small", { root: { defaultOpen: true }, content: { size: "xs" } }],
  ["a responsive side", { root: { defaultOpen: true }, content: { side: { base: "top", md: "right" } } }],
  ["right to left", { root: { defaultOpen: true, dir: "rtl" } }],
  ["non-modal", { root: { defaultOpen: true, modal: false } }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Menu on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(typeof html).toBe("string");
    // the trigger is server-rendered; the panel is portaled after mount, so it is not
    expect(html).toContain("Actions");
    expect(html).not.toContain('role="menu"');
  });
});

describe("Menu hydrating", () => {
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
      const opensByDefault = Boolean(props.root?.defaultOpen || props.root?.open);
      if (opensByDefault) {
        expect(await screen.findByRole("menu", { hidden: true })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
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

import { BellIcon, ChartBarIcon, HouseIcon } from "@dbm-system/icons";
import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Menu } from "../Menu";
import { Sidebar } from "./Sidebar";
import type { SidebarProps } from "./Sidebar.types";

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

// The state belongs to the provider (a sidebar inside one ignores its own, with a warning), so the variants' state props go there.
function Tree({ defaultCollapsed, defaultMenuOpen, collapseBelow, ...props }: SidebarProps) {
  return (
    <Sidebar.Provider defaultCollapsed={defaultCollapsed} defaultMenuOpen={defaultMenuOpen} collapseBelow={collapseBelow}>
      <Sidebar.MenuButton />
      <Sidebar {...props}>
        <Sidebar.Header>Acme</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Nav>
            <Sidebar.Section label="Workspace" collapsible>
              <Sidebar.Item href="/" icon={HouseIcon} current badge="3">
                Home
              </Sidebar.Item>
              <Sidebar.Group label="Reports" icon={ChartBarIcon} current>
                <Sidebar.Item href="/reports/sales" current>
                  Sales
                </Sidebar.Item>
              </Sidebar.Group>
              <Sidebar.Group label="Alerts" icon={BellIcon}>
                <Sidebar.Item href="/alerts" description="What needs a look" badge={4}>
                  Errors
                </Sidebar.Item>
              </Sidebar.Group>
            </Sidebar.Section>
            <Sidebar.Skeleton rows={2} />
          </Sidebar.Nav>
        </Sidebar.Content>
        <Sidebar.Footer>
          <Sidebar.Account name="John Doe" description="john@acme.com">
            <Menu.Item>Profile</Menu.Item>
          </Sidebar.Account>
          <Sidebar.Toggle />
        </Sidebar.Footer>
      </Sidebar>
    </Sidebar.Provider>
  );
}

const variants: Array<[string, SidebarProps]> = [
  ["by default", {}],
  ["as a rail, sticky", { defaultCollapsed: true, sticky: true, stickyOffset: 4 }],
  ["filled and large, never collapsing", { variant: "filled", size: "lg", collapseBelow: "never" }],
  ["right to left, on the end side", { dir: "rtl", side: "end", width: "18rem" }],
  ["with the panel open by default", { defaultMenuOpen: true }],
  ["floating, exclusive and peeking, as a rail", { variant: "floating", exclusive: true, peek: true, defaultCollapsed: true }],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Sidebar on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(html).toContain("Home");
    // the phone panel is portaled after mount, so the server draws only the sidebar
    expect(html).not.toContain('role="dialog"');
  });

  it("draws the sidebar, the menu button and the toggle in the first paint, so the stylesheet alone picks which one shows", () => {
    const html = onTheServer(() => renderToString(<Tree />));
    expect(html).toContain('aria-label="Menu"');
    expect(html).toContain('aria-label="Collapse sidebar"');
    expect(html).toContain('aria-current="page"');
  });
});

describe("Sidebar hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch", async (_name, props) => {
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
      if (props.defaultMenuOpen) {
        expect(await screen.findByRole("dialog", { hidden: true })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

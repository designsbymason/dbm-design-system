import { ChartBarIcon, HouseIcon, UsersIcon } from "@dbm-design-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Badge } from "../../atoms/Badge";
import { Sidebar, useSidebar } from "./Sidebar";
import styles from "./Sidebar.module.css";
import type { SidebarProps } from "./Sidebar.types";

// jsdom applies the stylesheet but matches no media query, so below the `collapseBelow` width the page's sidebar is `display: none` (as on a
// phone) and only the panel's copy is reachable. Tests of the page's sidebar set `collapseBelow="never"`; tests of the panel read the page's
// copy with `hidden: true`.
function Basic(props: SidebarProps) {
  return (
    <Sidebar collapseBelow="never" {...props}>
      <Sidebar.Header>Acme</Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Nav>
          <Sidebar.Item href="/" icon={HouseIcon} current>
            Home
          </Sidebar.Item>
          <Sidebar.Group label="Reports" icon={ChartBarIcon}>
            <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
            <Sidebar.Item href="/reports/costs">Costs</Sidebar.Item>
          </Sidebar.Group>
          <Sidebar.Item href="/team" icon={UsersIcon} badge="3">
            Team
          </Sidebar.Item>
          <Sidebar.Item href="/docs" disabled>
            Docs
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Toggle />
      </Sidebar.Footer>
    </Sidebar>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sidebar", () => {
  it("is a plain box with a named navigation holding a list of items", () => {
    render(<Basic />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const lists = within(nav).getAllByRole("list");
    expect(lists[0]).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("names a navigation from aria-label, aria-labelledby or labels", () => {
    const { rerender } = render(
      <Sidebar collapseBelow="never" labels={{ navigation: "Primary" }}>
        <Sidebar.Nav>
          <Sidebar.Item href="/a">A</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Primary");
    rerender(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav aria-label="Settings">
          <Sidebar.Item href="/a">A</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation", { name: "Settings" })).toBeInTheDocument();
  });

  it("keeps the English default for a label whose override is undefined", () => {
    render(<Basic labels={{ collapse: undefined }} />);
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });

  it("marks the current page and no other", () => {
    render(<Basic />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Team/ })).not.toHaveAttribute("aria-current");
  });

  it("lets a computed aria-current win over one passed in", () => {
    render(
      <Sidebar collapseBelow="never">
        <Sidebar.Nav>
          <Sidebar.Item href="/a" aria-current="page">
            A
          </Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "A" })).not.toHaveAttribute("aria-current");
  });

  it("forwards the ref to the root and standard props to it", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Sidebar ref={ref} collapseBelow="never" id="side" className="mine" data-testid="sidebar" style={{ color: "red" }}>
        <Sidebar.Header>Acme</Sidebar.Header>
      </Sidebar>,
    );
    expect(ref.current).toBe(screen.getByTestId("sidebar"));
    expect(ref.current).toHaveAttribute("id", "side");
    expect(ref.current).toHaveClass("mine");
    expect(ref.current?.style.color).toBe("red");
  });

  it("applies the width prop as the sidebar's width", () => {
    const { rerender } = render(<Basic data-testid="sidebar" width={288} />);
    expect(screen.getByTestId("sidebar").style.getPropertyValue("--sidebar-width")).toBe("288px");
    rerender(<Basic data-testid="sidebar" width="18rem" />);
    expect(screen.getByTestId("sidebar").style.getPropertyValue("--sidebar-width")).toBe("18rem");
  });

  it("puts its line on the edge it does not sit against", () => {
    render(<Basic data-testid="sidebar" side="end" />);
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-side", "end");
  });

  describe("items", () => {
    it("is a link with an href and a button without one", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="/a">Link</Sidebar.Item>
            <Sidebar.Item>Action</Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: "Link" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute("type", "button");
    });

    it("opens an external link in a new tab with a hidden cue", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="https://example.com">Docs</Sidebar.Item>
            <Sidebar.Item href="https://example.com/b" external={false}>
              Plain
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const link = screen.getByRole("link", { name: /^Docs\s*\(opens in a new tab\)$/ });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByRole("link", { name: "Plain" })).not.toHaveAttribute("target");
    });

    it("includes a badge in the item's name", () => {
      render(<Basic />);
      expect(screen.getByRole("link", { name: "Team 3" })).toBeInTheDocument();
    });

    it("draws a passed Badge as written, with the item's size where it sets none", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="/a" badge={<Badge tone="danger">9</Badge>}>
              Alerts
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: "Alerts 9" })).toBeInTheDocument();
    });

    it("blocks a disabled item's click and keeps it focusable", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item href="/a" disabled onClick={onClick}>
              Docs
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const link = screen.getByRole("link", { name: "Docs" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      await user.tab();
      expect(link).toHaveFocus();
      await user.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("puts its look on a router's link with asChild, and keeps the child's own click running", async () => {
      const user = userEvent.setup();
      const navigate = vi.fn((event: React.MouseEvent) => event.preventDefault());
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Item asChild current>
              <a href="/routed" onClick={navigate}>
                Routed
              </a>
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const link = screen.getByRole("link", { name: "Routed" });
      expect(link).toHaveAttribute("aria-current", "page");
      await user.click(link);
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe("groups", () => {
    it("starts shut with its button reporting aria-expanded, and opens and shuts on a press", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const button = screen.getByRole("button", { name: "Reports" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("link", { name: "Sales" })).not.toBeInTheDocument();
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("link", { name: "Sales" })).toBeInTheDocument();
      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(screen.queryByRole("link", { name: "Sales" })).not.toBeInTheDocument());
    });

    it("starts open when it holds the current page, and marks its button only while it is shut", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" current>
              <Sidebar.Item href="/reports/sales" current>
                Sales
              </Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const button = screen.getByRole("button", { name: "Reports" });
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).not.toHaveClass(styles.current!);
      await user.click(button);
      expect(button).toHaveClass(styles.current!);
      expect(button).not.toHaveAttribute("aria-current");
    });

    it("is controllable with open and onOpenChange", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" open={false} onOpenChange={onOpenChange}>
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      await user.click(screen.getByRole("button", { name: "Reports" }));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-expanded", "false");
    });

    it("leaves a disabled group's button out of the tab order", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" disabled>
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("button", { name: "Reports" })).toBeDisabled();
    });

    it("warns once groups nest deeper than three", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Group label="One" defaultOpen>
              <Sidebar.Group label="Two" defaultOpen>
                <Sidebar.Group label="Three" defaultOpen>
                  <Sidebar.Group label="Four" defaultOpen>
                    <Sidebar.Item href="/deep">Deep</Sidebar.Item>
                  </Sidebar.Group>
                </Sidebar.Group>
              </Sidebar.Group>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("nested more than 3 deep"));
    });
  });

  describe("sections and separators", () => {
    it("names a list from its section heading", () => {
      render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Section label="Workspace">
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Separator data-testid="separator" />
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("list", { name: "Workspace" })).toBeInTheDocument();
      expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("the rail", () => {
    it("collapses and expands with the toggle, and reports each change", async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Basic data-testid="sidebar" onCollapsedChange={onCollapsedChange} />);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed");
      await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
    });

    it("starts as a rail with defaultCollapsed and follows a controlled collapsed", () => {
      const { rerender } = render(<Basic data-testid="sidebar" defaultCollapsed />);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed");
      rerender(<Basic data-testid="sidebar" collapsed={false} />);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
    });

    it("leaves a controlled sidebar as it is until the prop changes", async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Basic data-testid="sidebar" collapsed={false} onCollapsedChange={onCollapsedChange} />);
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
      expect(screen.getByTestId("sidebar")).not.toHaveAttribute("data-collapsed");
    });

    it("keeps an item's text as its accessible name and shows it in a tooltip on focus", async () => {
      const user = userEvent.setup();
      render(<Basic defaultCollapsed />);
      const home = screen.getByRole("link", { name: "Home" });
      expect(home.querySelector(`.${styles.hiddenText}`)).not.toBeNull();
      await user.tab();
      expect(home).toHaveFocus();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Home");
    });

    it("keeps an external item's cue and a badge in the name", () => {
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Item href="https://example.com" icon={HouseIcon} badge="2">
              Docs
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: /^Docs\s*2\s*\(opens in a new tab\)$/ })).toBeInTheDocument();
    });

    it("draws an item with no icon as its first letter and warns when there is nothing to draw", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Item href="/a">Alpha</Sidebar.Item>
            <Sidebar.Item href="/b">
              <b>Rich</b>
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(screen.getByRole("link", { name: "Alpha" })).toHaveTextContent("AAlpha");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("nothing to show"));
    });

    it("turns a group into a menu of its items, with the group's text as the title", async () => {
      const user = userEvent.setup();
      render(<Basic defaultCollapsed />);
      const trigger = screen.getByRole("button", { name: "Reports" });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      await user.click(trigger);
      const menu = await screen.findByRole("menu");
      expect(within(menu).getByText("Reports")).toBeInTheDocument();
      expect(within(menu).getByRole("menuitem", { name: "Sales" })).toBeInTheDocument();
    });

    it("opens a nested group as a submenu", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar collapseBelow="never" defaultCollapsed>
          <Sidebar.Nav>
            <Sidebar.Group label="Reports" icon={ChartBarIcon}>
              <Sidebar.Group label="Regional">
                <Sidebar.Item href="/reports/emea">EMEA</Sidebar.Item>
              </Sidebar.Group>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      await user.click(screen.getByRole("button", { name: "Reports" }));
      await user.click(await screen.findByRole("menuitem", { name: "Regional" }));
      expect(await screen.findByRole("menuitem", { name: "EMEA" })).toBeInTheDocument();
    });

    it("keeps a group's open state across a collapse and an expand", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(screen.getByRole("button", { name: "Reports" }));
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
      expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-expanded", "true");
    });

    it("gives the toggle a name for the press it would answer to", () => {
      render(<Basic />);
      expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    });
  });

  describe("the phone panel", () => {
    it("is not drawn until it is opened, and is named from labels", () => {
      render(<Basic collapseBelow="md" labels={{ menu: "Navigation" }} defaultMenuOpen />);
      expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
    });

    it("draws the same items in the panel, never as a rail", async () => {
      render(<Basic collapseBelow="md" defaultCollapsed defaultMenuOpen />);
      const dialog = await screen.findByRole("dialog", { name: "Menu" });
      expect(within(dialog).getByRole("link", { name: "Home" })).toBeInTheDocument();
      expect(within(dialog).getByRole("link", { name: "Home" }).querySelector(`.${styles.hiddenText}`)).toBeNull();
      expect(within(dialog).getByRole("button", { name: "Reports" })).toHaveAttribute("aria-expanded", "false");
      expect(within(dialog).queryByRole("button", { name: /sidebar/ })).not.toBeInTheDocument();
    });

    it("opens from a menu button and reports it", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar.Provider onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.MenuButton />
          <Basic collapseBelow="md" />
        </Sidebar.Provider>,
      );
      const button = screen.getByRole("button", { name: "Menu" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      await user.click(button);
      expect(onMenuOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
      expect(await screen.findByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    });

    it("closes on a chosen link, even one whose click default was prevented", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="md" defaultMenuOpen onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.Nav>
            <Sidebar.Item href="/routed" onClick={(event) => event.preventDefault()}>
              Routed
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("link", { name: "Routed" }));
      expect(onMenuOpenChange).toHaveBeenCalledWith(false, { reason: "close" });
    });

    it("stays open when a button item or a group's button is pressed", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="md" defaultMenuOpen onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.Nav>
            <Sidebar.Item>New project</Sidebar.Item>
            <Sidebar.Group label="Reports">
              <Sidebar.Item href="/a">A</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Nav>
        </Sidebar>,
      );
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "New project" }));
      await user.click(within(dialog).getByRole("button", { name: "Reports" }));
      expect(onMenuOpenChange).not.toHaveBeenCalled();
    });

    it("keeps the panel open on a chosen link with closeMenuOnNavigate off", async () => {
      const user = userEvent.setup();
      const onMenuOpenChange = vi.fn();
      render(
        <Sidebar collapseBelow="md" defaultMenuOpen closeMenuOnNavigate={false} onMenuOpenChange={onMenuOpenChange}>
          <Sidebar.Nav>
            <Sidebar.Item href="/a" onClick={(event) => event.preventDefault()}>
              A
            </Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      await user.click(within(await screen.findByRole("dialog")).getByRole("link", { name: "A" }));
      expect(onMenuOpenChange).not.toHaveBeenCalled();
    });

    it("closes with Escape and gives focus back to the menu button", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar.Provider>
          <Sidebar.MenuButton />
          <Basic collapseBelow="md" />
        </Sidebar.Provider>,
      );
      const button = screen.getByRole("button", { name: "Menu" });
      await user.click(button);
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(button).toHaveFocus();
    });

    it("closes when the page grows past the step", async () => {
      let handler: ((event: MediaQueryListEvent) => void) | undefined;
      const addEventListener = vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        handler = listener;
      });
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      }) as never;
      const onMenuOpenChange = vi.fn();
      render(<Basic collapseBelow="md" defaultMenuOpen onMenuOpenChange={onMenuOpenChange} />);
      await screen.findByRole("dialog");
      expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 48rem)");
      act(() => handler?.({ matches: true } as MediaQueryListEvent));
      expect(onMenuOpenChange).toHaveBeenCalledWith(false, { reason: "close" });
      // @ts-expect-error: remove the stub again
      delete window.matchMedia;
    });

    it("draws no panel when the sidebar never collapses", () => {
      render(<Basic collapseBelow="never" defaultMenuOpen />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is controllable with menuOpen", async () => {
      const { rerender } = render(<Basic collapseBelow="md" menuOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      rerender(<Basic collapseBelow="md" menuOpen />);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Sidebar.Provider and useSidebar", () => {
    it("lets a toggle outside the sidebar collapse it", async () => {
      const user = userEvent.setup();
      render(
        <Sidebar.Provider>
          <Sidebar.Toggle />
          <Basic data-testid="sidebar" />
        </Sidebar.Provider>,
      );
      await user.click(screen.getAllByRole("button", { name: "Collapse sidebar" })[0]!);
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed");
    });

    it("warns when the sidebar sets state its provider holds", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Sidebar.Provider>
          <Basic defaultCollapsed />
        </Sidebar.Provider>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Sidebar.Provider"));
    });

    it("throws a clear error for a menu button outside both a provider and a sidebar", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Sidebar.MenuButton />)).toThrow("must be used inside <Sidebar> or <Sidebar.Provider>");
    });

    it("reports the state to your own parts, which are never a rail in the panel", async () => {
      function Probe() {
        const { collapsed } = useSidebar();
        return <span data-testid="probe">{collapsed ? "rail" : "full"}</span>;
      }
      render(
        <Sidebar collapseBelow="md" defaultCollapsed defaultMenuOpen>
          <Sidebar.Header>
            <Probe />
          </Sidebar.Header>
        </Sidebar>,
      );
      const probes = await screen.findAllByTestId("probe");
      expect(probes.map((probe) => probe.textContent)).toEqual(["rail", "full"]);
    });

    it("lets a sidebar nested in another be controlled on its own without disturbing the outer one", async () => {
      const user = userEvent.setup();
      function Both() {
        const [collapsed, setCollapsed] = useState(false);
        return (
          <Sidebar.Provider collapsed={collapsed} onCollapsedChange={setCollapsed}>
            <Basic data-testid="outer" />
          </Sidebar.Provider>
        );
      }
      render(<Both />);
      await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(screen.getByTestId("outer")).toHaveAttribute("data-collapsed");
    });
  });

  describe("accessibility", () => {
    it("has no axe violations expanded, as a rail and with the panel open", async () => {
      const { container, unmount } = render(<Basic />);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
      const rail = render(<Basic defaultCollapsed />);
      expect(await axe(rail.container)).toHaveNoViolations();
      rail.unmount();
      render(<Basic collapseBelow="md" defaultMenuOpen />);
      const dialog = await screen.findByRole("dialog");
      expect(await axe(dialog)).toHaveNoViolations();
    });

    it("has no axe violations with a section, a separator, an external item and a button item", async () => {
      const { container } = render(
        <Sidebar collapseBelow="never">
          <Sidebar.Nav>
            <Sidebar.Section label="Workspace">
              <Sidebar.Item href="/a" icon={HouseIcon} current>
                Home
              </Sidebar.Item>
              <Sidebar.Item href="https://example.com">Docs</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Separator />
            <Sidebar.Item>New project</Sidebar.Item>
          </Sidebar.Nav>
        </Sidebar>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("works inside StrictMode, including its panel", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic collapseBelow="md" defaultMenuOpen />
      </StrictMode>,
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Reports" }));
    expect(within(dialog).getByRole("link", { name: "Sales" })).toBeInTheDocument();
  });
});

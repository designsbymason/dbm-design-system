import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-design-system/icons";
import { Breadcrumb } from "./Breadcrumb";
import type { BreadcrumbProps } from "./Breadcrumb.types";

const trail: Array<[string, string]> = [
  ["Home", "/"],
  ["Products", "/products"],
  ["Keyboards", "/products/keyboards"],
  ["Mechanical", "/products/keyboards/mechanical"],
  ["Switches", "/products/keyboards/mechanical/switches"],
];

/** A trail of `count` items: links, then the current page last. */
function Basic({ count = 3, ...props }: Partial<Omit<BreadcrumbProps, "children">> & { count?: number }) {
  return (
    <Breadcrumb {...props}>
      {trail.slice(0, count).map(([label, href], index) => (
        <Breadcrumb.Item key={href}>
          {index === count - 1 ? <Breadcrumb.Page>{label}</Breadcrumb.Page> : <Breadcrumb.Link href={href}>{label}</Breadcrumb.Link>}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Breadcrumb — structure", () => {
  it("renders a named nav around an ordered list", () => {
    render(<Basic />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list").tagName).toBe("OL");
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks the current page and leaves the others as links", () => {
    render(<Basic />);
    expect(screen.getByText("Keyboards")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("draws a hidden separator after every item but the last", () => {
    const { container } = render(<Basic />);
    const separators = container.querySelectorAll("[aria-hidden='true']");
    // Two separators; the decorative chevron icons inside them are hidden too, so count the spans.
    expect(container.querySelectorAll("li > span[aria-hidden='true']")).toHaveLength(2);
    expect(separators.length).toBeGreaterThanOrEqual(2);
    const items = screen.getAllByRole("listitem");
    expect(items[2]?.querySelector("span[aria-hidden='true']")).toBeNull();
  });

  it("states list and listitem roles outright for Safari", () => {
    render(<Basic />);
    expect(screen.getByRole("list")).toHaveAttribute("role", "list");
    for (const item of screen.getAllByRole("listitem")) expect(item).toHaveAttribute("role", "listitem");
  });

  it("renders a slash, a string, or an element as the separator", () => {
    const { container, rerender } = render(<Basic separator="slash" />);
    expect(container.querySelector("li > span[aria-hidden='true']")).toHaveTextContent("/");
    rerender(<Basic separator="›" />);
    expect(container.querySelector("li > span[aria-hidden='true']")).toHaveTextContent("›");
    rerender(<Basic separator={<em data-testid="custom">→</em>} />);
    expect(screen.getAllByTestId("custom")).toHaveLength(2);
  });

  it("draws a leading icon on a link and on the page", () => {
    const { container } = render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/" icon={HouseIcon}>
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page icon={HouseIcon}>Here</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: "Home" }).querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Here").querySelector("svg")).toBeInTheDocument();
    expect(container.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThanOrEqual(2);
  });

  it("ignores children that are not items, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Breadcrumb>
        stray text
        <Breadcrumb.Item>
          <Breadcrumb.Page>Only</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("stray text")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("only `Breadcrumb.Item`"));
  });
});

describe("Breadcrumb — props", () => {
  it("names the nav from labels, aria-label, or aria-labelledby", () => {
    const { rerender } = render(<Basic labels={{ navigation: "Fil d'Ariane" }} />);
    expect(screen.getByRole("navigation", { name: "Fil d'Ariane" })).toBeInTheDocument();
    rerender(<Basic labels={{ navigation: "Fil d'Ariane" }} aria-label="You are here" />);
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="t">Where</h2>
        <Basic aria-labelledby="t" aria-label="ignored" />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Where" })).toBeInTheDocument();
  });

  it("forwards the ref to the nav and passes id, className, style, data-testid and native props", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Breadcrumb ref={ref} id="crumbs" className="mine" style={{ color: "red" }} data-testid="bc" title="trail">
        <Breadcrumb.Item>
          <Breadcrumb.Page>Here</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    const nav = screen.getByTestId("bc");
    expect(ref.current).toBe(nav);
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("id", "crumbs");
    expect(nav).toHaveClass("mine");
    expect(nav).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(nav).toHaveAttribute("title", "trail");
  });

  it("applies a size class", () => {
    render(<Basic size="xl" />);
    expect(screen.getByRole("navigation").className).toMatch(/sizeXl/);
  });

  it("keeps its own aria-current on the page whatever the caller passes", () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Page aria-current="false">Here</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByText("Here")).toHaveAttribute("aria-current", "page");
  });
});

describe("Breadcrumb.Link", () => {
  it("is the Link atom: external links open in a new tab, disabled ones are aria-disabled", () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="https://example.com">Out</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/x" disabled>
            Off
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: /Out/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Off" })).toHaveAttribute("aria-disabled", "true");
  });

  it("renders a slotted element with asChild, and warns that icon is not drawn with it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="/x" icon={HouseIcon}>
            <a data-testid="routed" href="/x">
              Routed
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    const routed = screen.getByTestId("routed");
    expect(routed.className).toMatch(/link/);
    expect(routed.querySelector("svg")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`icon` is not drawn together with `asChild`"));
  });

  it("forwards a ref to the anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link ref={ref} href="/x">
            X
          </Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(ref.current).toBe(screen.getByRole("link"));
  });
});

describe("Breadcrumb — collapsing", () => {
  const collapsed = (props: Partial<BreadcrumbProps> = {}) => <Basic count={5} maxItems={3} {...props} />;

  it("does not collapse without maxItems, or when the trail fits", () => {
    const { rerender } = render(<Basic count={5} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    rerender(<Basic count={5} maxItems={5} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("replaces the middle with a button: first item, the button, then the last two", () => {
    render(collapsed());
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(within(items[0]!).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(items[1]!).getByRole("button", { name: "Show 2 hidden pages" })).toBeInTheDocument();
    expect(within(items[2]!).getByRole("link", { name: "Mechanical" })).toBeInTheDocument();
    expect(items[3]).toHaveTextContent("Switches");
    expect(screen.queryByRole("link", { name: "Products" })).not.toBeInTheDocument();
  });

  it("puts a separator after the button but none after the last item", () => {
    render(collapsed());
    const items = screen.getAllByRole("listitem");
    expect(items[1]!.querySelector("span[aria-hidden='true']")).not.toBeNull();
    expect(items[3]!.querySelector("span[aria-hidden='true']")).toBeNull();
  });

  it("honours itemsBeforeCollapse and itemsAfterCollapse", () => {
    render(collapsed({ itemsBeforeCollapse: 2, itemsAfterCollapse: 1 }));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show 2 hidden pages" })).toBeInTheDocument();
    expect(items[3]).toHaveTextContent("Switches");
  });

  it("always keeps the current page, even with itemsAfterCollapse of 0", () => {
    render(collapsed({ itemsAfterCollapse: 0 }));
    expect(screen.getByText("Switches")).toHaveAttribute("aria-current", "page");
  });

  it("does not hide a single item behind a button", () => {
    render(<Basic count={4} maxItems={3} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reveals every item when the button is used, and moves focus to the first one it revealed", async () => {
    const user = userEvent.setup();
    render(collapsed());
    await user.click(screen.getByRole("button", { name: "Show 2 hidden pages" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });

  it("can be used from the keyboard", async () => {
    const user = userEvent.setup();
    render(collapsed());
    screen.getByRole("link", { name: "Home" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Show 2 hidden pages" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });

  it("uses a translated label for the button", () => {
    render(collapsed({ labels: { expand: (n) => `Afficher ${n} pages` } }));
    expect(screen.getByRole("button", { name: "Afficher 2 pages" })).toBeInTheDocument();
  });

  it("warns when the visible items fill maxItems", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Basic count={5} maxItems={3} itemsBeforeCollapse={2} itemsAfterCollapse={2} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("nothing left to collapse"));
  });
});

describe("Breadcrumb — StrictMode", () => {
  it("still moves focus after expanding when mounted twice", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic count={5} maxItems={3} />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Show 2 hidden pages" }));
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });
});

describe("Breadcrumb — accessibility", () => {
  const cases: Array<[string, ReactNode]> = [
    ["a plain trail", <Basic key="a" />],
    ["a collapsed trail", <Basic key="b" count={5} maxItems={3} />],
    ["a slash separator", <Basic key="c" separator="slash" />],
    ["a named nav", <Basic key="d" aria-label="Path" size="xs" />],
  ];
  it.each(cases)("has no axe violations: %s", async (_name, ui) => {
    const { container } = render(<>{ui}</>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations once expanded", async () => {
    const user = userEvent.setup();
    const { container } = render(<Basic count={5} maxItems={3} />);
    await user.click(screen.getByRole("button"));
    expect(await axe(container)).toHaveNoViolations();
  });
});

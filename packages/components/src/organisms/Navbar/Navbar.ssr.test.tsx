import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HouseIcon } from "@dbm-system/icons";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Navbar } from "./Navbar";
import type { NavbarProps } from "./Navbar.types";

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

function Tree(props: NavbarProps) {
  return (
    <Navbar {...props}>
      <Navbar.Brand href="/">Acme</Navbar.Brand>
      <Navbar.Links>
        <Navbar.Link href="/products" current>
          Products
        </Navbar.Link>
        <Navbar.Link href="/pricing">Pricing</Navbar.Link>
      </Navbar.Links>
      <Navbar.Actions>
        <button type="button">Sign in</button>
      </Navbar.Actions>
    </Navbar>
  );
}

const variants: Array<[string, NavbarProps]> = [
  ["by default", {}],
  ["sticky and contained", { sticky: true, contained: true, stickyOffset: 4 }],
  ["filled and large, never collapsing", { variant: "filled", size: "lg", collapseBelow: "never" }],
  ["right to left", { dir: "rtl", menuSide: "end" }],
  ["with the menu open by default", { defaultMenuOpen: true }],
  ["with the menu controlled open", { menuOpen: true }],
];

// `Affix` watches a marker with an `IntersectionObserver`, which jsdom doesn't have; it only matters once mounted.
class StubIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Navbar on the server", () => {
  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    expect(html).toContain("<header");
    expect(html).toContain("Products");
    // the menu panel is portaled after mount, so the server draws only the bar
    expect(html).not.toContain('role="dialog"');
  });

  it("draws the menu button and the links in the first paint, so the stylesheet alone picks which one shows", () => {
    const html = onTheServer(() => renderToString(<Tree />));
    expect(html).toContain('aria-label="Menu"');
    expect(html).toContain('aria-current="page"');
  });
});

describe("Navbar hydrating", () => {
  it.each(variants)("hydrates %s without a mismatch", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<Tree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    let root!: ReturnType<typeof hydrateRoot>;
    // React 19 reports a hydration mismatch through this callback (and recovers by redrawing), not console.error.
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <Tree {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
      if (props.defaultMenuOpen || props.menuOpen) {
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

function RowsTree(props: NavbarProps) {
  return (
    <Navbar {...props}>
      <Navbar.Row size="xs" variant="filled" sticky={false}>
        <Navbar.Links aria-label="Courtesy" quiet align="end">
          <Navbar.Link href="/help">Help</Navbar.Link>
        </Navbar.Links>
      </Navbar.Row>
      <Navbar.Row>
        <Navbar.Brand href="/">dbM</Navbar.Brand>
        <Navbar.Search />
        <Navbar.Actions>
          <button type="button">Sign in</button>
        </Navbar.Actions>
      </Navbar.Row>
      <Navbar.Row variant="outlined">
        <Navbar.Links aria-label="Categories">
          <Navbar.Link href="/men" current>
            Men
          </Navbar.Link>
        </Navbar.Links>
      </Navbar.Row>
      <Navbar.PanelActions>
        <button type="button">Sign in</button>
      </Navbar.PanelActions>
    </Navbar>
  );
}

const rowVariants: Array<[string, NavbarProps]> = [
  ["with rows", {}],
  ["with rows, sticky, with the first row scrolling away", { sticky: true, stickyOffset: 2 }],
  ["with rows, the menu open by default", { defaultMenuOpen: true }],
  ["with rows, right to left", { dir: "rtl", size: "lg", contained: true }],
];

describe("Navbar with rows on the server", () => {
  it.each(rowVariants)("renders %s without touching window or document, and draws the search landmark and every row", (_name, props) => {
    const html = onTheServer(() => renderToString(<RowsTree {...props} />));
    expect(html.match(/<header/g)).toHaveLength(1);
    expect(html).toContain('role="search"');
    expect(html).toContain("Categories");
    expect(html).toContain("Courtesy");
    expect(html).not.toContain('role="dialog"');
  });
});

describe("Navbar with rows hydrating", () => {
  it.each(rowVariants)("hydrates %s without a mismatch", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<RowsTree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    let root!: ReturnType<typeof hydrateRoot>;
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <RowsTree {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
      if (props.defaultMenuOpen) {
        expect(await screen.findByRole("dialog", { hidden: true })).toBeInTheDocument();
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

// The newer render paths: a row drawn in columns (the parts gathered by column), a link size, a link badge (plain and a passed `Badge`), a
// trailing arrow, the frosted variant, and buttons that take their size from `Navbar.Actions`' context.
function ModernTree(props: NavbarProps) {
  return (
    <Navbar {...props}>
      <Navbar.Row columns="balanced" columnsBelow="lg">
        <Navbar.Brand href="/">dbM</Navbar.Brand>
        <Navbar.Links align="center">
          <Navbar.Link href="/products" current icon={HouseIcon} badge="New">
            Products
          </Navbar.Link>
          <Navbar.Link href="/alerts" badge={<Badge tone="danger" variant="solid">2</Badge>}>
            Alerts
          </Navbar.Link>
          <Navbar.Link href="https://status.example.com">Status</Navbar.Link>
        </Navbar.Links>
        <Navbar.Search buttonTone="neutral" buttonSize="md" />
        <Navbar.Actions>
          <Button>Sign in</Button>
          <IconButton icon={HouseIcon} aria-label="Home" label="Home" hideLabelBelow="md" />
        </Navbar.Actions>
      </Navbar.Row>
    </Navbar>
  );
}

const modernVariants: Array<[string, NavbarProps]> = [
  ["in columns", {}],
  ["frosted, sticky and extra small", { variant: "frosted", sticky: true, size: "xs" }],
  ["with large links", { linkSize: "xl", size: "lg" }],
  ["right to left", { dir: "rtl", linkSize: "xs" }],
];

describe("Navbar with columns, link extras and frosted on the server and hydrating", () => {
  it.each(modernVariants)("renders %s without touching window or document, with each part in its column", (_name, props) => {
    const html = onTheServer(() => renderToString(<ModernTree {...props} />));
    expect(html.match(/<header/g)).toHaveLength(1);
    expect(html).toContain("Sign in");
    expect(html).toContain('role="search"');
    // the three column groups are drawn in the first paint, so the stylesheet alone lays them out
    expect(html.match(/columnStart|columnCenter|columnEnd/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it.each(modernVariants)("hydrates %s without a mismatch", async (_name, props) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const html = onTheServer(() => renderToString(<ModernTree {...props} />));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    let root!: ReturnType<typeof hydrateRoot>;
    const recoverable: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <ModernTree {...props} />, {
        onRecoverableError: (caught) => recoverable.push(String((caught as Error).message).slice(0, 400)),
      });
    });
    try {
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

import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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

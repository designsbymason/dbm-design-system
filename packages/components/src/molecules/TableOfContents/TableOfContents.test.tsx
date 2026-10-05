import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./TableOfContents";
import type { TableOfContentsItem } from "./TableOfContents.types";

const items: TableOfContentsItem[] = [
  { id: "intro", label: "Intro" },
  { id: "setup", label: "Setup", level: 2 },
  { id: "usage", label: "Usage" },
];

/** Headings with the ids `items` points at, in a page of their own. */
const Page = ({ children }: { children?: ReactNode }) => (
  <>
    <h2 id="intro">Intro</h2>
    <h3 id="setup">Setup</h3>
    <h2 id="usage">Usage</h2>
    {children}
  </>
);

/** Where each element sits on a page scrolled to `scroll.y`: jsdom lays nothing out, so a heading's top is given. */
const scroll = { y: 0 };
function layout(tops: Record<string, number>) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const top = this.id in tops ? (tops[this.id] as number) - scroll.y : 0;
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) };
  });
}
const scrollTo = (y: number) => {
  scroll.y = y;
  fireEvent.scroll(window);
};

const current = () => document.querySelector('[aria-current="location"]')?.textContent ?? null;

beforeEach(() => {
  scroll.y = 0;
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("TableOfContents — structure", () => {
  it("renders a nav named by its heading, around a list of links to the sections", () => {
    render(<TableOfContents items={items} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(within(nav).getByRole("list")).toBeInTheDocument();
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
    expect(within(nav).getByRole("link", { name: "Setup" })).toHaveAttribute("href", "#setup");
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<TableOfContents items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps a name for the nav when the heading is hidden", () => {
    render(<TableOfContents items={items} showTitle={false} />);
    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Table of contents" })).toBeInTheDocument();
  });

  it("takes its name from aria-label or aria-labelledby over the heading", () => {
    const { rerender } = render(<TableOfContents items={items} aria-label="Chapter outline" />);
    expect(screen.getByRole("navigation", { name: "Chapter outline" })).toBeInTheDocument();
    rerender(
      <>
        <span id="name">Named elsewhere</span>
        <TableOfContents items={items} aria-labelledby="name" />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Named elsewhere" })).toBeInTheDocument();
  });

  it("translates its text, and keeps a default whose override is undefined", () => {
    const { rerender } = render(<TableOfContents items={items} labels={{ title: "Sur cette page" }} />);
    expect(screen.getByRole("navigation", { name: "Sur cette page" })).toBeInTheDocument();
    rerender(<TableOfContents items={items} labels={{ title: undefined }} />);
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
  });

  it("states its list roles outright, for Safari with VoiceOver", () => {
    render(<TableOfContents items={items} />);
    expect(screen.getByRole("list").tagName).toBe("UL");
    expect(screen.getByRole("list")).toHaveAttribute("role", "list");
    screen.getAllByRole("listitem").forEach((item) => expect(item).toHaveAttribute("role", "listitem"));
  });

  it("forwards the ref to the nav and passes className, style, id and data-testid through", () => {
    const ref = createRef<HTMLElement>();
    render(<TableOfContents ref={ref} items={items} className="mine" style={{ margin: 3 }} id="toc" data-testid="x" />);
    const nav = screen.getByTestId("x");
    expect(ref.current).toBe(nav);
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveClass("mine");
    expect(nav).toHaveStyle({ margin: "3px" });
    expect(nav).toHaveAttribute("id", "toc");
  });

  it("indents by level and clamps a level outside 1 to 4", () => {
    render(<TableOfContents items={[{ id: "a", label: "A", level: 2 }, { id: "b", label: "B", level: 9 as 4 }, { id: "c", label: "C" }]} />);
    const [a, b, c] = screen.getAllByRole("listitem");
    expect(a?.className).toMatch(/level2/);
    expect(b?.className).toMatch(/level4/);
    expect(c?.className).not.toMatch(/level/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TableOfContents items={items} defaultActiveId="setup" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TableOfContents — reading the headings", () => {
  it("builds the outline from the page's h2 and h3, indented by level", async () => {
    render(
      <>
        <Page />
        <TableOfContents />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Intro", "Setup", "Usage"]);
    expect(within(nav).getByRole("link", { name: "Setup" }).closest("li")?.className).toMatch(/level2/);
  });

  it("reads only inside contentRef, and only what `selector` finds", async () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <h2 id="outside">Outside</h2>
        <article ref={ref}>
          <h2 id="in-two">In two</h2>
          <h4 id="in-four">In four</h4>
          <div id="custom" data-toc="">Custom</div>
        </article>
        <TableOfContents contentRef={ref} selector="h2, h4" />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["In two", "In four"]);
    // h2 is the highest found, so h4 is two levels below it.
    expect(within(nav).getByRole("link", { name: "In four" }).closest("li")?.className).toMatch(/level3/);
  });

  it("takes a level from data-toc-level on an element that is not a heading", async () => {
    render(
      <>
        <div id="a" data-toc-level="1">A</div>
        <div id="b" data-toc-level="3">B</div>
        <TableOfContents selector="[data-toc-level]" />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getByRole("link", { name: "B" }).closest("li")?.className).toMatch(/level3/);
  });

  it("skips a heading with no id, with a warning in development", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <>
        <h2>No id here</h2>
        <h2 id="has-id">Has an id</h2>
        <TableOfContents />
      </>,
    );
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getAllByRole("link")).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No id here"));
  });

  it("renders nothing when it finds nothing, and warns for a selector that is not valid", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<TableOfContents selector="h2[" />);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a valid CSS selector"));
  });

  it("picks up a heading that arrives later, and one that is removed", async () => {
    const { rerender } = render(
      <>
        <h2 id="one">One</h2>
        <TableOfContents />
      </>,
    );
    await screen.findByRole("link", { name: "One" });
    rerender(
      <>
        <h2 id="one">One</h2>
        <h2 id="two">Two</h2>
        <TableOfContents />
      </>,
    );
    await screen.findByRole("link", { name: "Two" });
    rerender(
      <>
        <h2 id="two">Two</h2>
        <TableOfContents />
      </>,
    );
    await waitFor(() => expect(screen.queryByRole("link", { name: "One" })).not.toBeInTheDocument());
  });

  it("is not thrown off by its own updates", async () => {
    render(
      <>
        <Page />
        <TableOfContents />
      </>,
    );
    await screen.findByRole("navigation");
    layout({ intro: 0, setup: 400, usage: 800 });
    scrollTo(450);
    await waitFor(() => expect(current()).toBe("Setup"));
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});

describe("TableOfContents — the current entry", () => {
  it("marks the default entry with aria-current", () => {
    render(<TableOfContents items={items} defaultActiveId="setup" />);
    expect(screen.getByRole("link", { name: "Setup" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Intro" })).not.toHaveAttribute("aria-current");
  });

  it("follows the scroll position: the last heading that has reached the top, or the first one showing before any has", async () => {
    // The headings start below the bottom of the (768px tall) window.
    layout({ intro: 1000, setup: 1400, usage: 1800 });
    const onActiveIdChange = vi.fn();
    render(
      <>
        <Page />
        <TableOfContents items={items} onActiveIdChange={onActiveIdChange} />
      </>,
    );
    // The first heading is still below the fold: nothing is marked.
    expect(current()).toBeNull();
    scrollTo(300);
    await waitFor(() => expect(current()).toBe("Intro"));
    scrollTo(1050);
    await waitFor(() => expect(current()).toBe("Intro"));
    scrollTo(1450);
    await waitFor(() => expect(current()).toBe("Setup"));
    scrollTo(1900);
    await waitFor(() => expect(current()).toBe("Usage"));
    expect(onActiveIdChange.mock.calls.map(([id]) => id)).toEqual(["intro", "setup", "usage"]);
    scrollTo(0);
    await waitFor(() => expect(current()).toBeNull());
    expect(onActiveIdChange).toHaveBeenLastCalledWith(undefined);
  });

  it("marks the first heading on load when it is showing, though it hasn't reached the top", () => {
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    expect(current()).toBe("Intro");
  });

  it("marks only a heading showing inside the scrolling box, not one below its bottom", () => {
    const box = document.createElement("div");
    document.body.appendChild(box);
    const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) });
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this === box) return rect(0, 300);
      return rect(this.id === "intro" ? 400 : 900, 0);
    });
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollContainerRef={{ current: box }} />
      </>,
    );
    expect(current()).toBeNull();
    box.remove();
  });

  it("starts where the page already is", () => {
    layout({ intro: -300, setup: -100, usage: 500 });
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    expect(current()).toBe("Setup");
  });

  it("keeps a given defaultActiveId until the page scrolls", async () => {
    layout({ intro: -300, setup: -100, usage: 500 });
    render(
      <>
        <Page />
        <TableOfContents items={items} defaultActiveId="usage" />
      </>,
    );
    expect(current()).toBe("Usage");
    scrollTo(1);
    await waitFor(() => expect(current()).toBe("Setup"));
  });

  it("counts a heading as reached `scrollOffset` pixels below the top", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollOffset={60} />
      </>,
    );
    scrollTo(350);
    await waitFor(() => expect(current()).toBe("Setup"));
    scrollTo(300);
    await waitFor(() => expect(current()).toBe("Intro"));
  });

  it("measures against the scrolling element when given one", async () => {
    const box = document.createElement("div");
    document.body.appendChild(box);
    const boxRef = { current: box };
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollContainerRef={boxRef} />
      </>,
    );
    scroll.y = 450;
    fireEvent.scroll(box);
    await waitFor(() => expect(current()).toBe("Setup"));
    box.remove();
  });

  it("marks the last section at the very end even though it can't reach the top", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    const root = document.documentElement;
    const define = (name: string, value: number) => Object.defineProperty(root, name, { configurable: true, value });
    define("scrollHeight", 1000);
    define("clientHeight", 400);
    define("scrollTop", 600);
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    scrollTo(600);
    await waitFor(() => expect(current()).toBe("Usage"));
    // jsdom's own values again for the other tests.
    for (const name of ["scrollHeight", "clientHeight", "scrollTop"]) delete (root as unknown as Record<string, unknown>)[name];
  });

  it("is controlled by activeId: a click asks, the prop decides, and scrolling doesn't change it", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    const onActiveIdChange = vi.fn();
    const { rerender } = render(
      <>
        <Page />
        <TableOfContents items={items} activeId="intro" onActiveIdChange={onActiveIdChange} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(onActiveIdChange).toHaveBeenCalledWith("usage");
    expect(current()).toBe("Intro");
    scrollTo(900);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(current()).toBe("Intro");
    rerender(
      <>
        <Page />
        <TableOfContents items={items} activeId="usage" onActiveIdChange={onActiveIdChange} />
      </>,
    );
    expect(current()).toBe("Usage");
  });

  it("works inside StrictMode", async () => {
    layout({ intro: 100, setup: 400, usage: 800 });
    render(
      <StrictMode>
        <Page />
        <TableOfContents />
      </StrictMode>,
    );
    await screen.findByRole("navigation");
    scrollTo(450);
    await waitFor(() => expect(current()).toBe("Setup"));
  });
});

describe("TableOfContents — following a link", () => {
  const matchMedia = (reduced: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: reduced && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );

  it("scrolls the page so the section sits at the top, smoothly, and names it in the address", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 800, behavior: "smooth" });
    expect(window.location.hash).toBe("#usage");
    expect(current()).toBe("Usage");
  });

  it("leaves the section `scrollOffset` pixels from the top", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollOffset={56} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 744, behavior: "smooth" });
  });

  it("does not scroll smoothly when asked not to, or when the person prefers reduced motion", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(true);
    const { rerender } = render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 800, behavior: "auto" });
    matchMedia(false);
    rerender(
      <>
        <Page />
        <TableOfContents items={items} smoothScroll={false} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Setup" }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 400, behavior: "auto" });
  });

  it("scrolls the container instead of the page when given one", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    const box = document.createElement("div");
    box.scrollTo = vi.fn() as typeof box.scrollTo;
    document.body.appendChild(box);
    render(
      <>
        <Page />
        <TableOfContents items={items} scrollContainerRef={{ current: box }} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Setup" }));
    expect(box.scrollTo).toHaveBeenCalledWith({ top: 400, behavior: "smooth" });
    expect(window.scrollTo).not.toHaveBeenCalled();
    box.remove();
  });

  it("leaves a click with a modifier key, or on a missing target, to the browser", async () => {
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={[...items, { id: "nowhere", label: "Nowhere" }]} />
      </>,
    );
    const link = screen.getByRole("link", { name: "Usage" });
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(fireEvent.click(link, { button: 1 })).toBe(true);
    expect(fireEvent.click(screen.getByRole("link", { name: "Nowhere" }))).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("leaves a click the caller's handler already cancelled alone", () => {
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    const link = screen.getByRole("link", { name: "Usage" });
    link.addEventListener("click", (event) => event.preventDefault(), { capture: true });
    fireEvent.click(link);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("moves keyboard focus to the section after a key press, not after a mouse click", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Setup" }));
    expect(document.getElementById("setup")).not.toHaveFocus();
    screen.getByRole("link", { name: "Usage" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.getElementById("usage")).toHaveFocus();
    expect(document.getElementById("usage")).toHaveAttribute("tabindex", "-1");
  });

  it("keeps a tabindex the section already has", async () => {
    render(
      <>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the test needs a heading that already has one. */}
        <h2 id="intro" tabIndex={0}>
          Intro
        </h2>
        <TableOfContents items={[{ id: "intro", label: "Intro" }]} />
      </>,
    );
    screen.getByRole("link", { name: "Intro" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.getElementById("intro")).toHaveAttribute("tabindex", "0");
  });

  it("holds the clicked entry while the page is still scrolling to it", async () => {
    layout({ intro: 0, setup: 400, usage: 800 });
    matchMedia(false);
    render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Usage" }));
    // A scroll event on the way (the smooth scroll passes Setup) doesn't move the mark.
    scrollTo(450);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(current()).toBe("Usage");
    // Once the scrolling stops, the outline reads where the page is.
    await waitFor(() => expect(current()).toBe("Setup"), { timeout: 1000 });
  });
});

describe("TableOfContents — cleanup", () => {
  it("stops listening for scroll when it unmounts", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <>
        <Page />
        <TableOfContents items={items} />
      </>,
    );
    unmount();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(["scroll", "resize"]));
  });

});

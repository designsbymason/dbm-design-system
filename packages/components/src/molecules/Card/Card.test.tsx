import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "./Card";
import styles from "./Card.module.css";
import type { CardProps, CardSize, CardVariant } from "./Card.types";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderCard(props: Partial<CardProps> = {}) {
  return render(
    <Card data-testid="card" {...props}>
      <Card.Media data-testid="media">
        <img src="/example.png" alt="An example" />
      </Card.Media>
      <Card.Header data-testid="header">
        <h3>Team plan</h3>
        <span>Active</span>
      </Card.Header>
      <Card.Body data-testid="body">Up to 10 members.</Card.Body>
      <Card.Footer data-testid="footer">
        <button type="button">Manage</button>
      </Card.Footer>
    </Card>,
  );
}

describe("Card", () => {
  describe("structure", () => {
    it("renders a <div> root holding its sections, in order", () => {
      renderCard();
      const card = screen.getByTestId("card");
      expect(card.tagName).toBe("DIV");
      expect([...card.children].map((child) => child.getAttribute("data-testid"))).toEqual([
        "media",
        "header",
        "body",
        "footer",
      ]);
    });

    it("renders each section as a plain <div>", () => {
      renderCard();
      ["media", "header", "body", "footer"].forEach((id) => {
        expect(screen.getByTestId(id).tagName).toBe("DIV");
      });
    });

    it("accepts any subset of sections, in any order", () => {
      render(
        <Card data-testid="card">
          <Card.Body>Only a body</Card.Body>
        </Card>,
      );
      expect(screen.getByTestId("card").children).toHaveLength(1);
    });

    it("carries no padding class of its own on the root (sections pad themselves)", () => {
      renderCard();
      expect(screen.getByTestId("card")).toHaveClass(styles.card ?? "");
      expect(screen.getByTestId("header")).toHaveClass(styles.header ?? "");
      expect(screen.getByTestId("body")).toHaveClass(styles.body ?? "");
      expect(screen.getByTestId("footer")).toHaveClass(styles.footer ?? "");
      expect(screen.getByTestId("media")).toHaveClass(styles.media ?? "");
    });
  });

  describe("variant", () => {
    const classForVariant: Record<CardVariant, string | undefined> = {
      outlined: undefined,
      elevated: styles.elevated,
      filled: styles.filled,
      ghost: styles.ghost,
    };

    it("defaults to outlined — the base styling, with no variant class", () => {
      renderCard();
      const card = screen.getByTestId("card");
      [styles.elevated, styles.filled, styles.ghost].forEach((name) => {
        expect(card).not.toHaveClass(name ?? "");
      });
    });

    it.each(["elevated", "filled", "ghost"] as const)("applies the %s variant's own class, and no other", (variant) => {
      renderCard({ variant });
      const card = screen.getByTestId("card");
      expect(card).toHaveClass(classForVariant[variant] ?? "");
      (["elevated", "filled", "ghost"] as const)
        .filter((other) => other !== variant)
        .forEach((other) => expect(card).not.toHaveClass(classForVariant[other] ?? ""));
    });
  });

  describe("size", () => {
    const classForSize: Record<CardSize, string | undefined> = {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      xl: styles.sizeXl,
    };

    it("defaults to md", () => {
      renderCard();
      expect(screen.getByTestId("card")).toHaveClass(classForSize.md ?? "");
    });

    it.each(["xs", "sm", "md", "lg", "xl"] as const)("applies size=%s", (size) => {
      renderCard({ size });
      const card = screen.getByTestId("card");
      expect(card).toHaveClass(classForSize[size] ?? "");
      (["xs", "sm", "md", "lg", "xl"] as const)
        .filter((other) => other !== size)
        .forEach((other) => expect(card).not.toHaveClass(classForSize[other] ?? ""));
    });
  });

  describe("tone", () => {
    const toneClassFor = {
      brand: styles.toneBrand,
      info: styles.toneInfo,
      success: styles.toneSuccess,
      warning: styles.toneWarning,
      danger: styles.toneDanger,
    } as const;
    const allToneClasses = Object.values(toneClassFor).map((name) => name ?? "");

    it("defaults to neutral — no toned or tone classes", () => {
      renderCard();
      const card = screen.getByTestId("card");
      expect(card).not.toHaveClass(styles.toned ?? "");
      allToneClasses.forEach((toneClass) => expect(card).not.toHaveClass(toneClass));
    });

    it("treats an explicit tone=neutral exactly like the default", () => {
      renderCard({ tone: "neutral" });
      expect(screen.getByTestId("card")).not.toHaveClass(styles.toned ?? "");
    });

    it.each(["brand", "info", "success", "warning", "danger"] as const)(
      "tone=%s applies the toned class and only its own tone class",
      (tone) => {
        renderCard({ tone });
        const card = screen.getByTestId("card");
        expect(card).toHaveClass(styles.toned ?? "", toneClassFor[tone] ?? "");
        allToneClasses
          .filter((other) => other !== toneClassFor[tone])
          .forEach((otherClass) => expect(card).not.toHaveClass(otherClass));
      },
    );

    it("composes with every variant", () => {
      renderCard({ tone: "danger", variant: "elevated" });
      expect(screen.getByTestId("card")).toHaveClass(styles.toned ?? "", styles.toneDanger ?? "", styles.elevated ?? "");
    });

    it("doesn't leak an outer card's tone/size into a card nested in its body", () => {
      render(
        <Card tone="danger" size="xl" data-testid="outer">
          <Card.Body>
            <Card data-testid="inner">
              <Card.Body>x</Card.Body>
            </Card>
          </Card.Body>
        </Card>,
      );
      const inner = screen.getByTestId("inner");
      expect(inner).not.toHaveClass(styles.toned ?? "");
      expect(inner).not.toHaveClass(styles.toneDanger ?? "");
      expect(inner).toHaveClass(styles.sizeMd ?? "");
      expect(inner).not.toHaveClass(styles.sizeXl ?? "");
    });
  });

  describe("Card.Footer align", () => {
    it("defaults to end", () => {
      renderCard();
      expect(screen.getByTestId("footer")).toHaveClass(styles.alignEnd ?? "");
    });

    it.each([
      ["start", styles.alignStart],
      ["center", styles.alignCenter],
      ["end", styles.alignEnd],
      ["between", styles.alignBetween],
    ] as const)("align=%s applies its own class", (align, className) => {
      render(
        <Card>
          <Card.Footer align={align} data-testid="footer">
            <button type="button">Action</button>
          </Card.Footer>
        </Card>,
      );
      expect(screen.getByTestId("footer")).toHaveClass(className ?? "");
    });

    it("doesn't render a native align attribute", () => {
      renderCard();
      expect(screen.getByTestId("footer")).not.toHaveAttribute("align");
    });
  });

  describe("interactive", () => {
    it("is off by default", () => {
      renderCard();
      expect(screen.getByTestId("card")).not.toHaveClass(styles.interactive ?? "");
    });

    it("applies the interactive class", () => {
      renderCard({ interactive: true, role: "button" });
      expect(screen.getByTestId("card")).toHaveClass(styles.interactive ?? "");
    });

    it("warns once in development when interactive has no asChild and no role", () => {
      const { rerender } = renderCard({ interactive: true });
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("interactive"));
      rerender(
        <Card interactive data-testid="card">
          <Card.Body>x</Card.Body>
        </Card>,
      );
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("doesn't warn when the card is slotted onto a link", () => {
      render(
        <Card asChild interactive>
          <a href="/plans">
            <Card.Body>Plans</Card.Body>
          </a>
        </Card>,
      );
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("doesn't warn when the consumer supplies their own role", () => {
      renderCard({ interactive: true, role: "button", tabIndex: 0 });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("doesn't warn when interactive is off", () => {
      renderCard();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("orientation", () => {
    it("defaults to vertical — no orientation class at all", () => {
      renderCard();
      const card = screen.getByTestId("card");
      for (const name of Object.keys(styles).filter((key) => key.startsWith("orient"))) {
        expect(card).not.toHaveClass(styles[name] ?? "");
      }
    });

    it("applies the base horizontal class for orientation=horizontal, leaving the DOM order unchanged", () => {
      renderCard({ orientation: "horizontal" });
      const card = screen.getByTestId("card");
      expect(card).toHaveClass(styles.orientBaseHorizontal ?? "");
      expect(Array.from(card.children).map((child) => child.getAttribute("data-testid"))).toEqual([
        "media",
        "header",
        "body",
        "footer",
      ]);
    });

    it("applies the base vertical class for an explicit orientation=vertical", () => {
      renderCard({ orientation: "vertical" });
      expect(screen.getByTestId("card")).toHaveClass(styles.orientBaseVertical ?? "");
    });

    it("composes with every variant, tone, and size", () => {
      renderCard({ orientation: "horizontal", variant: "elevated", tone: "info", size: "sm" });
      expect(screen.getByTestId("card")).toHaveClass(
        styles.orientBaseHorizontal ?? "",
        styles.elevated ?? "",
        styles.toned ?? "",
        styles.sizeSm ?? "",
      );
    });

    it("doesn't leak into a card nested in its body", () => {
      render(
        <Card orientation="horizontal" data-testid="outer">
          <Card.Body>
            <Card data-testid="inner">
              <Card.Body>Nested</Card.Body>
            </Card>
          </Card.Body>
        </Card>,
      );
      expect(screen.getByTestId("outer")).toHaveClass(styles.orientBaseHorizontal ?? "");
      expect(screen.getByTestId("inner").className).not.toContain(styles.orientBaseHorizontal ?? "x");
    });

    describe("responsive", () => {
      it("applies one class per breakpoint in the map", () => {
        renderCard({ orientation: { base: "vertical", md: "horizontal", xl: "vertical" } });
        const card = screen.getByTestId("card");
        expect(card).toHaveClass(
          styles.orientBaseVertical ?? "",
          styles.orientMdHorizontal ?? "",
          styles.orientXlVertical ?? "",
        );
        expect(card).not.toHaveClass(styles.orientMdVertical ?? "");
        expect(card).not.toHaveClass(styles.orientBaseHorizontal ?? "");
      });

      it("supports every breakpoint, including 2xl and 3xl", () => {
        renderCard({
          orientation: { base: "horizontal", sm: "vertical", md: "horizontal", lg: "vertical", xl: "horizontal", "2xl": "vertical", "3xl": "horizontal" },
        });
        expect(screen.getByTestId("card")).toHaveClass(
          styles.orientBaseHorizontal ?? "",
          styles.orientSmVertical ?? "",
          styles.orientMdHorizontal ?? "",
          styles.orientLgVertical ?? "",
          styles.orientXlHorizontal ?? "",
          styles.orient2xlVertical ?? "",
          styles.orient3xlHorizontal ?? "",
        );
      });

      it("treats a map with no base as vertical until its first breakpoint (mobile-first)", () => {
        renderCard({ orientation: { lg: "horizontal" } });
        const card = screen.getByTestId("card");
        expect(card).toHaveClass(styles.orientLgHorizontal ?? "");
        expect(card).not.toHaveClass(styles.orientBaseHorizontal ?? "");
        expect(card).not.toHaveClass(styles.orientBaseVertical ?? "");
      });

      it("ignores a breakpoint whose value is undefined", () => {
        renderCard({ orientation: { base: "horizontal", md: undefined } });
        const card = screen.getByTestId("card");
        expect(card).toHaveClass(styles.orientBaseHorizontal ?? "");
        expect(card).not.toHaveClass(styles.orientMdHorizontal ?? "");
        expect(card).not.toHaveClass(styles.orientMdVertical ?? "");
      });

      it("keeps the DOM order the same, whatever the map says", () => {
        renderCard({ orientation: { base: "vertical", md: "horizontal" } });
        expect(
          Array.from(screen.getByTestId("card").children).map((child) => child.getAttribute("data-testid")),
        ).toEqual(["media", "header", "body", "footer"]);
      });
    });
  });

  describe("mediaPosition", () => {
    it("is unset by default — neither position class, so the media stays where it sits in the DOM", () => {
      renderCard();
      const card = screen.getByTestId("card");
      expect(card).not.toHaveClass(styles.mediaStart ?? "");
      expect(card).not.toHaveClass(styles.mediaEnd ?? "");
    });

    it("applies the start class for mediaPosition=start", () => {
      renderCard({ mediaPosition: "start" });
      const card = screen.getByTestId("card");
      expect(card).toHaveClass(styles.mediaStart ?? "");
      expect(card).not.toHaveClass(styles.mediaEnd ?? "");
    });

    it("applies the end class for mediaPosition=end", () => {
      renderCard({ mediaPosition: "end" });
      const card = screen.getByTestId("card");
      expect(card).toHaveClass(styles.mediaEnd ?? "");
      expect(card).not.toHaveClass(styles.mediaStart ?? "");
    });

    it("works in a vertical card too (top or bottom), not just a horizontal one", () => {
      renderCard({ orientation: "vertical", mediaPosition: "end" });
      expect(screen.getByTestId("card")).toHaveClass(styles.orientBaseVertical ?? "", styles.mediaEnd ?? "");
    });

    it("is visual only — the media stays first in the DOM, in either orientation", () => {
      for (const orientation of ["vertical", "horizontal"] as const) {
        const { unmount } = renderCard({ orientation, mediaPosition: "end" });
        const card = screen.getByTestId("card");
        // Reading and tab order follow the DOM, so the media is still the first child.
        expect(card.firstElementChild).toBe(screen.getByTestId("media"));
        expect(Array.from(card.children).map((child) => child.getAttribute("data-testid"))).toEqual([
          "media",
          "header",
          "body",
          "footer",
        ]);
        unmount();
      }
    });

    it("adds no position class to media placed last in the DOM when mediaPosition is unset", () => {
      render(
        <Card data-testid="card">
          <Card.Body data-testid="body">Body</Card.Body>
          <Card.Media data-testid="media">
            <img src="/example.png" alt="An example" />
          </Card.Media>
        </Card>,
      );
      const card = screen.getByTestId("card");
      // Neither class: the media follows the DOM, so it renders after the body.
      expect(card).not.toHaveClass(styles.mediaStart ?? "");
      expect(card).not.toHaveClass(styles.mediaEnd ?? "");
    });

    it("composes with a responsive orientation", () => {
      renderCard({ orientation: { base: "vertical", md: "horizontal" }, mediaPosition: "end" });
      expect(screen.getByTestId("card")).toHaveClass(styles.orientMdHorizontal ?? "", styles.mediaEnd ?? "");
    });

    it("doesn't leak into a card nested in its body", () => {
      render(
        <Card mediaPosition="end" data-testid="outer">
          <Card.Body>
            <Card data-testid="inner">
              <Card.Body>Nested</Card.Body>
            </Card>
          </Card.Body>
        </Card>,
      );
      expect(screen.getByTestId("outer")).toHaveClass(styles.mediaEnd ?? "");
      expect(screen.getByTestId("inner").className).not.toContain(styles.mediaEnd ?? "x");
    });
  });

  describe("divided", () => {
    it("is off by default", () => {
      renderCard();
      expect(screen.getByTestId("card")).not.toHaveClass(styles.divided ?? "");
    });

    it("applies the divided class", () => {
      renderCard({ divided: true });
      expect(screen.getByTestId("card")).toHaveClass(styles.divided ?? "");
    });

    it("composes with a tone (whose header tint replaces the line beneath it)", () => {
      renderCard({ divided: true, tone: "danger" });
      expect(screen.getByTestId("card")).toHaveClass(styles.divided ?? "", styles.toned ?? "");
    });

    it("adds no elements — dividers are drawn by CSS, so the DOM is unchanged", () => {
      const { unmount } = renderCard();
      const before = screen.getByTestId("card").querySelectorAll("*").length;
      unmount();
      renderCard({ divided: true });
      expect(screen.getByTestId("card").querySelectorAll("*").length).toBe(before);
    });
  });

  describe("disabled", () => {
    function renderLinkCard(props: Partial<CardProps> = {}, onClick = vi.fn()) {
      render(
        <Card asChild interactive {...props}>
          <a href="/plans" onClick={onClick}>
            <Card.Body>Plans</Card.Body>
          </a>
        </Card>,
      );
      return { link: screen.getByRole("link", { name: "Plans" }), onClick };
    }

    it("is off by default — no aria-disabled and no disabled class", () => {
      const { link } = renderLinkCard();
      expect(link).not.toHaveAttribute("aria-disabled");
      expect(link).not.toHaveClass(styles.disabled ?? "");
    });

    it("marks an interactive card aria-disabled and applies the disabled class", () => {
      const { link } = renderLinkCard({ disabled: true });
      expect(link).toHaveAttribute("aria-disabled", "true");
      expect(link).toHaveClass(styles.disabled ?? "");
    });

    it("keeps the link's href and keeps it focusable", () => {
      const { link } = renderLinkCard({ disabled: true });
      expect(link).toHaveAttribute("href", "/plans");
      link.focus();
      expect(link).toHaveFocus();
    });

    it("blocks the click before the slotted child's own handler runs", () => {
      const { link, onClick } = renderLinkCard({ disabled: true });
      const notPrevented = fireEvent.click(link);
      expect(onClick).not.toHaveBeenCalled();
      // `preventDefault` was called, so a real link wouldn't navigate.
      expect(notPrevented).toBe(false);
    });

    it("lets a click through when not disabled", () => {
      const { link, onClick } = renderLinkCard();
      fireEvent.click(link);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("still runs a consumer's own onClickCapture when not disabled", () => {
      const onClickCapture = vi.fn();
      const enabled = renderLinkCard({ onClickCapture });
      fireEvent.click(enabled.link);
      expect(onClickCapture).toHaveBeenCalledTimes(1);
    });

    it("skips a consumer's onClickCapture while disabled", () => {
      const onClickCapture = vi.fn();
      const { link } = renderLinkCard({ disabled: true, onClickCapture });
      fireEvent.click(link);
      expect(onClickCapture).not.toHaveBeenCalled();
    });

    it("works on a slotted button too", () => {
      const onClick = vi.fn();
      render(
        <Card asChild interactive disabled>
          <button type="button" onClick={onClick}>
            Open
          </button>
        </Card>,
      );
      const button = screen.getByRole("button", { name: "Open" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("has no effect without interactive — no aria-disabled, no class — and warns once", () => {
      const { rerender } = renderCard({ disabled: true });
      const card = screen.getByTestId("card");
      expect(card).not.toHaveAttribute("aria-disabled");
      expect(card).not.toHaveClass(styles.disabled ?? "");
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("disabled"));
      rerender(
        <Card disabled data-testid="card">
          <Card.Body>x</Card.Body>
        </Card>,
      );
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("doesn't warn for a disabled interactive card", () => {
      renderLinkCard({ disabled: true });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("lets a consumer's own aria-disabled through when the card isn't disabled", () => {
      renderCard({ "aria-disabled": true, role: "group" });
      expect(screen.getByTestId("card")).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("asChild", () => {
    it("renders the card's styling onto the slotted child, with no wrapper element", () => {
      render(
        <div data-testid="wrapper">
          <Card asChild interactive variant="elevated">
            <a href="/plans" data-testid="link">
              <Card.Body>Plans</Card.Body>
            </a>
          </Card>
        </div>,
      );
      const link = screen.getByTestId("link");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/plans");
      expect(link).toHaveClass(styles.card ?? "", styles.elevated ?? "", styles.interactive ?? "");
      expect(screen.getByTestId("wrapper").children).toHaveLength(1);
      expect(link.querySelector("div")).not.toBeNull();
    });

    it("merges className onto the child's own classes rather than replacing them", () => {
      render(
        <Card asChild className="extra">
          <a href="/x" className="own" data-testid="link">
            <Card.Body>x</Card.Body>
          </a>
        </Card>,
      );
      expect(screen.getByTestId("link")).toHaveClass("extra", "own", styles.card ?? "");
    });

    it("forwards its ref to the slotted child", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Card asChild ref={ref}>
          <a href="/x">
            <Card.Body>x</Card.Body>
          </a>
        </Card>,
      );
      expect(ref.current?.tagName).toBe("A");
    });

    it("is a real link — reachable and named by its content", () => {
      render(
        <Card asChild interactive>
          <a href="/plans">
            <Card.Header>
              <h3>Team plan</h3>
            </Card.Header>
          </a>
        </Card>,
      );
      expect(screen.getByRole("link", { name: "Team plan" })).toHaveAttribute("href", "/plans");
    });
  });

  describe("native passthrough and ref forwarding", () => {
    it("applies id, className, style, data-testid, and aria-* to the root", () => {
      render(
        <Card
          id="plan"
          className="extra"
          style={{ opacity: 0.9 }}
          data-testid="card"
          aria-label="Team plan"
          aria-describedby="hint"
          role="region"
        >
          <Card.Body>x</Card.Body>
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("id", "plan");
      expect(card).toHaveClass("extra");
      expect(card).toHaveStyle({ opacity: "0.9" });
      expect(card).toHaveAttribute("aria-describedby", "hint");
      expect(screen.getByRole("region", { name: "Team plan" })).toBe(card);
    });

    it("passes other native <div> attributes through", () => {
      const onClick = vi.fn();
      renderCard({ onClick, title: "A card" });
      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("title", "A card");
      card.click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("forwards refs to the right element for every part", () => {
      const rootRef = createRef<HTMLDivElement>();
      const mediaRef = createRef<HTMLDivElement>();
      const headerRef = createRef<HTMLDivElement>();
      const bodyRef = createRef<HTMLDivElement>();
      const footerRef = createRef<HTMLDivElement>();
      render(
        <Card ref={rootRef}>
          <Card.Media ref={mediaRef}>m</Card.Media>
          <Card.Header ref={headerRef}>h</Card.Header>
          <Card.Body ref={bodyRef}>b</Card.Body>
          <Card.Footer ref={footerRef}>f</Card.Footer>
        </Card>,
      );
      [rootRef, mediaRef, headerRef, bodyRef, footerRef].forEach((ref) => {
        expect(ref.current?.tagName).toBe("DIV");
      });
    });

    it("passes id, className, style, and data-testid through on every sub-part", () => {
      render(
        <Card>
          <Card.Media id="m" className="c-m" style={{ opacity: 0.9 }} data-testid="m">
            m
          </Card.Media>
          <Card.Header id="h" className="c-h" style={{ opacity: 0.9 }} data-testid="h">
            h
          </Card.Header>
          <Card.Body id="b" className="c-b" style={{ opacity: 0.9 }} data-testid="b">
            b
          </Card.Body>
          <Card.Footer id="f" className="c-f" style={{ opacity: 0.9 }} data-testid="f">
            f
          </Card.Footer>
        </Card>,
      );
      (["m", "h", "b", "f"] as const).forEach((key) => {
        const element = screen.getByTestId(key);
        expect(element).toHaveAttribute("id", key);
        expect(element).toHaveClass(`c-${key}`);
        expect(element).toHaveStyle({ opacity: "0.9" });
      });
    });

    it("lets a consumer's own role win over anything the component might set", () => {
      render(
        <Card role="group" aria-label="Details" data-testid="card">
          <Card.Body>x</Card.Body>
        </Card>,
      );
      expect(screen.getByTestId("card")).toHaveAttribute("role", "group");
    });
  });

  describe("accessibility (jest-axe)", () => {
    it("has no violations by default", async () => {
      const { container } = renderCard();
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations for each variant and tone", async () => {
      for (const variant of ["outlined", "elevated", "filled", "ghost"] as const) {
        const { container, unmount } = renderCard({ variant, tone: "warning" });
        expect(await axe(container)).toHaveNoViolations();
        unmount();
      }
    });

    it("has no violations as an interactive link", async () => {
      const { container } = render(
        <Card asChild interactive variant="elevated">
          <a href="/plans">
            <Card.Header>
              <h3>Team plan</h3>
            </Card.Header>
            <Card.Body>Up to 10 members.</Card.Body>
          </a>
        </Card>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations as a disabled link card", async () => {
      const { container } = render(
        <Card asChild interactive disabled>
          <a href="/plans">
            <Card.Body>Plans</Card.Body>
          </a>
        </Card>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations for a horizontal, divided card with media on the end", async () => {
      const { container } = renderCard({ orientation: "horizontal", mediaPosition: "end", divided: true });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations as a labelled region", async () => {
      const { container } = render(
        <Card role="region" aria-label="Billing summary">
          <Card.Body>Next invoice on the 1st.</Card.Body>
        </Card>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

import { TrayIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import headingStyles from "../../atoms/Heading/Heading.module.css";
import iconStyles from "../../atoms/Icon/Icon.module.css";
import textStyles from "../../atoms/Text/Text.module.css";
import { EmptyState } from "./EmptyState";
import styles from "./EmptyState.module.css";
import type {
  EmptyStateProps,
  EmptyStateSize,
  EmptyStateTone,
  EmptyStateVariant,
} from "./EmptyState.types";

function renderEmptyState(props: Partial<EmptyStateProps> = {}) {
  return render(
    <EmptyState data-testid="empty" {...props}>
      <EmptyState.Icon icon={TrayIcon} data-testid="icon" />
      <EmptyState.Title data-testid="title">No invoices yet</EmptyState.Title>
      <EmptyState.Description data-testid="description">
        Invoices you create will show up here.
      </EmptyState.Description>
      <EmptyState.Actions data-testid="actions">
        <button type="button">Create invoice</button>
      </EmptyState.Actions>
    </EmptyState>,
  );
}

describe("EmptyState", () => {
  describe("structure", () => {
    it("renders a <div> root holding its parts, in order", () => {
      renderEmptyState();
      const root = screen.getByTestId("empty");
      expect(root.tagName).toBe("DIV");
      expect([...root.children].map((child) => child.getAttribute("data-testid"))).toEqual([
        "icon",
        "title",
        "description",
        "actions",
      ]);
    });

    it("renders the title as a heading, the description as a paragraph, and the icon and actions as divs", () => {
      renderEmptyState();
      expect(screen.getByTestId("title").tagName).toBe("H3");
      expect(screen.getByTestId("description").tagName).toBe("P");
      expect(screen.getByTestId("icon").tagName).toBe("DIV");
      expect(screen.getByTestId("actions").tagName).toBe("DIV");
    });

    it("accepts any subset of parts", () => {
      render(
        <EmptyState data-testid="empty">
          <EmptyState.Title>Nothing here</EmptyState.Title>
        </EmptyState>,
      );
      expect(screen.getByTestId("empty").children).toHaveLength(1);
    });

    it("lays out other children (an illustration) in the same column", () => {
      render(
        <EmptyState data-testid="empty">
          <img src="/empty.svg" alt="" data-testid="illustration" />
          <EmptyState.Title>Nothing here</EmptyState.Title>
        </EmptyState>,
      );
      expect(screen.getByTestId("empty")).toContainElement(screen.getByTestId("illustration"));
    });

    it("carries the root, badge, title, description, and actions classes", () => {
      renderEmptyState();
      expect(screen.getByTestId("empty")).toHaveClass(styles.root ?? "");
      expect(screen.getByTestId("icon")).toHaveClass(styles.iconBadge ?? "");
      expect(screen.getByTestId("title")).toHaveClass(styles.title ?? "");
      expect(screen.getByTestId("description")).toHaveClass(styles.description ?? "");
      expect(screen.getByTestId("actions")).toHaveClass(styles.actions ?? "");
    });

    it("adds no role by default", () => {
      renderEmptyState();
      expect(screen.getByTestId("empty")).not.toHaveAttribute("role");
    });
  });

  describe("variant", () => {
    const classForVariant: Record<EmptyStateVariant, string | undefined> = {
      ghost: undefined,
      outlined: styles.outlined,
      dashed: styles.dashed,
      filled: styles.filled,
    };

    it("is ghost by default, with no variant class", () => {
      renderEmptyState();
      const root = screen.getByTestId("empty");
      for (const name of [styles.outlined, styles.dashed, styles.filled]) {
        expect(root).not.toHaveClass(name ?? "");
      }
    });

    it.each(Object.keys(classForVariant) as EmptyStateVariant[])("applies the %s variant", (variant) => {
      renderEmptyState({ variant });
      const root = screen.getByTestId("empty");
      const expected = classForVariant[variant];
      if (expected) expect(root).toHaveClass(expected);
      for (const [other, name] of Object.entries(classForVariant)) {
        if (other !== variant && name) expect(root).not.toHaveClass(name);
      }
    });
  });

  describe("size", () => {
    const classForSize: Record<EmptyStateSize, string | undefined> = {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      xl: styles.sizeXl,
    };
    const iconClassForSize: Record<EmptyStateSize, string | undefined> = {
      xs: iconStyles.sizeSm,
      sm: iconStyles.sizeMd,
      md: iconStyles.sizeLg,
      lg: iconStyles.sizeXl,
      xl: iconStyles.size2xl,
    };
    const titleClassForSize: Record<EmptyStateSize, string | undefined> = {
      xs: headingStyles.sizeBase,
      sm: headingStyles.sizeMd,
      md: headingStyles.sizeLg,
      lg: headingStyles.sizeXl,
      xl: headingStyles.size2xl,
    };
    const descriptionClassForSize: Record<EmptyStateSize, string | undefined> = {
      xs: textStyles.sizeSm,
      sm: textStyles.sizeSm,
      md: textStyles.sizeBase,
      lg: textStyles.sizeBase,
      xl: textStyles.sizeMd,
    };

    it("is md by default", () => {
      renderEmptyState();
      expect(screen.getByTestId("empty")).toHaveClass(styles.sizeMd ?? "");
    });

    it.each(Object.keys(classForSize) as EmptyStateSize[])(
      "steps the root, the icon, the title, and the description with size=%s",
      (size) => {
        renderEmptyState({ size });
        expect(screen.getByTestId("empty")).toHaveClass(classForSize[size] ?? "");
        expect(screen.getByTestId("icon").querySelector("svg")).toHaveClass(iconClassForSize[size] ?? "");
        expect(screen.getByTestId("title")).toHaveClass(titleClassForSize[size] ?? "");
        expect(screen.getByTestId("description")).toHaveClass(descriptionClassForSize[size] ?? "");
      },
    );

    it("gives a part rendered outside any EmptyState the md defaults", () => {
      render(<EmptyState.Title data-testid="title">Alone</EmptyState.Title>);
      expect(screen.getByTestId("title")).toHaveClass(headingStyles.sizeLg ?? "");
    });

    it("keeps a nested empty state's size to itself", () => {
      render(
        <EmptyState size="xl" data-testid="outer">
          <EmptyState.Title data-testid="outer-title">Outer</EmptyState.Title>
          <EmptyState size="xs" data-testid="inner">
            <EmptyState.Title data-testid="inner-title">Inner</EmptyState.Title>
          </EmptyState>
          <EmptyState.Description data-testid="outer-description">After the inner one</EmptyState.Description>
        </EmptyState>,
      );
      expect(screen.getByTestId("outer-title")).toHaveClass(headingStyles.size2xl ?? "");
      expect(screen.getByTestId("inner-title")).toHaveClass(headingStyles.sizeBase ?? "");
      // ...and the outer one is back to its own size after the inner one closes.
      expect(screen.getByTestId("outer-description")).toHaveClass(textStyles.sizeMd ?? "");
    });
  });

  describe("tone", () => {
    const classForTone: Record<EmptyStateTone, string | undefined> = {
      neutral: undefined,
      brand: styles.toneBrand,
      info: styles.toneInfo,
      success: styles.toneSuccess,
      warning: styles.toneWarning,
      danger: styles.toneDanger,
    };

    it("is neutral by default, with no tone class", () => {
      renderEmptyState();
      const root = screen.getByTestId("empty");
      for (const name of Object.values(classForTone)) {
        if (name) expect(root).not.toHaveClass(name);
      }
    });

    it.each(Object.keys(classForTone) as EmptyStateTone[])("applies the %s tone", (tone) => {
      renderEmptyState({ tone });
      const root = screen.getByTestId("empty");
      const expected = classForTone[tone];
      if (expected) expect(root).toHaveClass(expected);
      for (const [other, name] of Object.entries(classForTone)) {
        if (other !== tone && name) expect(root).not.toHaveClass(name);
      }
    });

    it("is decorative: the tone never adds text or an accessible name", () => {
      renderEmptyState({ tone: "danger" });
      expect(screen.getByTestId("empty")).toHaveTextContent("No invoices yetInvoices you create will show up here.Create invoice");
    });
  });

  describe("align", () => {
    it("centres by default, with no alignment class", () => {
      renderEmptyState();
      expect(screen.getByTestId("empty")).not.toHaveClass(styles.alignStart ?? "");
    });

    it("applies the start alignment", () => {
      renderEmptyState({ align: "start" });
      expect(screen.getByTestId("empty")).toHaveClass(styles.alignStart ?? "");
    });
  });

  describe("EmptyState.Icon", () => {
    it("is hidden from assistive technology by default", () => {
      renderEmptyState();
      const svg = screen.getByTestId("icon").querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).not.toHaveAttribute("role");
    });

    it("becomes an image with a text alternative when given a label", () => {
      render(
        <EmptyState>
          <EmptyState.Icon icon={TrayIcon} label="Empty tray" />
        </EmptyState>,
      );
      expect(screen.getByRole("img", { name: "Empty tray" })).toBeInTheDocument();
    });
  });

  describe("EmptyState.Title", () => {
    it.each([1, 2, 3, 4, 5, 6] as const)("renders level %i as the matching heading", (level) => {
      render(
        <EmptyState>
          <EmptyState.Title level={level}>Nothing here</EmptyState.Title>
        </EmptyState>,
      );
      expect(screen.getByRole("heading", { level, name: "Nothing here" })).toBeInTheDocument();
    });

    it("is semibold", () => {
      renderEmptyState();
      expect(screen.getByTestId("title")).toHaveClass(headingStyles.weightSemibold ?? "");
    });
  });

  describe("EmptyState.Description", () => {
    it("is set in the secondary text colour", () => {
      renderEmptyState();
      expect(screen.getByTestId("description")).toHaveClass(textStyles.colorSecondary ?? "");
    });
  });

  describe("accessibility wiring", () => {
    it("names the empty state from its own title with aria-labelledby", () => {
      render(
        <EmptyState role="region" aria-labelledby="empty-title">
          <EmptyState.Title id="empty-title">No invoices yet</EmptyState.Title>
        </EmptyState>,
      );
      expect(screen.getByRole("region", { name: "No invoices yet" })).toBeInTheDocument();
    });

    it("accepts a role, so a result of the user's own action can be announced", () => {
      renderEmptyState({ role: "status" });
      expect(screen.getByRole("status")).toBe(screen.getByTestId("empty"));
    });

    it("accepts aria-label and aria-describedby", () => {
      renderEmptyState({ role: "region", "aria-label": "Invoices", "aria-describedby": "d" });
      const root = screen.getByTestId("empty");
      expect(root).toHaveAttribute("aria-label", "Invoices");
      expect(root).toHaveAttribute("aria-describedby", "d");
    });

    it("keeps the reading order the same as the DOM order at every size and alignment", () => {
      renderEmptyState({ size: "xl", align: "start" });
      expect(screen.getByTestId("empty")).toHaveTextContent(
        "No invoices yetInvoices you create will show up here.Create invoice",
      );
    });
  });

  describe("standard props", () => {
    it("accepts className, style, id, and data-testid on the root", () => {
      render(
        <EmptyState className="custom" style={{ opacity: 0.5 }} id="root-id" data-testid="root">
          <EmptyState.Title>Nothing</EmptyState.Title>
        </EmptyState>,
      );
      const root = screen.getByTestId("root");
      expect(root).toHaveClass("custom");
      expect(root).toHaveClass(styles.root ?? "");
      expect(root).toHaveStyle({ opacity: "0.5" });
      expect(root).toHaveAttribute("id", "root-id");
    });

    it("passes native div attributes through to the root", () => {
      renderEmptyState({ title: "Invoices", lang: "fr" });
      const root = screen.getByTestId("empty");
      expect(root).toHaveAttribute("title", "Invoices");
      expect(root).toHaveAttribute("lang", "fr");
    });

    it("accepts className, style, id, and data-testid on every part", () => {
      render(
        <EmptyState>
          <EmptyState.Icon icon={TrayIcon} className="c" style={{ opacity: 0.5 }} id="i" data-testid="icon" />
          <EmptyState.Title className="c" style={{ opacity: 0.5 }} id="t" data-testid="title">
            T
          </EmptyState.Title>
          <EmptyState.Description className="c" style={{ opacity: 0.5 }} id="d" data-testid="description">
            D
          </EmptyState.Description>
          <EmptyState.Actions className="c" style={{ opacity: 0.5 }} id="a" data-testid="actions">
            A
          </EmptyState.Actions>
        </EmptyState>,
      );
      for (const [testId, id] of [
        ["icon", "i"],
        ["title", "t"],
        ["description", "d"],
        ["actions", "a"],
      ] as const) {
        const part = screen.getByTestId(testId);
        expect(part).toHaveClass("c");
        expect(part).toHaveStyle({ opacity: "0.5" });
        expect(part).toHaveAttribute("id", id);
      }
    });

    it("passes native attributes through to the parts", () => {
      render(
        <EmptyState>
          <EmptyState.Title title="t" data-testid="title">
            T
          </EmptyState.Title>
          <EmptyState.Description lang="fr" data-testid="description">
            D
          </EmptyState.Description>
          <EmptyState.Actions title="a" data-testid="actions">
            A
          </EmptyState.Actions>
        </EmptyState>,
      );
      expect(screen.getByTestId("title")).toHaveAttribute("title", "t");
      expect(screen.getByTestId("description")).toHaveAttribute("lang", "fr");
      expect(screen.getByTestId("actions")).toHaveAttribute("title", "a");
    });

    it("forwards a ref on every part", () => {
      const root = createRef<HTMLDivElement>();
      const icon = createRef<HTMLDivElement>();
      const title = createRef<HTMLHeadingElement>();
      const description = createRef<HTMLParagraphElement>();
      const actions = createRef<HTMLDivElement>();
      render(
        <EmptyState ref={root}>
          <EmptyState.Icon icon={TrayIcon} ref={icon} />
          <EmptyState.Title ref={title}>T</EmptyState.Title>
          <EmptyState.Description ref={description}>D</EmptyState.Description>
          <EmptyState.Actions ref={actions}>A</EmptyState.Actions>
        </EmptyState>,
      );
      expect(root.current).toBeInstanceOf(HTMLDivElement);
      expect(icon.current).toBeInstanceOf(HTMLDivElement);
      expect(icon.current).toHaveClass(styles.iconBadge ?? "");
      expect(title.current).toBeInstanceOf(HTMLHeadingElement);
      expect(description.current).toBeInstanceOf(HTMLParagraphElement);
      expect(actions.current).toBeInstanceOf(HTMLDivElement);
    });

    it("lets a same-named prop never override the component's own classes", () => {
      renderEmptyState({ className: "custom" });
      expect(screen.getByTestId("empty")).toHaveClass(styles.root ?? "", "custom");
    });
  });

  describe("accessibility (jest-axe)", () => {
    it("has no violations for the default composition", async () => {
      const { container } = renderEmptyState();
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each(["ghost", "outlined", "dashed", "filled"] as const)("has no violations for the %s variant", async (variant) => {
      const { container } = renderEmptyState({ variant });
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each(["neutral", "brand", "info", "success", "warning", "danger"] as const)(
      "has no violations for the %s tone",
      async (tone) => {
        const { container } = renderEmptyState({ tone });
        expect(await axe(container)).toHaveNoViolations();
      },
    );

    it("has no violations as a status message", async () => {
      const { container } = renderEmptyState({ role: "status" });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations as a labelled region", async () => {
      const { container } = render(
        <EmptyState role="region" aria-labelledby="empty-title">
          <EmptyState.Icon icon={TrayIcon} label="Tray" />
          <EmptyState.Title id="empty-title">No invoices yet</EmptyState.Title>
        </EmptyState>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations at another heading level", async () => {
      const { container } = render(
        <>
          <h1>Billing</h1>
          <h2>Invoices</h2>
          <EmptyState>
            <EmptyState.Title level={3}>No invoices yet</EmptyState.Title>
          </EmptyState>
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

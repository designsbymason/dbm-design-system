import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../../atoms/Input";
import { FormField } from "../FormField";
import { FieldGroup } from "./FieldGroup";
import fieldLabelStyles from "../../atoms/FieldLabel/FieldLabel.module.css";
import type { FormFieldControlProps } from "../FormField";
import styles from "./FieldGroup.module.css";

const fields = (
  <>
    <FormField label="Street">{(field) => <Input {...field} />}</FormField>
    <FormField label="City">{(field) => <Input {...field} />}</FormField>
  </>
);

const bodyOf = () => screen.getByRole("group").querySelector(`.${styles.body}`) as HTMLElement;

describe("FieldGroup", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is a named group: a fieldset whose legend is its accessible name", () => {
    render(<FieldGroup legend="Shipping address">{fields}</FieldGroup>);
    const group = screen.getByRole("group", { name: "Shipping address" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group.querySelector("legend")).toHaveTextContent("Shipping address");
    expect(within(group).getByRole("textbox", { name: "Street" })).toBeInTheDocument();
  });

  it("describes the group with its description, and keeps a caller's own aria-describedby", () => {
    render(
      <FieldGroup legend="Address" description="Where to send it" aria-describedby="extra">
        {fields}
      </FieldGroup>,
    );
    const group = screen.getByRole("group", { name: "Address" });
    const ids = group.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe("extra");
    expect(document.getElementById(ids[1] as string)).toHaveTextContent("Where to send it");
  });

  it("shows a group-level error, announced and described, and marks the group invalid", () => {
    render(
      <FieldGroup legend="Contact" error="Give an email or a phone number">
        {fields}
      </FieldGroup>,
    );
    const group = screen.getByRole("group", { name: "Contact" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Give an email or a phone number");
    expect(group.getAttribute("aria-describedby")).toBe(alert.id);
    expect(group).toHaveAttribute("data-invalid");
    expect(group.className).toContain(styles.invalid);
  });

  it("has no description or error markup when it has neither", () => {
    render(<FieldGroup legend="Address">{fields}</FieldGroup>);
    const group = screen.getByRole("group");
    expect(group).not.toHaveAttribute("aria-describedby");
    expect(group).not.toHaveAttribute("data-invalid");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the legend for assistive tech but off the page with hideLegend", () => {
    render(
      <FieldGroup legend="Address" hideLegend>
        {fields}
      </FieldGroup>,
    );
    expect(screen.getByRole("group", { name: "Address" })).toBeInTheDocument();
    expect(screen.getByText("Address").className).not.toContain(styles.legend);
  });

  it("disables native controls through the fieldset, and every field inside", () => {
    render(
      <FieldGroup legend="Address" disabled>
        {fields}
      </FieldGroup>,
    );
    expect(screen.getByRole("group", { name: "Address" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Street" })).toBeDisabled();
  });

  it("sizes the legend from size", () => {
    render(
      <FieldGroup legend="Address" size="xl">
        {fields}
      </FieldGroup>,
    );
    expect(screen.getByText("Address").className).toContain(styles.sizeXl);
  });

  it("lays fields out horizontally when asked", () => {
    const { rerender } = render(<FieldGroup legend="DOB">{fields}</FieldGroup>);
    const body = () => screen.getByRole("group").querySelector(`.${styles.body}`);
    expect(body()?.className).not.toContain(styles.horizontal);
    rerender(
      <FieldGroup legend="DOB" orientation="horizontal">
        {fields}
      </FieldGroup>,
    );
    expect(body()?.className).toContain(styles.horizontal);
  });

  it("sets the gap between fields from the spacing scale", () => {
    render(
      <FieldGroup legend="Address" gap={8}>
        {fields}
      </FieldGroup>,
    );
    expect(bodyOf().style.getPropertyValue("--field-group-gap")).toBe("var(--dbm-space-8)");
    // the column gap follows the gap unless it is set
    expect(bodyOf().style.getPropertyValue("--field-group-column-gap")).toBe("var(--dbm-space-8)");
  });

  it("takes a breakpoint map for gap and a separate columnGap", () => {
    render(
      <FieldGroup legend="Address" gap={{ base: 2, md: 8 }} columnGap={{ base: 6 }} orientation="horizontal">
        {fields}
      </FieldGroup>,
    );
    // jsdom matches no media query, so the base values apply
    expect(bodyOf().style.getPropertyValue("--field-group-gap")).toBe("var(--dbm-space-2)");
    expect(bodyOf().style.getPropertyValue("--field-group-column-gap")).toBe("var(--dbm-space-6)");
  });

  it("sizes the legend apart from the fields with legendSize", () => {
    render(
      <FieldGroup legend="Address" size="sm" legendSize="xl">
        {fields}
      </FieldGroup>,
    );
    expect(screen.getByText("Address").className).toContain(styles.sizeXl);
    expect(screen.getByText("Address").className).not.toContain(styles.sizeSm);
  });

  it("marks the legend required, visually only", () => {
    const { rerender } = render(
      <FieldGroup legend="Contact" required>
        {fields}
      </FieldGroup>,
    );
    const marker = screen.getByText("*");
    expect(marker).toHaveAttribute("aria-hidden", "true");
    // the accessible name is just the legend text
    expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
    rerender(
      <FieldGroup legend="Contact" required hideLegend>
        {fields}
      </FieldGroup>,
    );
    expect(screen.queryByText("*")).toBeNull();
  });

  it("shows the error instead of the description, and describes the group by the error alone", () => {
    render(
      <FieldGroup legend="Contact" description="Only for orders" error="Give an email or a phone">
        {fields}
      </FieldGroup>,
    );
    expect(screen.queryByText("Only for orders")).toBeNull();
    const group = screen.getByRole("group", { name: "Contact" });
    expect(group.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });

  describe("columns and FieldGroup.Item", () => {
    const grid = (span?: number | { base: number; md: number }) => (
      <FieldGroup legend="Address" columns={3} orientation="horizontal">
        <FieldGroup.Item span={span} data-testid="wide">
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
        <FieldGroup.Item data-testid="narrow">
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
      </FieldGroup>
    );

    it("lays the fields out on a grid of that many columns, over orientation", () => {
      render(grid());
      expect(bodyOf().className).toContain(styles.columns);
      expect(bodyOf().className).not.toContain(styles.horizontal);
      expect(bodyOf().style.getPropertyValue("--field-group-columns")).toBe("3");
    });

    it("spans cells across columns, and clamps a span wider than the grid", () => {
      const { rerender } = render(grid(2));
      expect(screen.getByTestId("wide").style.gridColumn).toBe("span 2");
      expect(screen.getByTestId("narrow").style.gridColumn).toBe("");
      rerender(grid(9));
      expect(screen.getByTestId("wide").style.gridColumn).toBe("span 3");
    });

    it("takes a breakpoint map for the span", () => {
      render(grid({ base: 1, md: 3 }));
      expect(screen.getByTestId("wide").style.gridColumn).toBe("");
    });

    it("warns once in development for a span that is not a positive whole number", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(grid(0));
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/FieldGroup\.Item: `span`/);
      expect(screen.getByTestId("wide").style.gridColumn).toBe("");
    });

    it("is a plain wrapper outside a grid, forwarding its ref and props", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <FieldGroup legend="Address">
          <FieldGroup.Item ref={ref} span={2} className="mine" style={{ marginBlockStart: "4px" }} data-testid="cell">
            {fields}
          </FieldGroup.Item>
        </FieldGroup>,
      );
      const cell = screen.getByTestId("cell");
      expect(ref.current).toBe(cell);
      expect(cell).toHaveClass("mine");
      expect(cell.style.marginBlockStart).toBe("4px");
    });
  });

  describe("nested inside another group", () => {
    const inner = (props: { size?: "xs" }) => (
      <FieldGroup legend="Inner" {...props}>
        <FormField label="Street">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    );

    it("inherits a disabled outer group, which an enabled inner group can't undo", () => {
      render(
        <FieldGroup legend="Outer" disabled>
          {inner({})}
        </FieldGroup>,
      );
      expect(screen.getByRole("textbox", { name: "Street" })).toBeDisabled();
    });

    it("inherits the outer size for whatever the inner group leaves out", () => {
      render(
        <FieldGroup legend="Outer" size="lg">
          {inner({})}
        </FieldGroup>,
      );
      expect(screen.getByText("Inner").className).toContain(styles.sizeLg);
    });

    it("hands the inner fields the outer group's disabled state through the context, not only the native fieldset", () => {
      render(
        <FieldGroup legend="Outer" disabled>
          {inner({})}
        </FieldGroup>,
      );
      // The FormField's own label dims: that comes from the context, where the native fieldset only disables the input.
      expect(screen.getByText("Street").className).toContain(fieldLabelStyles.disabled);
    });

    it("hands the inner fields the outer size, and the inner group's own size wins over it", () => {
      const sizes: Array<FormFieldControlProps["size"]> = [];
      const field = (
        <FormField label="Street">
          {(f) => {
            sizes.push(f.size);
            return <Input {...f} />;
          }}
        </FormField>
      );
      const { rerender } = render(
        <FieldGroup legend="Outer" size="lg">
          <FieldGroup legend="Inner">{field}</FieldGroup>
        </FieldGroup>,
      );
      expect(new Set(sizes)).toEqual(new Set(["lg"]));
      sizes.length = 0;
      rerender(
        <FieldGroup legend="Outer" size="lg">
          <FieldGroup legend="Inner" size="xs">
            {field}
          </FieldGroup>
        </FieldGroup>,
      );
      expect(new Set(sizes)).toEqual(new Set(["xs"]));
    });

    it("lets the inner group's own size win", () => {
      render(
        <FieldGroup legend="Outer" size="lg">
          {inner({ size: "xs" })}
        </FieldGroup>,
      );
      expect(screen.getByText("Inner").className).toContain(styles.sizeXs);
    });
  });

  it("forwards its ref to the fieldset, and className, style, id and data-testid reach it", () => {
    const ref = createRef<HTMLFieldSetElement>();
    render(
      <FieldGroup
        ref={ref}
        legend="Address"
        className="mine"
        style={{ marginBlockStart: "8px" }}
        id="addr"
        data-testid="group"
      >
        {fields}
      </FieldGroup>,
    );
    const group = screen.getByTestId("group");
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("mine");
    expect(group.style.marginBlockStart).toBe("8px");
    expect(group.id).toBe("addr");
  });

  it("keeps its computed disabled state against a same-named prop spread", () => {
    render(
      <FieldGroup legend="Address" disabled>
        {fields}
      </FieldGroup>,
    );
    expect(screen.getByRole("group")).toBeDisabled();
  });

  it("warns once in development when the legend is empty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<FieldGroup legend="">{fields}</FieldGroup>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/FieldGroup: empty `legend`/);
  });

  it("warns once, and falls back to the plain layout, for columns that aren't a positive whole number", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <FieldGroup legend="Address" columns={1.5}>
        {fields}
      </FieldGroup>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/`columns` must be a positive whole number/);
    expect(bodyOf().className).not.toContain(styles.columns);
  });

  it("passes form and name to the fieldset", () => {
    render(
      <FieldGroup legend="Preferences" form="settings" name="prefs">
        {fields}
      </FieldGroup>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("form", "settings");
    expect(screen.getByRole("group")).toHaveAttribute("name", "prefs");
  });

  it("renders on the server without touching the browser, with every part in place", () => {
    const html = renderToString(
      <FieldGroup legend="Address" description="Hint" required columns={{ base: 1, md: 3 }} gap={{ base: 2, md: 6 }}>
        <FieldGroup.Item span={2}>{fields}</FieldGroup.Item>
      </FieldGroup>,
    );
    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend");
    expect(html).toContain("Hint");
  });

  it("works inside StrictMode", () => {
    render(
      <StrictMode>
        <FieldGroup legend="Address" description="Hint" error="Bad">
          {fields}
        </FieldGroup>
      </StrictMode>,
    );
    expect(screen.getByRole("group", { name: "Address" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container, rerender } = render(
      <FieldGroup legend="Address" description="Where to send it" error="Check this">
        {fields}
      </FieldGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
    rerender(
      <FieldGroup legend="Address" hideLegend disabled variant="outlined" orientation="horizontal">
        {fields}
      </FieldGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../../atoms/Input";
import { FormField } from "../FormField";
import { FieldGroup } from "./FieldGroup";
import styles from "./FieldGroup.module.css";

const fields = (
  <>
    <FormField label="Street">{(field) => <Input {...field} />}</FormField>
    <FormField label="City">{(field) => <Input {...field} />}</FormField>
  </>
);

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
    expect(screen.getByRole("group").style.getPropertyValue("--field-group-gap")).toBe(
      "var(--dbm-space-8)",
    );
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

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { DescriptionList } from "./DescriptionList";
import styles from "./DescriptionList.module.css";

const BasicList = () => (
  <DescriptionList>
    <DescriptionList.Item>
      <DescriptionList.Term>Customer</DescriptionList.Term>
      <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
    </DescriptionList.Item>
    <DescriptionList.Item>
      <DescriptionList.Term>Status</DescriptionList.Term>
      <DescriptionList.Details>Paid</DescriptionList.Details>
    </DescriptionList.Item>
  </DescriptionList>
);

describe("DescriptionList", () => {
  it("renders a real <dl> with <dt>/<dd> pairs, each wrapped in its own <div>", () => {
    render(<BasicList />);
    const dl = screen.getByText("Customer").closest("dl");
    expect(dl?.tagName).toBe("DL");
    const term = screen.getByText("Customer");
    expect(term.tagName).toBe("DT");
    const details = screen.getByText("Jane Cooper");
    expect(details.tagName).toBe("DD");
    expect(term.parentElement).toBe(details.parentElement);
    expect(term.parentElement?.tagName).toBe("DIV");
  });

  it("defaults to variant bordered, size md, orientation horizontal, columns 1", () => {
    render(<BasicList />);
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    expect(dl).toHaveClass(styles.bordered as string);
    expect(dl).toHaveClass(styles.dividers as string);
    const item = screen.getByText("Customer").closest("div") as HTMLElement;
    expect(item).toHaveClass(styles.orientationHorizontal as string);
    const term = screen.getByText("Customer");
    const details = screen.getByText("Jane Cooper");
    expect(term).toHaveClass(styles.termSizeMd as string);
    expect(details).toHaveClass(styles.detailsSizeMd as string);
    expect(item).toHaveClass(styles.itemSizeMd as string);
    expect(dl).toHaveClass(styles.alignedTerms as string);
    expect(item).toHaveClass(styles.itemContents as string);
  });

  it("applies variant, size, and orientation to the dl/items/term/details", () => {
    render(
      <DescriptionList variant="ghost" size="lg" orientation="vertical">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    expect(dl).not.toHaveClass(styles.bordered as string);
    const item = screen.getByText("Customer").closest("div") as HTMLElement;
    expect(item).toHaveClass(styles.orientationVertical as string);
    expect(screen.getByText("Customer")).toHaveClass(styles.termSizeLg as string);
    expect(screen.getByText("Jane Cooper")).toHaveClass(styles.detailsSizeLg as string);
  });

  it("drops the automatic between-item divider once columns is more than 1", () => {
    render(
      <DescriptionList columns={2}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    expect(dl).not.toHaveClass(styles.dividers as string);
  });

  it("drops alignedTerms once columns is more than 1, even though the prop defaults to true", () => {
    render(
      <DescriptionList columns={2}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    const item = screen.getByText("Customer").closest("div") as HTMLElement;
    expect(dl).not.toHaveClass(styles.alignedTerms as string);
    expect(item).not.toHaveClass(styles.itemContents as string);
  });

  it("drops alignedTerms for orientation vertical, even at the default columns of 1", () => {
    render(
      <DescriptionList orientation="vertical">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    const item = screen.getByText("Customer").closest("div") as HTMLElement;
    expect(dl).not.toHaveClass(styles.alignedTerms as string);
    expect(item).not.toHaveClass(styles.itemContents as string);
  });

  it("lets alignedTerms={false} opt back into the original per-item term width", () => {
    render(
      <DescriptionList alignedTerms={false}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    const item = screen.getByText("Customer").closest("div") as HTMLElement;
    expect(dl).not.toHaveClass(styles.alignedTerms as string);
    expect(item).not.toHaveClass(styles.itemContents as string);
    // The divider still applies — alignedTerms and dividers are independent.
    expect(dl).toHaveClass(styles.dividers as string);
  });

  it("draws the between-item divider on the term/details themselves once alignedTerms makes the item display: contents", () => {
    render(<BasicList />);
    const secondTerm = screen.getByText("Status");
    const secondDetails = screen.getByText("Paid");
    expect(secondTerm).toHaveClass(styles.term as string);
    expect(secondDetails).toHaveClass(styles.details as string);
    // The CSS divider rule is `.dividers.alignedTerms > .item:not(:first-child) > .term`,
    // which only requires the term/details to be a second-or-later Item's direct children —
    // confirmed structurally here (jsdom can't evaluate the border itself, an actual
    // painted style, so this is the real-browser story's job; see
    // ResponsiveLayoutChecks/AlignedTermsChecks in DescriptionList.stories.tsx).
    const secondItem = secondTerm.parentElement as HTMLElement;
    expect(secondItem).toHaveClass(styles.itemContents as string);
    const items = screen.getAllByText(/Customer|Status/).map((el) => el.parentElement);
    expect(items[0]).not.toBe(items[1]);
  });

  it("sets --dl-cols-base from a plain columns number", () => {
    render(
      <DescriptionList columns={3}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    expect(dl.style.getPropertyValue("--dl-cols-base")).toBe("3");
  });

  it("sets one --dl-cols-<breakpoint> custom property per entry of a responsive columns map", () => {
    render(
      <DescriptionList columns={{ base: 1, md: 3 }}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    expect(dl.style.getPropertyValue("--dl-cols-base")).toBe("1");
    expect(dl.style.getPropertyValue("--dl-cols-md")).toBe("3");
  });

  it("sets grid-column: span N on an Item with an explicit span", () => {
    render(
      <DescriptionList columns={2}>
        <DescriptionList.Item span={2}>
          <DescriptionList.Term>Notes</DescriptionList.Term>
          <DescriptionList.Details>A long note spanning the row</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const item = screen.getByText("Notes").closest("div") as HTMLElement;
    expect(item.style.gridColumn).toBe("span 2");
  });

  it("warns in development and ignores a non-positive span", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <DescriptionList columns={2}>
        <DescriptionList.Item span={0}>
          <DescriptionList.Term>Notes</DescriptionList.Term>
          <DescriptionList.Details>Value</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("DescriptionList.Item"));
    const item = screen.getByText("Notes").closest("div") as HTMLElement;
    expect(item.style.gridColumn).toBe("");
    warnSpy.mockRestore();
  });

  it("warns only once per item across re-renders with the same invalid span", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <DescriptionList columns={2}>
        <DescriptionList.Item span={-1}>
          <DescriptionList.Term>Notes</DescriptionList.Term>
          <DescriptionList.Details>Value</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    rerender(
      <DescriptionList columns={2}>
        <DescriptionList.Item span={-1}>
          <DescriptionList.Term>Notes</DescriptionList.Term>
          <DescriptionList.Details>Updated value</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("marks a numeric Details with tabular-nums, without changing alignment", () => {
    render(
      <DescriptionList>
        <DescriptionList.Item>
          <DescriptionList.Term>Amount</DescriptionList.Term>
          <DescriptionList.Details numeric>$1,234.00</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect(screen.getByText("$1,234.00")).toHaveClass(styles.numeric as string);
  });

  it("applies aria-label/aria-labelledby/aria-describedby to the dl", () => {
    render(
      <div>
        <h2 id="heading">Order summary</h2>
        <p id="desc">Details for this order</p>
        <DescriptionList aria-labelledby="heading" aria-describedby="desc">
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>,
    );
    const dl = screen.getByText("Customer").closest("dl") as HTMLElement;
    expect(dl).toHaveAttribute("aria-labelledby", "heading");
    expect(dl).toHaveAttribute("aria-describedby", "desc");
  });

  it("forwards ref to the <dl>", () => {
    const ref = createRef<HTMLDListElement>();
    render(
      <DescriptionList ref={ref}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDListElement);
    expect(ref.current?.tagName).toBe("DL");
  });

  it("forwards ref on Item/Term/Details to their real elements", () => {
    const itemRef = createRef<HTMLDivElement>();
    const termRef = createRef<HTMLElement>();
    const detailsRef = createRef<HTMLElement>();
    render(
      <DescriptionList>
        <DescriptionList.Item ref={itemRef}>
          <DescriptionList.Term ref={termRef}>Customer</DescriptionList.Term>
          <DescriptionList.Details ref={detailsRef}>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect(itemRef.current?.tagName).toBe("DIV");
    expect(termRef.current?.tagName).toBe("DT");
    expect(detailsRef.current?.tagName).toBe("DD");
  });

  it("applies className, style, id, and data-testid to the dl", () => {
    render(
      <DescriptionList
        className="custom"
        style={{ marginTop: "1rem" }}
        id="order-summary"
        data-testid="summary-list"
      >
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    const dl = screen.getByTestId("summary-list");
    expect(dl).toHaveClass("custom");
    expect(dl).toHaveStyle({ marginTop: "1rem" });
    expect(dl).toHaveAttribute("id", "order-summary");
  });

  it("applies className, style, id, and data-testid to an Item/Term/Details", () => {
    render(
      <DescriptionList>
        <DescriptionList.Item className="item-custom" style={{ opacity: 0.5 }} id="item-1" data-testid="item">
          <DescriptionList.Term className="term-custom" id="term-1" data-testid="term">
            Customer
          </DescriptionList.Term>
          <DescriptionList.Details className="details-custom" id="details-1" data-testid="details">
            Jane Cooper
          </DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect(screen.getByTestId("item")).toHaveClass("item-custom");
    expect(screen.getByTestId("item")).toHaveAttribute("id", "item-1");
    expect(screen.getByTestId("term")).toHaveClass("term-custom");
    expect(screen.getByTestId("term")).toHaveAttribute("id", "term-1");
    expect(screen.getByTestId("details")).toHaveClass("details-custom");
    expect(screen.getByTestId("details")).toHaveAttribute("id", "details-1");
  });

  it("has no accessibility violations — bordered, ghost, vertical orientation, and multi-column", async () => {
    const { container: bordered } = render(<BasicList />);
    expect((await axe(bordered)).violations).toHaveLength(0);

    const { container: ghost } = render(
      <DescriptionList variant="ghost">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect((await axe(ghost)).violations).toHaveLength(0);

    const { container: vertical } = render(
      <DescriptionList orientation="vertical">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect((await axe(vertical)).violations).toHaveLength(0);

    const { container: multiColumn } = render(
      <DescriptionList columns={2}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>,
    );
    expect((await axe(multiColumn)).violations).toHaveLength(0);
  });
});

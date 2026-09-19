// The code shown under each story's "Show code" button on Accordion's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`DemoItems`, `demoContainerStyle`),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { AccordionHeadingLevel, AccordionOrientation, AccordionSize, AccordionVariant } from "./Accordion.types";

const faqItems = `  <Accordion.Item value="shipping">
    <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
    <Accordion.Content>
      Standard shipping takes 3-5 business days. Express shipping arrives next day.
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="returns">
    <Accordion.Trigger>What's your return policy?</Accordion.Trigger>
    <Accordion.Content>
      Unused items can be returned within 30 days of delivery for a full refund.
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="warranty">
    <Accordion.Trigger>Is there a warranty?</Accordion.Trigger>
    <Accordion.Content>Every product ships with a 1-year limited manufacturer warranty.</Accordion.Content>
  </Accordion.Item>`;

const accordion = (attributes: string, children: string) =>
  `<Accordion${attributes ? ` ${attributes}` : ""}>\n${children}\n</Accordion>`;

const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : line))
    .join("\n");

export const accordionSnippets = {
  multiple: `{/* type="multiple" lets several items be open at once (defaultValue is then an array) */}
${accordion('type="multiple" defaultValue={["shipping", "warranty"]}', faqItems)}`,

  disabledItem: `{/* disabled on an Item keeps just that item from opening */}
<Accordion defaultValue="shipping">
  <Accordion.Item value="shipping">
    <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
    <Accordion.Content>Standard shipping takes 3-5 business days.</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="returns" disabled>
    <Accordion.Trigger>What's your return policy? (disabled)</Accordion.Trigger>
    <Accordion.Content>Unused items can be returned within 30 days of delivery.</Accordion.Content>
  </Accordion.Item>
</Accordion>`,

  customIcon: `{/* RocketLaunchIcon comes from @dbm-design-system/icons */}
<Accordion defaultValue="shipping">
  <Accordion.Item value="shipping">
    <Accordion.Trigger icon={RocketLaunchIcon}>How long does shipping take?</Accordion.Trigger>
    <Accordion.Content>Standard shipping takes 3-5 business days.</Accordion.Content>
  </Accordion.Item>
</Accordion>`,

  asChildTrigger: `{/* With asChild the trigger renders your own element, and is responsible for drawing its own
    disclosure indicator, if any. RocketLaunchIcon comes from @dbm-design-system/icons. */}
<Accordion defaultValue="shipping">
  <Accordion.Item value="shipping">
    <Accordion.Trigger asChild>
      <button type="button" className="my-trigger">
        <Icon icon={RocketLaunchIcon} size="sm" tone="brand" />
        <Text size="sm" weight="semibold">A fully custom trigger row</Text>
      </button>
    </Accordion.Trigger>
    <Accordion.Content>
      With asChild, the trigger is responsible for rendering its own disclosure indicator, if any.
    </Accordion.Content>
  </Accordion.Item>
</Accordion>`,

  ghost: `{/* variant="ghost" drops the accordion's own border, for one inside a container that already
    has one — here a Card. */}
<Card>
  <Card.Header>
    <Heading level={3}>Shipping &amp; returns</Heading>
  </Card.Header>
${indent(accordion('variant="ghost" defaultValue="shipping"', faqItems), 2)}
</Card>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — trigger padding and type size */}
<Accordion size="sm">
  <Accordion.Item value="shipping">
    <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
    <Accordion.Content>Standard shipping takes 3-5 business days.</Accordion.Content>
  </Accordion.Item>
</Accordion>`,

  controlled: `{/* You own the open item: const [value, setValue] = useState("shipping");
    value is the open item's value, or "" when none is open. */}
<Accordion value={value} onValueChange={setValue}>
${faqItems}
</Accordion>`,

  keyboardInteraction: `{/* Click (or press Enter or Space) to open an item; ArrowUp and ArrowDown move focus between triggers. */}
${accordion("", faqItems)}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface AccordionPlaygroundSnippetArgs {
  type?: "single" | "multiple";
  variant?: AccordionVariant;
  size?: AccordionSize;
  disabled?: boolean;
  orientation?: AccordionOrientation;
  headingLevel?: AccordionHeadingLevel;
  collapsible?: boolean;
  defaultValue?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, on a small real FAQ. Under `type="multiple"` the
 * single default value becomes a one-element array, as the demo itself does.
 */
export function accordionPlaygroundSnippet(args: AccordionPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.type === "multiple") {
    attributes.push('type="multiple"');
    if (args.defaultValue) attributes.push(`defaultValue={["${args.defaultValue}"]}`);
  } else {
    // `collapsible` defaults to true, so it only needs writing when it's off.
    if (args.collapsible === false) attributes.push("collapsible={false}");
    if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  }
  if (args.variant && args.variant !== "bordered") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.disabled) attributes.push("disabled");
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  if (args.headingLevel && args.headingLevel !== 3) attributes.push(`headingLevel={${args.headingLevel}}`);
  return accordion(attributes.join(" "), faqItems);
}

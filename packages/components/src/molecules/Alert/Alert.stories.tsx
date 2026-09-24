import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { StarIcon } from "@dbm-design-system/icons";
import { usePersistentDismiss } from "@dbm-design-system/primitives";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Alert } from "./Alert";
import { alertPlaygroundSnippet, alertSnippets } from "./Alert.snippets";
import type { AlertProps, AlertRole, AlertSize, AlertTone, AlertVariant } from "./Alert.types";

// `Alert.Title`, `Alert.Description` and `Alert.Actions` each get their own Properties table via a hidden docs-only
// stories file (guidelines/adr/0013), where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  tone: AlertTone;
  variant: AlertVariant;
  size: AlertSize;
  // "Default" is the tone's own icon, "None" is `false`, "Star" is a custom one.
  icon: AlertProps["icon"];
  banner: boolean;
  sticky: boolean;
  stickyOffset: AlertProps["stickyOffset"];
  dismissible: boolean;
  open: boolean;
  defaultOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: AlertRole | "Default";
  dir: "ltr" | "rtl";
  labels: AlertProps["labels"];
  scrollContainerRef: AlertProps["scrollContainerRef"];
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  children: AlertProps["children"];
}

const demoContainerStyle = { maxWidth: "40rem" } as const;

/** A small, real alert the gallery stories vary. */
const DemoAlert = (props: Partial<AlertProps>) => (
  <Alert {...props}>
    <Alert.Title>Payment failed</Alert.Title>
    <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
  </Alert>
);

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" } as const;

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const noControls = {
  tone: { control: false },
  variant: { control: false },
  size: { control: false },
  icon: { control: false },
  banner: { control: false },
  sticky: { control: false },
  stickyOffset: { control: false },
  dismissible: { control: false },
  open: { control: false },
  defaultOpen: { control: false },
  role: { control: false },
  dir: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Feedback/Alert",
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description:
        "The message: Alert.Title, Alert.Description and Alert.Actions in any order, any of them optional — or plain text, for the shortest alert.",
    },
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger", "neutral"],
      description:
        "What the message is about: info (neutral news), success (something worked), warning (needs attention), danger (something went wrong) or neutral (a plain notice). Sets the colours, the default icon and how it is announced.",
      table: { defaultValue: { summary: '"info"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description:
        "How it is drawn: subtle (a soft tint of the tone with a faint border), outlined (the page's surface with a border in the tone's colour) or solid (the tone's full colour).",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and type size.",
      table: { defaultValue: { summary: '"md"' } },
    },
    icon: {
      control: false,
      description:
        "The icon before the message — a component reference from @dbm-design-system/icons, not a string name. Each tone has its own; pass another to replace it, or false for none. Decorative.",
    },
    banner: {
      control: "boolean",
      description:
        "Draws it edge to edge, with square corners and no side borders — for a message that spans a whole page or section.",
      table: { defaultValue: { summary: "false" } },
    },
    sticky: {
      control: "boolean",
      description:
        "Keeps it at the top of the page (or of scrollContainerRef) as the reader scrolls, lifted with a shadow while stuck. Built on Affix.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "How far from the top a sticky alert sticks, from the spacing token scale — for a page whose own header is also sticky. Has no effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    scrollContainerRef: {
      control: false,
      description:
        "The scrollable container a sticky alert sticks within, if it isn't the page itself. Has no effect without sticky. The same prop Affix and BackToTop take.",
    },
    dismissible: {
      control: "boolean",
      description:
        "Adds a button that dismisses it: onOpenChange(false) is called and, unless open is controlled, it hides. Combine with usePersistentDismiss to remember the dismissal across visits.",
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      control: "boolean",
      description: "Whether it is showing, when controlled. Pair with onOpenChange.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether it starts out showing, when uncontrolled.",
      table: { defaultValue: { summary: "true" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with false when it is dismissed. It never calls with true — nothing inside it can reopen it.",
    },
    role: {
      control: "select",
      options: ["alert", "status", "none"],
      description:
        'How it is announced: "alert" interrupts, "status" waits for a pause, "none" is plain text that isn\'t announced. Left out, it follows the tone: alert for danger and warning, status for the rest.',
    },
    labels: {
      control: false,
      description: 'The text the component supplies itself, each part replaceable: dismiss (the dismiss button\'s accessible name, "Dismiss").',
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, a native attribute: mirrors the layout, so the icon and the dismiss button swap sides.",
    },
    "aria-label": { control: "text", description: "The alert's accessible name, when it needs one of its own." },
    "aria-labelledby": { control: false, description: "The id of an element that names the alert." },
    "aria-describedby": { control: false, description: "The id of an element that describes it." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    tone: "info",
    variant: "subtle",
    size: "md",
    icon: undefined,
    banner: false,
    sticky: false,
    stickyOffset: 0,
    dismissible: false,
    defaultOpen: true,
    role: "Default",
    dir: "ltr",
    "aria-label": "",
  },
  render: (args) => <PlaygroundAlert {...args} />,
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/**
 * The Playground's alert, controlled so that dismissing it can be undone — otherwise the demo would be gone for good the
 * first time the dismiss button was used.
 */
function PlaygroundAlert(args: PlaygroundArgs) {
  const [open, setOpen] = useState(true);
  return (
    <div style={demoContainerStyle}>
      <Alert
        tone={args.tone}
        variant={args.variant}
        size={args.size}
        icon={args.icon}
        banner={args.banner}
        sticky={args.sticky}
        stickyOffset={args.stickyOffset}
        dismissible={args.dismissible}
        open={open}
        onOpenChange={setOpen}
        role={args.role === "Default" ? undefined : args.role}
        dir={args.dir}
        aria-label={args["aria-label"] || undefined}
      >
        <Alert.Title>Payment failed</Alert.Title>
        <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
        <Alert.Actions>
          <Button size="sm">Update card</Button>
          <Button size="sm" variant="tertiary">
            Remind me later
          </Button>
        </Alert.Actions>
      </Alert>
      {!open && (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Show it again
        </Button>
      )}
    </div>
  );
}

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The Playground's own controls add a way to leave `icon` and `role` out ("Default") and a custom icon to try — not
  // values the props take, so they stay out of the meta-level argTypes the Properties table reads.
  argTypes: {
    icon: {
      control: "select",
      options: ["Default", "None", "Star"],
      mapping: { Default: undefined, None: false, Star: StarIcon },
    },
    role: {
      control: "select",
      options: ["Default", "alert", "status", "none"],
      mapping: { Default: undefined, alert: "alert", status: "status", none: "none" },
    },
  },
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => alertPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.tones } } },
  render: () => (
    <div data-testid="tones" style={{ ...demoContainerStyle, ...stack }}>
      {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
        <Alert key={tone} tone={tone}>
          <Alert.Title>{tone.charAt(0).toUpperCase() + tone.slice(1)}</Alert.Title>
          <Alert.Description>A message with the {tone} tone.</Alert.Description>
        </Alert>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — the demo never changes. Danger and warning interrupt; the rest wait.
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
    await expect(canvas.getAllByRole("status")).toHaveLength(3);
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.variants } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack, gap: "var(--dbm-space-8)" }}>
      {(["subtle", "outlined", "solid"] as const).map((variant) => (
        <div key={variant} style={stack}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
            <Alert key={tone} tone={tone} variant={variant} role="none">
              <Alert.Description>A {tone} message, {variant}.</Alert.Description>
            </Alert>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.sizes } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Alert key={size} size={size} dismissible role="none">
          <Alert.Title>size=&quot;{size}&quot;</Alert.Title>
          <Alert.Description>Your card was declined.</Alert.Description>
        </Alert>
      ))}
    </div>
  ),
};

export const WithActions: Story = {
  name: "With actions",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.actions } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="warning">
        <Alert.Title>Payment failed</Alert.Title>
        <Alert.Description>Your card was declined. Update it to keep your plan.</Alert.Description>
        <Alert.Actions>
          <Button size="sm">Update card</Button>
          <Button size="sm" variant="tertiary">
            Remind me later
          </Button>
        </Alert.Actions>
      </Alert>
    </div>
  ),
};

export const TitleOnly: Story = {
  name: "Title only",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.titleOnly } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="success">
        <Alert.Title>Your changes were saved</Alert.Title>
      </Alert>
    </div>
  ),
};

export const PlainText: Story = {
  name: "Plain text",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.plainText } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert>Your session will expire in five minutes.</Alert>
    </div>
  ),
};

export const Icons: Story = {
  name: "Icons",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.icons } } },
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert icon={false} role="none">
        <Alert.Description>No icon on this one.</Alert.Description>
      </Alert>
      <Alert icon={StarIcon} tone="neutral" role="none">
        <Alert.Description>Your own icon replaces the tone&apos;s.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const Banner: Story = {
  name: "Banner",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.banner } } },
  render: () => (
    <div data-testid="banner-frame" style={{ ...demoContainerStyle, border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)" }}>
      <Alert banner tone="warning" role="none">
        <Alert.Title>Scheduled maintenance</Alert.Title>
        <Alert.Description>The dashboard will be read-only on Sunday from 02:00 to 04:00 UTC.</Alert.Description>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only. A banner has square corners and no side borders, so it meets its container's edges.
    const alert = within(canvasElement).getByText("Scheduled maintenance").closest("div[class*='root']") as HTMLElement;
    const style = getComputedStyle(alert);
    await expect(style.borderTopLeftRadius).toBe("0px");
    await expect(style.borderInlineStartWidth).toBe("0px");
    await expect(style.borderInlineEndWidth).toBe("0px");
    await expect(style.borderBlockStartWidth).not.toBe("0px");
  },
};

export const Sticky: Story = {
  name: "Sticky",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.sticky } } },
  render: () => <StickyDemo />,
};

function StickyDemo() {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scroller}
      data-testid="scroller"
      style={{
        maxWidth: "40rem",
        height: "18rem",
        overflow: "auto",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-md)",
      }}
    >
      <Alert banner sticky dismissible scrollContainerRef={scroller} tone="warning" role="none" data-testid="sticky-alert">
        <Alert.Title>Scheduled maintenance</Alert.Title>
        <Alert.Description>The dashboard will be read-only on Sunday.</Alert.Description>
      </Alert>
      <div style={{ padding: "var(--dbm-space-4)", ...stack }}>
        <Text>Scroll this box: the alert stays at the top and lifts with a shadow while it is stuck.</Text>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index} color="secondary">
            Paragraph {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        ))}
      </div>
    </div>
  );
}

export const Dismissible: Story = {
  name: "Dismissible",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.dismissible } } },
  render: () => <DismissibleDemo />,
};

function DismissibleDemo() {
  const [key, setKey] = useState(0);
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert key={key} dismissible>
        <Alert.Title>Tip</Alert.Title>
        <Alert.Description>You can press ? at any time to see the keyboard shortcuts.</Alert.Description>
      </Alert>
      <Button size="sm" variant="secondary" onClick={() => setKey((count) => count + 1)}>
        Show it again
      </Button>
    </div>
  );
}

export const Controlled: Story = {
  name: "Controlled",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.controlled } } },
  render: () => <ControlledDemo />,
};

function ControlledDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert dismissible open={open} onOpenChange={setOpen}>
        <Alert.Title>Tip</Alert.Title>
        <Alert.Description>You own whether this is showing.</Alert.Description>
      </Alert>
      <Button size="sm" variant="secondary" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide it" : "Show it"}
      </Button>
    </div>
  );
}

export const Persistent: Story = {
  name: "Remembering a dismissal",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.persistent } } },
  render: () => <PersistentDemo />,
};

function PersistentDemo() {
  // A session-length key, so a reader who dismisses it here isn't left without the demo on the next visit for good.
  const { ready, dismissed, dismiss, reset } = usePersistentDismiss("docs-demo-alert", { storage: "session" });
  return (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <Alert banner dismissible open={ready && !dismissed} onOpenChange={(open) => !open && dismiss()}>
        <Alert.Title>Summer sale</Alert.Title>
        <Alert.Description>Everything is 20% off until Sunday. Dismiss this and reload the page: it stays away.</Alert.Description>
      </Alert>
      <Button size="sm" variant="secondary" onClick={reset} disabled={!dismissed}>
        Forget that it was dismissed
      </Button>
    </div>
  );
}

export const HeadingTitle: Story = {
  name: "A heading as the title",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.heading } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="warning">
        <Alert.Title asChild>
          <h2>Your trial ends soon</h2>
        </Alert.Title>
        <Alert.Description>Add a payment method to keep your projects.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const Roles: Story = {
  name: "How it is announced",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.role } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert tone="warning" role="none">
        <Alert.Title>Already on the page</Alert.Title>
        <Alert.Description>A message that is there when the page loads isn&apos;t news, so it needn&apos;t be announced.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  name: "Long content wraps",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.longContent } } },
  render: () => (
    <div data-testid="long" style={{ maxWidth: "22rem", resize: "horizontal", overflow: "auto" }}>
      <Alert dismissible role="none">
        <Alert.Title>A title that is long enough to run onto a second line in a narrow place</Alert.Title>
        <Alert.Description>
          A message with a very long unbroken address: https://example.com/a/very/long/path/that/has/no/break/points
        </Alert.Description>
      </Alert>
    </div>
  ),
};

export const Translated: Story = {
  name: "Translated text",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.translated } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Alert dismissible labels={{ dismiss: "Fermer" }}>
        <Alert.Title>Conseil</Alert.Title>
        <Alert.Description>Appuyez sur ? pour voir les raccourcis clavier.</Alert.Description>
      </Alert>
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: alertSnippets.rightToLeft } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoAlert dismissible dir="rtl" role="none" data-testid="rtl-alert" />
    </div>
  ),
};

// --- Real-browser tests: what jsdom can't evaluate. Hidden from the sidebar and the Docs page (`!dev`); each
// renders what it needs itself. ---

export const DismissInteraction: Story = {
  name: "Dismissing — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <button>Before</button>
      <Alert dismissible data-testid="dismissable">
        <Alert.Title>Tip</Alert.Title>
      </Alert>
      <button>After</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab(); // Before
    await userEvent.tab(); // the dismiss button
    const dismiss = canvas.getByRole("button", { name: "Dismiss" });
    await expect(dismiss).toHaveFocus();
    await expect(getComputedStyle(dismiss).outlineStyle).toBe("solid");
    await userEvent.keyboard("{Enter}");
    // The exit animation runs (the element is still there, closing), then it is gone from the page.
    await waitFor(() => expect(canvas.queryByTestId("dismissable")).not.toBeInTheDocument());
    // And focus went somewhere sensible instead of dropping to the top of the document.
    await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
  },
};

export const StickyInteraction: Story = {
  name: "Sticking — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <StickyDemo />,
  play: async ({ canvasElement }) => {
    const scroller = within(canvasElement).getByTestId("scroller");
    const alert = within(scroller).getByTestId("sticky-alert");
    const wrapper = alert.parentElement!.parentElement!;
    const top = () => Math.round(alert.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
    // At rest it sits at the top, and isn't stuck.
    await expect(wrapper.hasAttribute("data-stuck")).toBe(false);
    scroller.scrollTop = 300;
    // Scrolled: it is still at the top of the scroller, and is stuck (lifted with a shadow).
    await waitFor(() => expect(wrapper.hasAttribute("data-stuck")).toBe(true));
    await expect(Math.abs(top() - parseFloat(getComputedStyle(scroller).borderTopWidth))).toBeLessThanOrEqual(2);
    await expect(getComputedStyle(alert).boxShadow).not.toBe("none");
    scroller.scrollTop = 0;
    await waitFor(() => expect(wrapper.hasAttribute("data-stuck")).toBe(false));
  },
};

export const ColourInteraction: Story = {
  name: "Colours — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      {(["info", "success", "warning", "danger", "neutral"] as const).flatMap((tone) =>
        (["subtle", "outlined", "solid"] as const).map((variant) => (
          <Alert key={`${tone}-${variant}`} tone={tone} variant={variant} role="none" data-testid={`${tone}-${variant}`}>
            <Alert.Description>x</Alert.Description>
          </Alert>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const resolve = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      canvasElement.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    };
    const canvas = within(canvasElement);
    const solidBg = { info: "info", success: "success", warning: "warning", danger: "danger", neutral: "neutral" } as const;
    for (const tone of Object.keys(solidBg) as Array<keyof typeof solidBg>) {
      const subtle = getComputedStyle(canvas.getByTestId(`${tone}-subtle`));
      const outlined = getComputedStyle(canvas.getByTestId(`${tone}-outlined`));
      const solid = getComputedStyle(canvas.getByTestId(`${tone}-solid`));
      // Each variant draws with its own tone's tokens.
      await expect(subtle.backgroundColor).toBe(resolve(`--dbm-bg-${tone}-subtle`));
      await expect(outlined.backgroundColor).toBe(resolve("--dbm-bg-surface"));
      await expect(outlined.borderTopColor).toBe(resolve(tone === "neutral" ? "--dbm-border-neutral-strong" : `--dbm-border-${tone}`));
      await expect(solid.backgroundColor).toBe(resolve(`--dbm-bg-${tone}`));
      await expect(solid.color).toBe(resolve(`--dbm-text-on-${tone}`));
    }
  },
};

export const WrapInteraction: Story = {
  name: "Long content — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="narrow" style={{ width: "16rem" }}>
      <Alert dismissible role="none" data-testid="narrow-alert">
        <Alert.Title>A title that is long enough to run onto a second line in a narrow place</Alert.Title>
        <Alert.Description>https://example.com/a/very/long/path/that/has/no/break/points/at/all/anywhere</Alert.Description>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("narrow");
    const alert = within(box).getByTestId("narrow-alert");
    // Nothing pushes it wider than its container, and the dismiss button stays inside it.
    await expect(alert.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const dismiss = within(alert).getByRole("button", { name: "Dismiss" });
    await expect(dismiss.getBoundingClientRect().right).toBeLessThanOrEqual(alert.getBoundingClientRect().right);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ ...demoContainerStyle, ...stack }}>
      <DemoAlert dismissible dir="rtl" role="none" data-testid="rtl" />
      <DemoAlert dismissible role="none" data-testid="ltr" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sides = (id: string) => {
      const alert = canvas.getByTestId(id);
      const box = alert.getBoundingClientRect();
      const icon = alert.querySelector("svg")!.getBoundingClientRect();
      const dismiss = within(alert).getByRole("button", { name: "Dismiss" }).getBoundingClientRect();
      return { iconOnStart: icon.left - box.left < box.right - icon.right, dismissOnEnd: box.right - dismiss.right < dismiss.left - box.left };
    };
    // In left-to-right text the icon is at the left and the dismiss button at the right; right-to-left swaps them.
    await expect(sides("ltr")).toEqual({ iconOnStart: true, dismissOnEnd: true });
    await expect(sides("rtl")).toEqual({ iconOnStart: false, dismissOnEnd: false });
  },
};

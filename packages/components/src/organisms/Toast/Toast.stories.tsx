import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Toast, useToast } from "./Toast";
import { toastPlaygroundSnippet, toastSnippets } from "./Toast.snippets";
import type {
  ToastOptions,
  ToastPlacement,
  ToastRole,
  ToastSize,
  ToastTone,
  ToastVariant,
} from "./Toast.types";
import { ButtonRow, RaiseButton, sampleOptions, ToastStage } from "./ToastStoryKit";

// Combines the provider's own args (placement/limit/duration/…) with the options of one `toast()` call (tone/title/
// …) in one Playground: `meta.component` can only resolve docgen argTypes for one component, so the others are
// declared by hand below and threaded through `render`. The provider and the single toast each get their own
// Properties table from a hidden, docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  placement: ToastPlacement;
  limit: number;
  /** The control's option; the story maps `"never"` to `null`. */
  duration: 2000 | 5000 | 10000 | "never";
  size: ToastSize;
  variant: ToastVariant;
  dir: "ltr" | "rtl";
  tone: ToastTone;
  title: string;
  description: string;
  showAction: boolean;
  dismissible: boolean;
  loading: boolean;
  role: ToastRole | "auto";
  onOpenChange: (open: boolean) => void;
}

const durationFromArg = (duration: PlaygroundArgs["duration"]) => (duration === "never" ? null : duration);

const optionsFromArgs = (args: PlaygroundArgs): ToastOptions => ({
  tone: args.tone,
  title: args.title || undefined,
  description: args.description || undefined,
  loading: args.loading,
  dismissible: args.dismissible,
  role: args.role === "auto" ? undefined : args.role,
  action: args.showAction ? { label: "Undo", altText: "Undo from the Edit menu" } : undefined,
  onOpenChange: args.onOpenChange,
});

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => toastPlaygroundSnippet(context.args),
};

const noControls = {
  placement: { control: false },
  limit: { control: false },
  duration: { control: false },
  size: { control: false },
  variant: { control: false },
  dir: { control: false },
  tone: { control: false },
  title: { control: false },
  description: { control: false },
  showAction: { control: false },
  dismissible: { control: false },
  loading: { control: false },
  role: { control: false },
  onOpenChange: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Feedback/Toast",
  parameters: { layout: "padded" },
  argTypes: {
    placement: {
      control: "select",
      options: ["bottom-end", "bottom", "bottom-start", "top-end", "top", "top-start"],
      description:
        "The corner or edge the toasts stack against. start and end are logical: the left and right in left-to-right text, swapped in right-to-left. A mobile-first map switches it at a breakpoint.",
      table: { defaultValue: { summary: '"bottom-end"' } },
    },
    limit: {
      control: { type: "number", min: 1, max: 6 },
      description: "The most toasts showing at once. The rest wait, and each starts its own time when it appears.",
      table: { defaultValue: { summary: "3" } },
    },
    duration: {
      control: "select",
      options: [2000, 5000, 10000, "never"],
      description:
        "How long a toast stays, in milliseconds. \"never\" is null: until it is dismissed. Paused while the pointer is over the toasts or focus is inside them.",
      table: { defaultValue: { summary: "5000" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and type size of every toast.",
      table: { defaultValue: { summary: '"md"' } },
    },
    variant: {
      control: "select",
      options: ["subtle", "outlined", "solid"],
      description: "How every toast is drawn.",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, which sets which way a swipe closes a toast.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger", "neutral"],
      description: "What the message is about, on the standard tone scale. Each has its own icon and colours.",
      table: { defaultValue: { summary: '"info"' } },
    },
    title: {
      control: "text",
      description: "The headline, in a few words.",
    },
    description: {
      control: "text",
      description: "The message itself.",
    },
    showAction: {
      control: "boolean",
      description:
        "Adds an action button with an alternative for a person who won't reach it in time (altText, required).",
      table: { defaultValue: { summary: "false" } },
    },
    dismissible: {
      control: "boolean",
      description: "Adds a button that dismisses it.",
      table: { defaultValue: { summary: "true" } },
    },
    loading: {
      control: "boolean",
      description: "Shows a spinner in place of the icon and keeps the toast until it is updated or dismissed.",
      table: { defaultValue: { summary: "false" } },
    },
    role: {
      control: "select",
      options: ["auto", "alert", "status"],
      description:
        "How it is announced. alert interrupts, status waits for a pause. Left out (auto), it follows the tone: alert for danger and warning, status for the rest.",
    },
    onOpenChange: {
      control: false,
      description: "Called with false when it closes, and { reason }: timeout, dismiss, action, swipe, escape or programmatic.",
    },
  },
  args: {
    placement: "bottom-end",
    limit: 3,
    duration: 5000,
    size: "md",
    variant: "subtle",
    dir: "ltr",
    tone: "success",
    title: "Saved",
    description: "Your changes are live.",
    showAction: false,
    dismissible: true,
    loading: false,
    role: "auto",
    onOpenChange: fn(),
  },
  render: (args) => (
    <ToastStage>
      {(container) => (
        <Toast.Provider
          container={container}
          placement={args.placement}
          limit={args.limit}
          duration={durationFromArg(args.duration)}
          size={args.size}
          variant={args.variant}
          dir={args.dir}
        >
          <RaiseButton label="Show toast" options={() => optionsFromArgs(args)} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below, and press the button to raise a toast. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const Tones: Story = {
  name: "Tones",
  parameters: { docs: { source: { code: toastSnippets.tones } } },
  argTypes: { ...noControls, tone: { control: false } },
  render: (args) => (
    <ToastStage minBlockSize="26rem">
      {(container) => (
        <Toast.Provider container={container} size={args.size} variant={args.variant} limit={5}>
          <ButtonRow>
            {(["info", "success", "warning", "danger", "neutral"] as const).map((tone) => (
              <RaiseButton key={tone} label={tone} options={sampleOptions[tone]} />
            ))}
          </ButtonRow>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Variants: Story = {
  name: "Variants",
  parameters: { docs: { source: { code: toastSnippets.variants } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="26rem">
      {(container) => (
        <Toast.Provider container={container} limit={5}>
          <ButtonRow>
            {(["subtle", "outlined", "solid"] as const).map((variant) => (
              <RaiseButton key={variant} label={variant} options={{ ...sampleOptions.success, variant }} />
            ))}
          </ButtonRow>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: toastSnippets.sizes } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="26rem">
      {(container) => (
        <Toast.Provider container={container} limit={5}>
          <ButtonRow>
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <RaiseButton key={size} label={size} options={{ ...sampleOptions.success, size }} />
            ))}
          </ButtonRow>
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function ActionExample({ container }: { container: HTMLElement | null }) {
  const [archived, setArchived] = useState(false);
  return (
    <Toast.Provider container={container}>
      <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "center" }}>
        <ArchiveButton onArchive={() => setArchived(true)} onUndo={() => setArchived(false)} />
        <Text size="sm">Conversation is {archived ? "archived" : "in your inbox"}.</Text>
      </div>
    </Toast.Provider>
  );
}

function ArchiveButton({ onArchive, onUndo }: { onArchive: () => void; onUndo: () => void }) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        onArchive();
        toast({
          tone: "neutral",
          title: "Conversation archived",
          action: { label: "Undo", altText: "Undo from the Edit menu", onClick: onUndo },
        });
      }}
    >
      Archive
    </Button>
  );
}

export const WithAction: Story = {
  name: "With an action",
  parameters: { docs: { source: { code: toastSnippets.action } } },
  argTypes: { ...noControls },
  render: () => <ToastStage>{(container) => <ActionExample container={container} />}</ToastStage>,
};

function PlacementExample({ container }: { container: HTMLElement | null }) {
  const [placement, setPlacement] = useState<ToastPlacement>("bottom-end");
  return (
    <Toast.Provider container={container} placement={placement}>
      <ButtonRow>
        {(["top-start", "top", "top-end", "bottom-start", "bottom", "bottom-end"] as const).map((value) => (
          <PlacementButton key={value} value={value} onChoose={setPlacement} />
        ))}
      </ButtonRow>
    </Toast.Provider>
  );
}

function PlacementButton({ value, onChoose }: { value: ToastPlacement; onChoose: (value: ToastPlacement) => void }) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        onChoose(value);
        toast({ ...sampleOptions.info, title: value, description: undefined });
      }}
    >
      {value}
    </Button>
  );
}

export const Placements: Story = {
  name: "Placements",
  parameters: { docs: { source: { code: toastSnippets.placement } } },
  argTypes: { ...noControls },
  render: () => <ToastStage minBlockSize="24rem">{(container) => <PlacementExample container={container} />}</ToastStage>,
};

export const ResponsivePlacement: Story = {
  name: "A placement that changes with the screen",
  parameters: { docs: { source: { code: toastSnippets.responsive } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container} placement={{ base: "bottom", md: "top-end" }}>
          <RaiseButton label="Show toast" options={sampleOptions.success} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function PromiseButtons() {
  const { toast } = useToast();
  const run = (succeed: boolean) => {
    const work = new Promise<{ name: string }>((resolve, reject) => {
      setTimeout(() => (succeed ? resolve({ name: "report.pdf" }) : reject(new Error("offline"))), 1600);
    });
    // The rejection is the caller's to handle: the toast only reports it.
    toast
      .promise(work, {
        loading: "Saving…",
        success: (file) => ({ title: "Saved", description: file.name }),
        error: "Could not save",
      })
      .catch(() => undefined);
  };
  return (
    <ButtonRow>
      <Button variant="secondary" onClick={() => run(true)}>
        Save (succeeds)
      </Button>
      <Button variant="secondary" onClick={() => run(false)}>
        Save (fails)
      </Button>
    </ButtonRow>
  );
}

export const Promise_: Story = {
  name: "Following a promise",
  parameters: { docs: { source: { code: toastSnippets.promise } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <PromiseButtons />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

export const Persistent: Story = {
  name: "Kept until it is dismissed",
  parameters: { docs: { source: { code: toastSnippets.persistent } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <RaiseButton
            label="Go offline"
            options={{ tone: "warning", title: "You are offline", description: "Changes are saved here and sync later.", duration: null }}
          />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function QueueButton() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        for (let index = 1; index <= 5; index += 1) toast({ tone: "info", title: `Message ${index}` });
      }}
    >
      Send five
    </Button>
  );
}

export const Queue: Story = {
  name: "A limit, with the rest waiting",
  parameters: { docs: { source: { code: toastSnippets.queue } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage minBlockSize="22rem">
      {(container) => (
        <Toast.Provider container={container} limit={2} duration={3000}>
          <QueueButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function SyncButton() {
  const { toast, update } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        toast({ id: "sync", tone: "info", title: "Syncing…", loading: true });
        setTimeout(() => {
          update("sync", { loading: false, tone: "success", title: "Up to date", duration: 3000 });
        }, 1600);
      }}
    >
      Sync
    </Button>
  );
}

export const Updating: Story = {
  name: "Updated in place",
  parameters: { docs: { source: { code: toastSnippets.update } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container}>
          <SyncButton />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

function DeclaredExample({ container }: { container: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  return (
    <Toast.Provider container={container}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Save
      </Button>
      <Toast tone="success" open={open} onOpenChange={setOpen}>
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Your changes are live.</Toast.Description>
        <Toast.Action altText="Open the file from your recent files">View</Toast.Action>
      </Toast>
    </Toast.Provider>
  );
}

export const Declared: Story = {
  name: "Declared as parts",
  parameters: { docs: { source: { code: toastSnippets.declared } } },
  argTypes: { ...noControls },
  render: () => <ToastStage>{(container) => <DeclaredExample container={container} />}</ToastStage>,
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: toastSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: () => (
    <ToastStage>
      {(container) => (
        <Toast.Provider container={container} dir="rtl" placement="bottom-start">
          <RaiseButton label="حفظ" options={{ tone: "success", title: "تم الحفظ", description: "التغييرات منشورة الآن." }} />
        </Toast.Provider>
      )}
    </ToastStage>
  ),
};

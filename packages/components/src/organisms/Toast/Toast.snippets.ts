// The code shown under each story's "Show code" button on Toast's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps the toasts inside their Docs frame, the `container` it is given, the buttons that raise
// them), which can't be pasted anywhere. Each snippet is the smallest real usage of what its story shows, and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.
//
// A snippet is JSX only, so it can't call a hook: the `useToast()` line is a comment above the handler that uses it,
// and `toast` is the function it returns.

import type { ToastPlacement, ToastSize, ToastTone, ToastVariant } from "./Toast.types";

const hook = `{/* const { toast } = useToast(); — in a component rendered inside the provider */}`;

const provider = (attributes: string, inner: string) =>
  `<Toast.Provider${attributes ? ` ${attributes}` : ""}>
${inner}
</Toast.Provider>`;

const button = (label: string, call: string) => `  <Button onClick={() => ${call}}>${label}</Button>`;

export const toastSnippets = {
  tones: `${hook}
{/* tone: "info" (default) | "success" | "warning" | "danger" | "neutral". Each has its own icon, and danger and
    warning interrupt a screen reader where the rest wait for a pause. */}
<Button onClick={() => toast({ tone: "success", title: "Saved", description: "Your changes are live." })}>
  Save
</Button>`,

  variants: `{/* variant: "subtle" (default) | "outlined" | "solid", the same three treatments as Alert. Set once on
    the provider for every toast, or on one toast. */}
${provider('variant="outlined"', button("Save", 'toast({ tone: "success", title: "Saved", variant: "solid" })'))}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — padding and type, on the shared scale. Set once on
    the provider for every toast, or on one toast. */}
${provider('size="lg"', button("Save", 'toast({ tone: "success", title: "Saved", size: "sm" })'))}`,

  action: `${hook}
{/* altText is required: how to do the same thing without the toast. A toast goes away by itself, so its
    action is never the only way. */}
<Button
  onClick={() =>
    toast({
      title: "Conversation archived",
      action: { label: "Undo", altText: "Undo from the Edit menu", onClick: undoArchive },
    })
  }
>
  Archive
</Button>`,

  placement: `{/* placement: "bottom-end" (default) | "bottom" | "bottom-start" | "top-end" | "top" | "top-start".
    start and end are logical: the left and right in left-to-right text, swapped in right-to-left. */}
${provider('placement="top"', button("Save", 'toast({ tone: "success", title: "Saved" })'))}`,

  responsive: `{/* A mobile-first map, like Stack and Grid: along the bottom on a phone, in the top corner from md. */}
${provider('placement={{ base: "bottom", md: "top-end" }}', button("Save", 'toast({ tone: "success", title: "Saved" })'))}`,

  promise: `${hook}
{/* The loading toast stays until the promise settles, then becomes the success or the error one, in the same
    place. The promise itself is returned, so it can still be awaited and its rejection handled. */}
<Button
  onClick={() =>
    toast.promise(saveChanges(), {
      loading: "Saving…",
      success: (file) => ({ title: "Saved", description: file.name }),
      error: "Could not save",
    })
  }
>
  Save
</Button>`,

  persistent: `${hook}
{/* duration: milliseconds, or null to keep it until it is dismissed. Left out, the provider's applies
    (5000). It pauses while the pointer is over the toasts or focus is inside them. */}
<Button onClick={() => toast({ tone: "warning", title: "You are offline", duration: null })}>
  Go offline
</Button>`,

  queue: `{/* limit: the most showing at once (3 by default). The rest wait, and each starts its own time when it
    appears. */}
${provider("limit={2}", button("Send five", "sendFive()"))}`,

  update: `${hook}
{/* The same id again replaces what is showing in place, so a repeated message stays one toast. update()
    changes some of it and keeps the rest. */}
<Button onClick={() => toast({ id: "sync", tone: "info", title: "Syncing…", loading: true })}>
  Sync
</Button>`,

  promiseAction: `${hook}
{/* onClick may return a promise: the toast stays open with a spinner on the button (past its time, and against
    Escape, a swipe and the dismiss button) until it resolves, and then closes. A rejection keeps it open and
    goes to onError; with none it is left unhandled, so it is never lost. */}
<Button
  onClick={() =>
    toast({
      title: "Conversation deleted",
      action: {
        label: "Undo",
        altText: "Restore it from Trash",
        onClick: () => restoreConversation(),
        onError: () => toast({ tone: "danger", title: "Could not restore it" }),
      },
    })
  }
>
  Delete
</Button>`,

  merged: `${hook}
{/* The same plain message raised again while it is showing is one toast with a count, and its time starts
    again. A message with an id never merges, nor does one whose action or callbacks are different functions. */}
<Button onClick={() => toast({ tone: "neutral", title: "Link copied" })}>Copy link</Button>

{/* Turn it off for every toast */}
<Toast.Provider mergeDuplicates={false}>{/* your app */}</Toast.Provider>`,

  outside: `{/* In a module, anywhere:
    export const toaster = createToaster();
    toaster.toast({ tone: "danger", title: "Could not reach the server" });
    Toasts raised before the provider mounts wait for it. One provider per toaster. */}
<Toast.Provider toaster={toaster}>{/* your app */}</Toast.Provider>`,

  clearAll: `{/* clearAll (on by default) draws a "Clear all" button once more than one toast is showing; it also
    drops the ones waiting. labels.clearAll renames it. */}
<Toast.Provider clearAll={false}>{/* your app */}</Toast.Provider>`,

  declared: `{/* const [open, setOpen] = useState(false); */}
<Toast.Provider>
  <Toast tone="success" open={open} onOpenChange={setOpen}>
    <Toast.Title>Saved</Toast.Title>
    <Toast.Description>Your changes are live.</Toast.Description>
    <Toast.Action altText="Open the file from your recent files">View</Toast.Action>
  </Toast>
</Toast.Provider>`,

  rightToLeft: `{/* dir="rtl": placement="bottom-start" is the bottom-right corner, and a swipe toward it closes a toast. */}
${provider('dir="rtl" placement="bottom-start"', button("حفظ", 'toast({ tone: "success", title: "تم الحفظ" })'))}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ToastPlaygroundSnippetArgs {
  title?: string;
  description?: string;
  tone?: ToastTone;
  variant?: ToastVariant;
  size?: ToastSize;
  /** `false`, a component, or the Playground control's option key (`"Default"`, `"None"`, `"Star"`, `"Heart"`). */
  icon?: unknown;
  loading?: boolean;
  showAction?: boolean;
  actionVariant?: "primary" | "secondary" | "tertiary";
  dismissible?: boolean;
  /** `"alert"`, `"status"`, or the Playground control's `"Default"` (the tone's own). */
  role?: "alert" | "status" | "Default";
  /** The toast's own identifier (the `id` option), from the Playground's `toastId` control. */
  toastId?: string;
  /** Milliseconds, `null` for until dismissed, or the Playground control's option key `"Until dismissed"` / `"never"`. */
  duration?: number | null | "never" | "Until dismissed";
  placement?: ToastPlacement;
  limit?: number;
  clearAll?: boolean;
  mergeDuplicates?: boolean;
  /** The keys as an array, or the Playground control's option key (`"F8"`, `"Alt + T"`). */
  hotkey?: string[] | "F8" | "Alt + T";
  dir?: "ltr" | "rtl";
}

const quoteText = (value: string) => JSON.stringify(value);

const iconNames: Record<string, string> = { Star: "StarIcon", Heart: "HeartIcon" };

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around a
 * small real call.
 */
export function toastPlaygroundSnippet(args: ToastPlaygroundSnippetArgs): string {
  const providerAttributes: string[] = [];
  if (args.placement && args.placement !== "bottom-end") providerAttributes.push(`placement="${args.placement}"`);
  if (args.size && args.size !== "md") providerAttributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "subtle") providerAttributes.push(`variant="${args.variant}"`);
  if (args.limit !== undefined && args.limit !== 3) providerAttributes.push(`limit={${args.limit}}`);
  // The Playground's select hands over its option key, not the mapped value.
  if (args.duration === null || args.duration === "never" || args.duration === "Until dismissed") providerAttributes.push("duration={null}");
  else if (args.duration !== undefined && args.duration !== 5000) providerAttributes.push(`duration={${args.duration}}`);
  if (args.clearAll === false) providerAttributes.push("clearAll={false}");
  if (args.mergeDuplicates === false) providerAttributes.push("mergeDuplicates={false}");
  if (args.hotkey === "Alt + T" || (Array.isArray(args.hotkey) && args.hotkey.join("+") === "altKey+KeyT")) {
    providerAttributes.push('hotkey={["altKey", "KeyT"]}');
  }
  if (args.dir === "rtl") providerAttributes.push('dir="rtl"');

  // A custom icon is written by name, from the control's option key or from the component it resolved to.
  const iconKey =
    typeof args.icon === "string"
      ? args.icon
      : args.icon === false
        ? "None"
        : args.icon === undefined
          ? "Default"
          : "custom";
  const iconName = iconNames[iconKey];

  const fields: string[] = [];
  if (args.toastId) fields.push(`id: ${quoteText(args.toastId)}`);
  if (args.title) fields.push(`title: ${quoteText(args.title)}`);
  if (args.description) fields.push(`description: ${quoteText(args.description)}`);
  if (args.tone && args.tone !== "info") fields.push(`tone: "${args.tone}"`);
  if (iconKey === "None") fields.push("icon: false");
  else if (iconName) fields.push(`icon: ${iconName}`);
  if (args.loading) fields.push("loading: true");
  if (args.showAction) {
    const variant = args.actionVariant && args.actionVariant !== "primary" ? `, variant: "${args.actionVariant}"` : "";
    fields.push(`action: { label: "Undo", altText: "Undo from the Edit menu", onClick: undo${variant} }`);
  }
  if (args.dismissible === false) fields.push("dismissible: false");
  if (args.role === "alert" || args.role === "status") fields.push(`role: "${args.role}"`);

  const call = fields.length > 0 ? `toast({ ${fields.join(", ")} })` : `toast({ title: "Saved" })`;
  const icon = iconName ? `{/* ${iconName} comes from @dbm-design-system/icons */}\n` : "";
  return `${icon}${hook}
${provider(providerAttributes.join(" "), `  <Button onClick={() => ${call}}>Show toast</Button>`)}`;
}

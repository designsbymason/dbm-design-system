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
  placement?: ToastPlacement;
  limit?: number;
  /** Milliseconds, `null` for until dismissed, or the Playground control's option key `"never"`. */
  duration?: number | null | "never";
  size?: ToastSize;
  variant?: ToastVariant;
  dir?: "ltr" | "rtl";
  tone?: ToastTone;
  title?: string;
  description?: string;
  showAction?: boolean;
  dismissible?: boolean;
  loading?: boolean;
}

const quoteText = (value: string) => JSON.stringify(value);

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around a
 * small real call.
 */
export function toastPlaygroundSnippet(args: ToastPlaygroundSnippetArgs): string {
  const providerAttributes: string[] = [];
  if (args.placement && args.placement !== "bottom-end") providerAttributes.push(`placement="${args.placement}"`);
  if (args.limit !== undefined && args.limit !== 3) providerAttributes.push(`limit={${args.limit}}`);
  // The Playground's select hands over its option key, not the mapped value.
  if (args.duration === null || args.duration === "never") providerAttributes.push("duration={null}");
  else if (args.duration !== undefined && args.duration !== 5000) providerAttributes.push(`duration={${args.duration}}`);
  if (args.size && args.size !== "md") providerAttributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "subtle") providerAttributes.push(`variant="${args.variant}"`);
  if (args.dir === "rtl") providerAttributes.push('dir="rtl"');

  const fields: string[] = [];
  if (args.tone && args.tone !== "info") fields.push(`tone: "${args.tone}"`);
  if (args.loading) fields.push("loading: true");
  if (args.title) fields.push(`title: ${quoteText(args.title)}`);
  if (args.description) fields.push(`description: ${quoteText(args.description)}`);
  if (args.showAction) {
    fields.push('action: { label: "Undo", altText: "Undo from the Edit menu", onClick: undo }');
  }
  if (args.dismissible === false) fields.push("dismissible: false");

  const call = fields.length > 0 ? `toast({ ${fields.join(", ")} })` : `toast({ title: "Saved" })`;
  return `${hook}
${provider(providerAttributes.join(" "), `  <Button onClick={() => ${call}}>Show toast</Button>`)}`;
}

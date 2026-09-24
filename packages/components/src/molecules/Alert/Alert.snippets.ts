// The code shown under each story's "Show code" button on Alert's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers (`DemoAlert`, `demoContainerStyle`), which can't be pasted anywhere. Each snippet here is the smallest real
// usage of what its story shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { AlertRole, AlertSize, AlertTone, AlertVariant } from "./Alert.types";

const body = (
  title = "Payment failed",
  description = "Your card was declined. Update it to keep your plan.",
) => `  <Alert.Title>${title}</Alert.Title>\n  <Alert.Description>${description}</Alert.Description>`;

const alert = (attributes = "", inner = body()) =>
  `<Alert${attributes ? ` ${attributes}` : ""}>\n${inner}\n</Alert>`;

const withActions = `${body()}
  <Alert.Actions>
    <Alert.Action>Update card</Alert.Action>
    <Alert.Action variant="tertiary">Remind me later</Alert.Action>
  </Alert.Actions>`;

export const alertSnippets = {
  tones: `{/* tone: "info" (default) | "success" | "warning" | "danger" | "neutral". Each has its own icon, and
    danger and warning are announced at once (role="alert"); the rest wait (role="status"). */}
${alert('tone="danger"')}`,

  variants: `{/* variant: "subtle" (default) | "outlined" | "solid" */}
${alert('tone="success" variant="outlined"', body("Saved", "Your changes are live."))}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — padding and type size */}
${alert('size="sm"')}`,

  actions: `{/* Alert.Actions holds what the reader can do about it, and wraps when short of room. Alert.Action is a
    Button that takes the alert's colours and size, so it reads against every tone and variant. */}
${alert('tone="warning"', withActions)}`,

  actionVariants: `{/* Alert.Action variant: "primary" (default) | "secondary" | "tertiary". How each looks depends on the
    alert's tone and variant, and its size follows the alert's. */}
<Alert tone="danger" variant="solid">
  <Alert.Description>Your card was declined.</Alert.Description>
  <Alert.Actions>
    <Alert.Action>Update card</Alert.Action>
    <Alert.Action variant="secondary">Try again</Alert.Action>
    <Alert.Action variant="tertiary">Remind me later</Alert.Action>
  </Alert.Actions>
</Alert>`,

  titleOnly: `{/* Every part is optional */}
<Alert tone="success">
  <Alert.Title>Your changes were saved</Alert.Title>
</Alert>`,

  plainText: `{/* The shortest alert: plain text */}
<Alert>Your session will expire in five minutes.</Alert>`,

  icons: `{/* icon: your own (a component from @dbm-design-system/icons), or false for none */}
<Alert icon={false}>
  <Alert.Description>No icon on this one.</Alert.Description>
</Alert>
<Alert icon={StarIcon} tone="neutral">
  <Alert.Description>Your own icon replaces the tone's.</Alert.Description>
</Alert>`,

  banner: `{/* banner: edge to edge, square corners, no side borders — for a whole page or section */}
${alert("banner", body("Scheduled maintenance", "The dashboard will be read-only on Sunday from 02:00 to 04:00 UTC."))}`,

  sticky: `{/* sticky keeps it at the top as the page scrolls (built on Affix), lifted with a shadow while
    stuck. stickyOffset leaves room for a sticky header; scrollContainerRef, for a scrolling panel. */}
${alert("banner sticky dismissible", body("Scheduled maintenance", "The dashboard will be read-only on Sunday."))}`,

  dismissible: `{/* dismissible adds a button; uncontrolled, it closes itself, and onOpenChange(false) reports it */}
${alert("dismissible", body("Tip", "You can press ? at any time to see the keyboard shortcuts."))}`,

  controlled: `{/* You own whether it is showing: const [open, setOpen] = useState(true); */}
${alert("dismissible open={open} onOpenChange={setOpen}")}`,

  persistent: `{/* Remember the dismissal across visits: const { ready, dismissed, dismiss } = usePersistentDismiss("summer-sale-2027");
    ready is false until the browser has been asked, so nothing flashes on a server-rendered page. */}
${alert(
  "banner dismissible open={ready && !dismissed} onOpenChange={(open) => !open && dismiss()}",
  body("Summer sale", "Everything is 20% off until Sunday."),
)}`,

  heading: `{/* asChild puts the title on your own element — here a real heading */}
<Alert tone="warning">
  <Alert.Title asChild><h2>Your trial ends soon</h2></Alert.Title>
  <Alert.Description>Add a payment method to keep your projects.</Alert.Description>
</Alert>`,

  role: `{/* role: "alert" (interrupts) | "status" (waits) | "none". The default follows the tone; "none" is right for
    a message that is already on the page when it loads. */}
${alert('tone="warning" role="none"')}`,

  translated: `{/* labels holds every piece of text the component writes itself */}
${alert('dismissible labels={{ dismiss: "Fermer" }}')}`,

  longContent: `{/* Long words and long messages wrap inside the alert */}
${alert(
  'tone="info"',
  body("A title that is long enough to run onto a second line in a narrow place", "A message with a very long unbroken address: https://example.com/a/very/long/path/that/has/no/break/points"),
)}`,

  rightToLeft: `{/* dir="rtl" mirrors the layout: the icon and the dismiss button swap sides */}
${alert('dismissible dir="rtl"')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface AlertPlaygroundSnippetArgs {
  tone?: AlertTone;
  variant?: AlertVariant;
  size?: AlertSize;
  icon?: unknown;
  banner?: boolean;
  sticky?: boolean;
  dismissible?: boolean;
  role?: AlertRole | "Default";
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, on a small
 * real alert. `icon` arrives as the control's option key ("None", "Star") or as the mapped value (`false`, a component).
 */
export function alertPlaygroundSnippet(args: AlertPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.tone && args.tone !== "info") attributes.push(`tone="${args.tone}"`);
  if (args.variant && args.variant !== "subtle") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.icon === false || args.icon === "None") attributes.push("icon={false}");
  else if (args.icon === "Star" || (typeof args.icon !== "string" && args.icon !== undefined && args.icon !== false)) {
    attributes.push("icon={StarIcon}");
  }
  if (args.banner) attributes.push("banner");
  if (args.sticky) attributes.push("sticky");
  if (args.dismissible) attributes.push("dismissible");
  if (args.role && args.role !== "Default") attributes.push(`role=${quote(args.role)}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  const star = attributes.includes("icon={StarIcon}") ? "{/* StarIcon comes from @dbm-design-system/icons */}\n" : "";
  return star + alert(attributes.join(" "), withActions);
}

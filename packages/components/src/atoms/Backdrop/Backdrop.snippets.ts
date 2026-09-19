// The code shown under each story's "Show code" button on Backdrop's Docs page.
//
// Hand-written rather than generated from the rendered story: three of the stories only mount
// the `Backdrop` after a click, so the generated code shows the `Button` and the story's
// `<DemoBackground />` and no `Backdrop` at all; the others print `onClick={() => {}}`,
// `blur={false}` and `open={false}` next to that helper. Backdrop is driven by the reader's
// own state, so each snippet names it in a comment and wires `open` / `onClick` to it. Each
// snippet here is the smallest real usage of what its story shows — only exports of the
// package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { BackdropProps } from "./Backdrop.types";

export const backdropSnippets = {
  clickToDismiss: `{/* const [isOpen, setIsOpen] = useState(false); */}
{/* Mount the Backdrop while it should show; a click on it dismisses. It sits over the page and dims it. */}
{isOpen && <Backdrop onClick={() => setIsOpen(false)} />}`,

  animatedDismiss: `{/* const [isOpen, setIsOpen] = useState(false); */}
{/* Keep it mounted and drive open instead: the Backdrop fades out rather than disappearing at once. */}
<Backdrop open={isOpen} onClick={() => setIsOpen(false)} />`,

  blurred: `{/* const [isOpen, setIsOpen] = useState(false); */}
{/* blur softens whatever is behind the Backdrop as well as dimming it */}
{isOpen && <Backdrop blur onClick={() => setIsOpen(false)} />}`,

  withContent: `{/* const [isOpen, setIsOpen] = useState(false); */}
{/* Children render centered on the Backdrop — a loading overlay here. Spinner sits on the dark fill, so
    it uses the white tone. */}
{isOpen && (
  <Backdrop onClick={() => setIsOpen(false)}>
    <Spinner size="xl" tone="white" />
  </Backdrop>
)}`,

  inPlace: `{/* inPortal={false} renders the Backdrop where it's declared instead of on document.body. Give its
    container position: relative to contain it, and the Backdrop itself position: absolute. */}
<div style={{ position: "relative", height: "12rem", overflow: "hidden" }}>
  <p>Content behind the Backdrop</p>
  <Backdrop inPortal={false} open style={{ position: "absolute" }} />
</div>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface BackdropPlaygroundSnippetArgs {
  open?: boolean;
  opacity?: BackdropProps["opacity"];
  blur?: boolean;
  inPortal?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: `open` is the reader's state, so
 * it's written as `open={isOpen}` with the click wired to close it, then only what differs from
 * the defaults (an opacity of 60, no blur, rendered in a portal).
 */
export function backdropPlaygroundSnippet(args: BackdropPlaygroundSnippetArgs): string {
  const attributes = ["open={isOpen}", "onClick={() => setIsOpen(false)}"];
  if (args.opacity !== undefined && args.opacity !== 60) attributes.push(`opacity={${args.opacity}}`);
  if (args.blur) attributes.push("blur");
  if (args.inPortal === false) attributes.push("inPortal={false}");
  return `{/* const [isOpen, setIsOpen] = useState(false); */}\n<Backdrop ${attributes.join(" ")} />`;
}

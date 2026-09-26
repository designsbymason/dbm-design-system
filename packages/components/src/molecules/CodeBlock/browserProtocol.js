// The Chrome DevTools Protocol, as the test browser exposes it — for the checks only a browser's own accessibility
// tree or media emulation can make.
//
// Two things about this file are deliberate. It is plain `.js`, with its types in `browserProtocol.d.ts`, because
// importing `vitest/browser` from TypeScript makes the whole project load its type declarations, which replace the
// `toHaveStyle` typing every other test relies on. And the import is dynamic, inside `send`, because `vitest/browser`
// throws when it is evaluated anywhere but the test runner: a top-level import here would break the stories module —
// and with it the Docs page and every story — in a real Storybook. Only the hidden `!dev` interaction checks call it.
export async function send(method, params) {
  const { cdp } = await import("vitest/browser");
  return cdp().send(method, params);
}
